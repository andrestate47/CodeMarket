'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { processCheckoutAction, CheckoutResult } from '@/modules/checkout/actions';

type PaymentMethod = 'yape' | 'plin' | 'bank_transfer' | 'quote_request';

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('yape');
    const [orderResult, setOrderResult] = useState<CheckoutResult | null>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        notes: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const checkoutPayload = {
            customerName: formData.fullName,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            paymentMethod,
            notes: formData.notes,
            items: items.map(i => ({ productId: i.id, quantity: 1 })),
        };

        const result = await processCheckoutAction(checkoutPayload);
        setLoading(false);

        if (result.success) {
            setOrderResult(result);
            clearCart();
            toast.success(`¡Pedido ${result.orderNumber} registrado exitosamente!`);
            import('canvas-confetti').then((confetti) => confetti.default({ particleCount: 150, spread: 80, origin: { y: 0.6 } }));
        } else {
            toast.error(result.error || 'Error al procesar la orden.');
        }
    };

    if (orderResult?.success) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', paddingTop: '60px', maxWidth: '650px', margin: '0 auto' }}>
                <div style={{ background: 'var(--glass-bg)', padding: '48px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📝</div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '12px', fontWeight: 800 }}>¡Pedido Registrado con Éxito!</h1>
                    <div style={{ display: 'inline-block', background: 'rgba(255, 107, 0, 0.12)', color: 'var(--robotina-orange)', padding: '6px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '1.1rem', marginBottom: '24px' }}>
                        Número de Pedido: {orderResult.orderNumber}
                    </div>

                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '1rem', lineHeight: '1.6' }}>
                        Estado del pago: <strong style={{ color: '#facc15' }}>Pago Pendiente</strong>.
                        <br />
                        Total del pedido: <strong>{orderResult.totalFormatted}</strong>.
                    </p>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', textAlign: 'left', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: 'white' }}>Instrucciones para completar tu pago:</h4>
                        {paymentMethod === 'yape' && <p style={{ fontSize: '0.9rem', color: '#ccc', margin: 0 }}>Envía el monto vía <strong>Yape</strong> al <strong>+51 900 000 000</strong> (CodeMarket Perú) indicando tu número de pedido <strong>{orderResult.orderNumber}</strong> en el concepto.</p>}
                        {paymentMethod === 'plin' && <p style={{ fontSize: '0.9rem', color: '#ccc', margin: 0 }}>Envía tu pago por <strong>Plin</strong> al <strong>+51 900 000 000</strong> (CodeMarket Perú) con el concepto <strong>{orderResult.orderNumber}</strong>.</p>}
                        {paymentMethod === 'bank_transfer' && <p style={{ fontSize: '0.9rem', color: '#ccc', margin: 0 }}>Transfiere a nuestra cuenta BCP: <strong>193-0000000-0-00</strong> (CodeMarket S.A.C.) indicando <strong>{orderResult.orderNumber}</strong>.</p>}
                        {paymentMethod === 'quote_request' && <p style={{ fontSize: '0.9rem', color: '#ccc', margin: 0 }}>Hemos recibido tu solicitud de cotización. Nuestro equipo técnico se pondrá en contacto contigo en breve.</p>}
                    </div>

                    <button
                        onClick={() => router.push('/')}
                        style={{ background: 'white', color: 'black', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                    >
                        Volver a la Tienda
                    </button>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px' }}>
                <h1 className={styles.title}>Tu carrito está vacío</h1>
                <button className="btn-primary" onClick={() => router.push('/')}>
                    Volver al catálogo
                </button>
            </div>
        );
    }

    const paymentOptions = [
        { id: 'yape', name: 'Yape', icon: '🟣' },
        { id: 'plin', name: 'Plin', icon: '🔵' },
        { id: 'bank_transfer', name: 'Transferencia BCP', icon: '🏦' },
        { id: 'quote_request', name: 'Cotización / Consulta', icon: '📋' },
    ];

    return (
        <div className={styles.container}>
            <button onClick={() => router.back()} className={styles.backButton}>
                &larr; Volver
            </button>
            <h1 className={styles.title}>
                Finalizar Pedido
            </h1>

            <div className={styles.grid}>
                {/* Form Section */}
                <section className={styles.formSection}>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.sectionHeader}>1. Datos del Cliente</div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombre Completo *</label>
                            <input
                                name="fullName"
                                className={styles.input}
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Ej. Juan Pérez"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Correo Electrónico *</label>
                            <input
                                name="email"
                                type="email"
                                className={styles.input}
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="tu@email.com"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Teléfono / WhatsApp *</label>
                            <input
                                name="phone"
                                type="tel"
                                className={styles.input}
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+51 900 000 000"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Notas adicionales (Opcional)</label>
                            <textarea
                                name="notes"
                                className={styles.input}
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Indicaciones especiales para tu proyecto o pedido..."
                                rows={3}
                            />
                        </div>

                        {/* Payment Method Selector */}
                        <div className={styles.sectionHeader} style={{ marginTop: '40px' }}>2. Método de Pago Manual</div>
                        <div className={styles.paymentMethodsGrid}>
                            {paymentOptions.map(option => (
                                <div
                                    key={option.id}
                                    className={`${styles.paymentMethodCard} ${paymentMethod === option.id ? styles.active : ''}`}
                                    onClick={() => setPaymentMethod(option.id as PaymentMethod)}
                                >
                                    <span className={styles.paymentIcon}>{option.icon}</span>
                                    <span className={styles.paymentName}>{option.name}</span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.paymentInstruction} style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#ccc' }}>
                                Al confirmar, tu pedido iniciará con estado <strong>Pago Pendiente</strong>. Recibirás el número de pedido e instrucciones exactas para realizar tu depósito.
                            </p>
                        </div>

                        <button type="submit" className={`btn-primary ${styles.payButton}`} disabled={loading} style={{ marginTop: '24px' }}>
                            {loading ? 'Generando Pedido...' : `Confirmar Pedido (S/ ${total.toFixed(2)})`}
                        </button>
                    </form>
                </section>

                {/* Summary Section */}
                <section className={styles.summarySection}>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryTitle}>Resumen del Carrito</div>

                        {items.map((item) => (
                            <div key={item.cartId} className={styles.summaryItem}>
                                <span>{item.title}</span>
                                <span>{item.price}</span>
                            </div>
                        ))}

                        <div className={styles.summaryItem} style={{ borderTop: '1px solid #333', paddingTop: '16px', marginTop: '16px' }}>
                            <span>Subtotal</span>
                            <span>S/ {total.toFixed(2)}</span>
                        </div>

                        <div className={styles.totalRow}>
                            <span>Total</span>
                            <span>S/ {total.toFixed(2)}</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
