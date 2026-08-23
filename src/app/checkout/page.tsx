'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import { processCheckoutAction, CheckoutPayload } from '@/modules/checkout/actions';
import { getCheckoutSettingsAction, CheckoutSettings } from '@/modules/checkout/checkoutSettingsActions';
import CheckoutOrderSummary from '@/components/checkout/CheckoutOrderSummary';
import styles from './page.module.css';

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const router = useRouter();

    const [settings, setSettings] = useState<CheckoutSettings | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);

    const [submitting, setSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Customer Form State
    const [formData, setFormData] = useState({
        customerName: '',
        countryPrefix: '+51',
        customerPhone: '',
        customerEmail: '',
        notes: '',

        // Shipping / Recipient Address State
        shippingMethodId: 'delivery_local',
        recipientName: '',
        recipientPhone: '',
        department: 'Lima',
        province: 'Lima',
        district: 'Miraflores',
        addressLine: '',
        reference: '',
        postalCode: '',

        // Payment State
        paymentMethod: 'yape',

        // Terms & Approvals
        acceptTerms: false,
        acceptMarketing: false,
        isAgeConfirmed: false,
    });

    // 1. Fetch Store Settings & Autocomplete User Profile
    useEffect(() => {
        let isCurrent = true;
        (async () => {
            setLoadingSettings(true);
            const res = await getCheckoutSettingsAction();
            if (isCurrent && res.success && res.settings) {
                setSettings(res.settings);
                
                // Select default active shipping and payment methods
                const firstShipping = res.settings.shipping_methods[0]?.id || 'delivery_local';
                const firstPayment = res.settings.payment_methods[0]?.id || 'yape';
                
                setFormData(prev => ({
                    ...prev,
                    shippingMethodId: firstShipping,
                    paymentMethod: firstPayment
                }));
            }

            // Check logged in user
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (isCurrent && user) {
                    const fullName = user.user_metadata?.full_name || '';
                    const email = user.email || '';
                    const phone = user.user_metadata?.phone || '';

                    setFormData(prev => ({
                        ...prev,
                        customerName: prev.customerName || fullName,
                        customerEmail: prev.customerEmail || email,
                        customerPhone: prev.customerPhone || phone,
                        recipientName: prev.recipientName || fullName,
                        recipientPhone: prev.recipientPhone || phone
                    }));
                }
            } catch {
                // Ignore auth fallback
            }

            if (isCurrent) setLoadingSettings(false);
        })();

        return () => {
            isCurrent = false;
        };
    }, []);

    const selectedShipping = settings?.shipping_methods.find(s => s.id === formData.shippingMethodId);

    const shippingCostCents = selectedShipping ? selectedShipping.price_amount : 0;
    const finalTotalCents = Math.max(0, Math.round(total * 100) + shippingCostCents);
    const finalTotalFormatted = formatMoney(finalTotalCents / 100, settings?.currency || 'PEN');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData(prev => ({ ...prev, [name]: val }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateFrontend = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.customerName.trim()) {
            errors.customerName = 'Por favor ingresa tu nombre completo.';
        }

        if (!formData.customerPhone.trim()) {
            errors.customerPhone = 'Por favor ingresa tu teléfono de contacto o WhatsApp.';
        }

        if (settings?.require_email && (!formData.customerEmail || !formData.customerEmail.includes('@'))) {
            errors.customerEmail = 'Por favor ingresa un correo electrónico válido.';
        }

        if (selectedShipping?.requires_address) {
            if (!formData.department.trim()) errors.department = 'Selecciona tu departamento.';
            if (!formData.province.trim()) errors.province = 'Selecciona tu provincia.';
            if (!formData.district.trim()) errors.district = 'Selecciona tu distrito.';
            if (!formData.addressLine.trim()) errors.addressLine = 'Ingresa tu dirección exacta de entrega.';
        }

        if (!formData.acceptTerms) {
            errors.acceptTerms = 'Debes aceptar los términos y condiciones para continuar.';
        }

        if (settings?.require_age_confirmation && !formData.isAgeConfirmed) {
            errors.isAgeConfirmed = 'Debes confirmar que cumples con la edad mínima legal.';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const buildPayload = (orderType: 'order' | 'quote' = 'order'): CheckoutPayload => {
        const fullPhone = `${formData.countryPrefix} ${formData.customerPhone.trim()}`;
        return {
            customerName: formData.customerName.trim(),
            customerEmail: formData.customerEmail.trim(),
            customerPhone: fullPhone,
            shippingMethodId: formData.shippingMethodId,
            paymentMethod: formData.paymentMethod,
            notes: formData.notes.trim() || undefined,
            recipientName: formData.recipientName.trim() || formData.customerName.trim(),
            recipientPhone: formData.recipientPhone.trim() ? `${formData.countryPrefix} ${formData.recipientPhone.trim()}` : fullPhone,
            department: selectedShipping?.requires_address ? formData.department.trim() : undefined,
            province: selectedShipping?.requires_address ? formData.province.trim() : undefined,
            district: selectedShipping?.requires_address ? formData.district.trim() : undefined,
            addressLine: selectedShipping?.requires_address ? formData.addressLine.trim() : undefined,
            reference: selectedShipping?.requires_address ? formData.reference.trim() : undefined,
            postalCode: selectedShipping?.requires_address ? formData.postalCode.trim() : undefined,
            isAgeConfirmed: formData.isAgeConfirmed,
            orderType,
            items: items.map(i => ({
                productId: i.id,
                quantity: i.quantity || 1,
                variantId: i.selectedVariant?.id
            }))
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (items.length === 0) {
            toast.error('Tu carrito está vacío.');
            return;
        }

        if (!validateFrontend()) {
            toast.error('Por favor completa los campos requeridos marcados en rojo.');
            return;
        }

        setSubmitting(true);

        const payload = buildPayload('order');
        const res = await processCheckoutAction(payload);
        setSubmitting(false);

        if (res.success && res.redirectUrl) {
            clearCart();
            toast.success(`¡Pedido ${res.orderNumber} creado exitosamente!`);
            router.push(res.redirectUrl);
        } else {
            if (res.fieldErrors) {
                setFieldErrors(res.fieldErrors);
            }
            toast.error(res.error || 'No pudimos crear tu pedido. Revisa tus datos e inténtalo nuevamente.');
        }
    };

    const handleRequestQuote = async () => {
        if (!formData.customerName || !formData.customerPhone) {
            toast.error('Por favor ingresa tu nombre y teléfono para solicitar la cotización.');
            return;
        }

        setSubmitting(true);
        const payload = buildPayload('quote');
        const res = await processCheckoutAction(payload);
        setSubmitting(false);

        if (res.success && res.redirectUrl) {
            clearCart();
            toast.success(`¡Solicitud de cotización ${res.orderNumber} enviada!`);
            router.push(res.redirectUrl);
        } else {
            toast.error(res.error || 'No se pudo registrar la cotización.');
        }
    };

    if (loadingSettings) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚙️</div>
                    <h2>Cargando checkout seguro...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                {/* CHECKOUT HEADER */}
                <header className={styles.checkoutHeader}>
                    <Link href="/" className={styles.backBtn}>
                        ← Volver a la Tienda
                    </Link>
                    <h1 className={styles.pageTitle}>Finalizar Pedido</h1>
                    <div style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🔒 Checkout Seguro SSL
                    </div>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className={styles.grid}>
                        {/* LEFT COLUMN: 4 STEPS FORM */}
                        <div className={styles.formColumn}>

                            {/* STEP 1: DATOS DEL CLIENTE */}
                            <div className={styles.stepCard}>
                                <div className={styles.stepHeader}>
                                    <div className={styles.stepNumber}>1</div>
                                    <h2 className={styles.stepTitle}>Datos del Cliente</h2>
                                </div>

                                <div className={styles.formGrid}>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label className={styles.label}>
                                            Nombre Completo<span className={styles.requiredStar}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="customerName"
                                            value={formData.customerName}
                                            onChange={handleInputChange}
                                            placeholder="Ej: Juan Pérez Morales"
                                            className={`${styles.input} ${fieldErrors.customerName ? styles.inputError : ''}`}
                                            required
                                        />
                                        {fieldErrors.customerName && <span className={styles.errorText}>{fieldErrors.customerName}</span>}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            Teléfono / WhatsApp<span className={styles.requiredStar}>*</span>
                                        </label>
                                        <div className={styles.phoneGroup}>
                                            <select
                                                name="countryPrefix"
                                                value={formData.countryPrefix}
                                                onChange={handleInputChange}
                                                className={`${styles.select} ${styles.prefixSelect}`}
                                            >
                                                <option value="+51">🇵🇪 +51</option>
                                                <option value="+57">🇨🇴 +57</option>
                                                <option value="+52">🇲🇽 +52</option>
                                                <option value="+56">🇨🇱 +56</option>
                                                <option value="+54">🇦🇷 +54</option>
                                                <option value="+1">🇺🇸 +1</option>
                                            </select>
                                            <input
                                                type="tel"
                                                name="customerPhone"
                                                value={formData.customerPhone}
                                                onChange={handleInputChange}
                                                placeholder="987 654 321"
                                                className={`${styles.input} ${fieldErrors.customerPhone ? styles.inputError : ''}`}
                                                required
                                            />
                                        </div>
                                        {fieldErrors.customerPhone && <span className={styles.errorText}>{fieldErrors.customerPhone}</span>}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            Correo Electrónico{settings?.require_email && <span className={styles.requiredStar}>*</span>}
                                        </label>
                                        <input
                                            type="email"
                                            name="customerEmail"
                                            value={formData.customerEmail}
                                            onChange={handleInputChange}
                                            placeholder="cliente@ejemplo.com"
                                            className={`${styles.input} ${fieldErrors.customerEmail ? styles.inputError : ''}`}
                                        />
                                        {fieldErrors.customerEmail && <span className={styles.errorText}>{fieldErrors.customerEmail}</span>}
                                    </div>

                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label className={styles.label}>Notas o Indicaciones Especiales</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            placeholder="Ej: Entregar en portería o llamar antes de llegar..."
                                            rows={2}
                                            className={styles.textarea}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* STEP 2: ENTREGA */}
                            <div className={styles.stepCard}>
                                <div className={styles.stepHeader}>
                                    <div className={styles.stepNumber}>2</div>
                                    <h2 className={styles.stepTitle}>Método de Entrega</h2>
                                </div>

                                <div className={styles.optionsList}>
                                    {(settings?.shipping_methods || []).map(method => (
                                        <label
                                            key={method.id}
                                            className={`${styles.optionCard} ${formData.shippingMethodId === method.id ? styles.selected : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="shippingMethodId"
                                                value={method.id}
                                                checked={formData.shippingMethodId === method.id}
                                                onChange={handleInputChange}
                                                className={styles.radioInput}
                                            />
                                            <div className={styles.optionDetails}>
                                                <div className={styles.optionHeaderRow}>
                                                    <span className={styles.optionName}>{method.name}</span>
                                                    <span className={styles.optionPrice}>
                                                        {method.price_amount === 0 ? 'Gratis' : method.price_formatted}
                                                    </span>
                                                </div>
                                                {method.estimated_days && (
                                                    <div className={styles.optionSubtext}>
                                                        ⏱️ Tiempo estimado: {method.estimated_days}
                                                    </div>
                                                )}
                                                {!method.requires_address && method.address_details && (
                                                    <div className={styles.optionSubtext} style={{ color: '#22c55e', fontWeight: 600 }}>
                                                        📍 Dirección de recojo: {method.address_details}
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {/* ADDRESS FORM (ONLY IF SHIPPING REQUIRES ADDRESS) */}
                                {selectedShipping?.requires_address && (
                                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '16px', color: 'var(--foreground)' }}>
                                            Dirección de Despacho
                                        </h3>
                                        <div className={styles.formGrid}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>
                                                    Departamento<span className={styles.requiredStar}>*</span>
                                                </label>
                                                <select
                                                    name="department"
                                                    value={formData.department}
                                                    onChange={handleInputChange}
                                                    className={`${styles.select} ${fieldErrors.department ? styles.inputError : ''}`}
                                                >
                                                    <option value="Lima">Lima</option>
                                                    <option value="Arequipa">Arequipa</option>
                                                    <option value="Cusco">Cusco</option>
                                                    <option value="La Libertad">La Libertad</option>
                                                    <option value="Piura">Piura</option>
                                                    <option value="Lambayeque">Lambayeque</option>
                                                    <option value="Junín">Junín</option>
                                                    <option value="Puno">Puno</option>
                                                    <option value="Ica">Ica</option>
                                                    <option value="Tacna">Tacna</option>
                                                </select>
                                                {fieldErrors.department && <span className={styles.errorText}>{fieldErrors.department}</span>}
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>
                                                    Provincia<span className={styles.requiredStar}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="province"
                                                    value={formData.province}
                                                    onChange={handleInputChange}
                                                    placeholder="Ej: Lima"
                                                    className={`${styles.input} ${fieldErrors.province ? styles.inputError : ''}`}
                                                />
                                                {fieldErrors.province && <span className={styles.errorText}>{fieldErrors.province}</span>}
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>
                                                    Distrito<span className={styles.requiredStar}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="district"
                                                    value={formData.district}
                                                    onChange={handleInputChange}
                                                    placeholder="Ej: Miraflores / Surco / San Isidro"
                                                    className={`${styles.input} ${fieldErrors.district ? styles.inputError : ''}`}
                                                />
                                                {fieldErrors.district && <span className={styles.errorText}>{fieldErrors.district}</span>}
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Código Postal (Opcional)</label>
                                                <input
                                                    type="text"
                                                    name="postalCode"
                                                    value={formData.postalCode}
                                                    onChange={handleInputChange}
                                                    placeholder="15036"
                                                    className={styles.input}
                                                />
                                            </div>

                                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                                <label className={styles.label}>
                                                    Dirección Exacta<span className={styles.requiredStar}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="addressLine"
                                                    value={formData.addressLine}
                                                    onChange={handleInputChange}
                                                    placeholder="Ej: Av. Principal 123, Dpto 402"
                                                    className={`${styles.input} ${fieldErrors.addressLine ? styles.inputError : ''}`}
                                                />
                                                {fieldErrors.addressLine && <span className={styles.errorText}>{fieldErrors.addressLine}</span>}
                                            </div>

                                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                                <label className={styles.label}>Referencia de Ubicación</label>
                                                <input
                                                    type="text"
                                                    name="reference"
                                                    value={formData.reference}
                                                    onChange={handleInputChange}
                                                    placeholder="Ej: Frente al parque o al lado del grifo"
                                                    className={styles.input}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* STEP 3: MÉTODO DE PAGO */}
                            <div className={styles.stepCard}>
                                <div className={styles.stepHeader}>
                                    <div className={styles.stepNumber}>3</div>
                                    <h2 className={styles.stepTitle}>Método de Pago</h2>
                                </div>

                                {fieldErrors.paymentMethod && (
                                    <div style={{ marginBottom: '14px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 700 }}>
                                        ⚠️ {fieldErrors.paymentMethod}
                                    </div>
                                )}

                                <div className={styles.optionsList}>
                                    {(settings?.payment_methods || []).map(method => {
                                        const isDisabled = method.allowed_shipping_methods &&
                                            method.allowed_shipping_methods.length > 0 &&
                                            !method.allowed_shipping_methods.includes(formData.shippingMethodId);

                                        return (
                                            <label
                                                key={method.id}
                                                className={`${styles.optionCard} ${formData.paymentMethod === method.id ? styles.selected : ''}`}
                                                style={{ opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value={method.id}
                                                    disabled={isDisabled}
                                                    checked={formData.paymentMethod === method.id}
                                                    onChange={handleInputChange}
                                                    className={styles.radioInput}
                                                />
                                                <div className={styles.optionDetails}>
                                                    <div className={styles.optionHeaderRow}>
                                                        <span className={styles.optionName}>{method.name}</span>
                                                    </div>
                                                    {isDisabled ? (
                                                        <div className={styles.optionSubtext} style={{ color: '#ef4444' }}>
                                                            No disponible para la modalidad de envío seleccionada.
                                                        </div>
                                                    ) : (
                                                        <div className={styles.optionSubtext}>
                                                            {method.id === 'yape' && 'Verás el QR, número oficial e instrucciones inmediatas al confirmar.'}
                                                            {method.id === 'plin' && 'Transfiere desde tu app Plin utilizando tu número de pedido.'}
                                                            {method.id === 'bank_transfer' && 'Cuentas BCP, BBVA e Interbank disponibles al finalizar.'}
                                                            {method.id === 'cash_on_delivery' && 'Paga al repartidor en efectivo o tarjeta en la puerta de tu domicilio.'}
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* STEP 4: CONFIRMACIÓN Y TÉRMINOS */}
                            <div className={styles.stepCard}>
                                <div className={styles.stepHeader}>
                                    <div className={styles.stepNumber}>4</div>
                                    <h2 className={styles.stepTitle}>Confirmación</h2>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <label className={styles.checkboxGroup}>
                                        <input
                                            type="checkbox"
                                            name="acceptTerms"
                                            checked={formData.acceptTerms}
                                            onChange={handleInputChange}
                                            className={styles.checkboxInput}
                                        />
                                        <span className={styles.checkboxLabel}>
                                            Acepto los términos y condiciones del servicio y la política de privacidad.<span className={styles.requiredStar}>*</span>
                                        </span>
                                    </label>
                                    {fieldErrors.acceptTerms && <span className={styles.errorText}>{fieldErrors.acceptTerms}</span>}

                                    <label className={styles.checkboxGroup}>
                                        <input
                                            type="checkbox"
                                            name="acceptMarketing"
                                            checked={formData.acceptMarketing}
                                            onChange={handleInputChange}
                                            className={styles.checkboxInput}
                                        />
                                        <span className={styles.checkboxLabel}>
                                            Deseo recibir ofertas exclusivas y novedades sobre nuevos lanzamientos por correo o WhatsApp.
                                        </span>
                                    </label>

                                    {settings?.require_age_confirmation && (
                                        <>
                                            <label className={styles.checkboxGroup}>
                                                <input
                                                    type="checkbox"
                                                    name="isAgeConfirmed"
                                                    checked={formData.isAgeConfirmed}
                                                    onChange={handleInputChange}
                                                    className={styles.checkboxInput}
                                                />
                                                <span className={styles.checkboxLabel} style={{ fontWeight: 700, color: 'var(--robotina-orange)' }}>
                                                    Confirmo que cumplo con la edad mínima legal requerida para adquirir estos productos.<span className={styles.requiredStar}>*</span>
                                                </span>
                                            </label>
                                            {fieldErrors.isAgeConfirmed && <span className={styles.errorText}>{fieldErrors.isAgeConfirmed}</span>}
                                        </>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={styles.submitBtn}
                                        style={{ marginTop: '12px' }}
                                    >
                                        {submitting ? 'Procesando pedido...' : `REALIZAR PEDIDO · ${finalTotalFormatted}`}
                                    </button>
                                </div>
                            </div>

                            {/* SEPARATE QUOTE REQUEST BOX (SECTION 18) */}
                            <div className={styles.quoteBox}>
                                <div>
                                    <h4 className={styles.quoteTitle}>📋 ¿Necesitas una cotización formal?</h4>
                                    <p className={styles.quoteText}>
                                        Si requieres una propuesta comercial previa o factura corporativa antes de comprar.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRequestQuote}
                                    disabled={submitting}
                                    className={styles.quoteBtn}
                                >
                                    Solicitar Cotización
                                </button>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
                        <div>
                            <CheckoutOrderSummary
                                shippingCostAmount={shippingCostCents}
                                currency={settings?.currency}
                            />
                        </div>
                    </div>
                </form>
            </div>

            {/* MOBILE BOTTOM STICKY BAR */}
            <div className={styles.mobileStickyBar}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total a pagar</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--robotina-orange)' }}>
                            {finalTotalFormatted}
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className={styles.submitBtn}
                        style={{ padding: '12px 20px', fontSize: '0.95rem', width: 'auto' }}
                    >
                        {submitting ? 'Procesando...' : 'Realizar Pedido'}
                    </button>
                </div>
            </div>
        </div>
    );
}
