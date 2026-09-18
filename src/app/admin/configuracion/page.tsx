'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
    getFullStoreSettingsAction,
    updateStoreSettingsAction,
    CompleteStoreSettings,
    PaymentMethodSetting,
    ShippingMethodSetting,
} from '@/modules/config/storeSettingsActions';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'shipping' | 'checkout'>('general');

    const [settings, setSettings] = useState<CompleteStoreSettings>({
        storeName: 'TiendaVir',
        storeTagline: 'Tu Tienda Virtual Premium',
        currency: 'PEN',
        supportEmail: 'contacto@tiendavir.com',
        whatsappPhone: '+51 987 654 321',
        enableAutoWhatsappRedirect: true,
        requireEmail: true,
        requireAgeConfirmation: false,
        paymentMethods: [],
        shippingMethods: [],
    });

    useEffect(() => {
        let isCurrent = true;
        (async () => {
            setLoading(true);
            const res = await getFullStoreSettingsAction();
            if (isCurrent && res.success && res.settings) {
                setSettings(res.settings);
            } else if (isCurrent && res.error) {
                toast.error(res.error);
            }
            if (isCurrent) setLoading(false);
        })();
        return () => {
            isCurrent = false;
        };
    }, []);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const res = await updateStoreSettingsAction(settings);
        setSaving(false);

        if (res.success) {
            toast.success('¡Configuración guardada exitosamente!');
        } else {
            toast.error(res.error || 'Error al guardar la configuración.');
        }
    };

    const handlePaymentMethodToggle = (id: string, active: boolean) => {
        setSettings(prev => ({
            ...prev,
            paymentMethods: prev.paymentMethods.map(p => p.id === id ? { ...p, is_active: active } : p)
        }));
    };

    const handlePaymentMethodChange = (id: string, field: keyof PaymentMethodSetting, value: unknown) => {
        setSettings(prev => ({
            ...prev,
            paymentMethods: prev.paymentMethods.map(p => p.id === id ? { ...p, [field]: value } : p)
        }));
    };

    const handleShippingMethodToggle = (id: string, active: boolean) => {
        setSettings(prev => ({
            ...prev,
            shippingMethods: prev.shippingMethods.map(s => s.id === id ? { ...s, is_active: active } : s)
        }));
    };

    const handleShippingMethodChange = (id: string, field: keyof ShippingMethodSetting, value: unknown) => {
        setSettings(prev => ({
            ...prev,
            shippingMethods: prev.shippingMethods.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    if (loading) {
        return (
            <div>
                <AdminPageHeader
                    title="Configuración de la Tienda"
                    description="Cargando ajustes generales, WhatsApp, pagos y envíos..."
                />
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚙️</div>
                    <p>Cargando panel de configuración...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <AdminPageHeader
                title="Configuración de la Tienda"
                description="Gestión central de WhatsApp, compras sin cuenta, métodos de pago y tarifas de envío."
            />

            {/* TAB NAVIGATION */}
            <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid var(--glass-border)',
                marginBottom: '24px',
                overflowX: 'auto',
                paddingBottom: '4px'
            }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        background: activeTab === 'general' ? 'var(--robotina-orange)' : 'transparent',
                        color: activeTab === 'general' ? '#ffffff' : 'var(--foreground)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <span>💬</span> WhatsApp y Tienda
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('checkout')}
                    style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        background: activeTab === 'checkout' ? 'var(--robotina-orange)' : 'transparent',
                        color: activeTab === 'checkout' ? '#ffffff' : 'var(--foreground)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <span>🛒</span> Checkout sin Cuenta
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('payments')}
                    style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        background: activeTab === 'payments' ? 'var(--robotina-orange)' : 'transparent',
                        color: activeTab === 'payments' ? '#ffffff' : 'var(--foreground)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <span>💳</span> Métodos de Pago
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('shipping')}
                    style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        background: activeTab === 'shipping' ? 'var(--robotina-orange)' : 'transparent',
                        color: activeTab === 'shipping' ? '#ffffff' : 'var(--foreground)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <span>🚚</span> Tarifas y Envíos
                </button>
            </div>

            <form onSubmit={handleSaveSettings}>

                {/* TAB 1: GENERAL & WHATSAPP */}
                {activeTab === 'general' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{
                            background: 'var(--card-bg)',
                            border: '1.5px solid var(--glass-border)',
                            borderRadius: '16px',
                            padding: '24px'
                        }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>📱 Afiliación de WhatsApp TiendaVir</h3>
                            <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Define el número de teléfono donde los clientes podrán enviar el resumen de su compra y los comprobantes de pago Yape/Plin directamente con 1 tap.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                                        Número de WhatsApp Afiliado a la Tienda
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.whatsappPhone}
                                        onChange={(e) => setSettings(prev => ({ ...prev, whatsappPhone: e.target.value }))}
                                        placeholder="+51 987 654 321"
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--glass-border)',
                                            background: 'var(--background)',
                                            color: 'var(--foreground)',
                                            fontWeight: 700
                                        }}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', marginTop: '22px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={settings.enableAutoWhatsappRedirect}
                                            onChange={(e) => setSettings(prev => ({ ...prev, enableAutoWhatsappRedirect: e.target.checked }))}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--robotina-orange)' }}
                                        />
                                        <span>Ofrecer redirección rápida a WhatsApp al finalizar la compra</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            background: 'var(--card-bg)',
                            border: '1.5px solid var(--glass-border)',
                            borderRadius: '16px',
                            padding: '24px'
                        }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>⚙️ Identidad de la Tienda</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>Nombre Comercial</label>
                                    <input
                                        type="text"
                                        value={settings.storeName}
                                        onChange={(e) => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--glass-border)',
                                            background: 'var(--background)',
                                            color: 'var(--foreground)'
                                        }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>Eslogan de la Tienda</label>
                                    <input
                                        type="text"
                                        value={settings.storeTagline || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, storeTagline: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--glass-border)',
                                            background: 'var(--background)',
                                            color: 'var(--foreground)'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>Correo Electrónico de Soporte / Alertas</label>
                                    <input
                                        type="email"
                                        value={settings.supportEmail}
                                        onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--glass-border)',
                                            background: 'var(--background)',
                                            color: 'var(--foreground)'
                                        }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>Moneda Principal</label>
                                    <input
                                        type="text"
                                        value={settings.currency}
                                        disabled
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--glass-border)',
                                            background: 'var(--glass-border)',
                                            color: 'var(--text-muted)',
                                            fontWeight: 700
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: GUEST CHECKOUT */}
                {activeTab === 'checkout' && (
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1.5px solid var(--glass-border)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '2rem' }}>🛍️</div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Checkout Libre (Sin Obligación de Cuenta)</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#22c55e', fontWeight: 700 }}>
                                    ✓ Activo por defecto: Los clientes compran de forma rápida y sencilla sin crear cuenta ni iniciar sesión.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.92rem' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.requireEmail}
                                    onChange={(e) => setSettings(prev => ({ ...prev, requireEmail: e.target.checked }))}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--robotina-orange)' }}
                                />
                                <div>
                                    <strong>Requerir Correo Electrónico en el Checkout</strong>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        Si está marcado, se pedirá correo al comprador para enviarle la confirmación.
                                    </div>
                                </div>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.92rem' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.requireAgeConfirmation}
                                    onChange={(e) => setSettings(prev => ({ ...prev, requireAgeConfirmation: e.target.checked }))}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--robotina-orange)' }}
                                />
                                <div>
                                    <strong>Solicitar Confirmación de Mayoría de Edad (+18)</strong>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        Requerido para productos con restricciones de edad legal.
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* TAB 3: PAYMENT METHODS */}
                {activeTab === 'payments' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {settings.paymentMethods.map(method => (
                            <div
                                key={method.id}
                                style={{
                                    background: 'var(--card-bg)',
                                    border: '1.5px solid var(--glass-border)',
                                    borderRadius: '16px',
                                    padding: '20px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{method.name}</h4>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700 }}>
                                        <input
                                            type="checkbox"
                                            checked={method.is_active}
                                            onChange={(e) => handlePaymentMethodToggle(method.id, e.target.checked)}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--robotina-orange)' }}
                                        />
                                        <span>{method.is_active ? 'Activo' : 'Inactivo'}</span>
                                    </label>
                                </div>

                                {(method.id === 'yape' || method.id === 'plin') && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Número de Teléfono</label>
                                            <input
                                                type="text"
                                                value={method.number || ''}
                                                onChange={(e) => handlePaymentMethodChange(method.id, 'number', e.target.value)}
                                                placeholder="987 654 321"
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Nombre del Titular</label>
                                            <input
                                                type="text"
                                                value={method.holder || ''}
                                                onChange={(e) => handlePaymentMethodChange(method.id, 'holder', e.target.value)}
                                                placeholder="CodeMarket Perú"
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {method.id === 'bank_transfer' && (
                                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                        Cuentas bancarias habilitadas: BCP (193-0000000-0-00), BBVA (0011-0000-00000000-00).
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB 4: SHIPPING METHODS */}
                {activeTab === 'shipping' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {settings.shippingMethods.map(method => (
                            <div
                                key={method.id}
                                style={{
                                    background: 'var(--card-bg)',
                                    border: '1.5px solid var(--glass-border)',
                                    borderRadius: '16px',
                                    padding: '20px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{method.name}</h4>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700 }}>
                                        <input
                                            type="checkbox"
                                            checked={method.is_active}
                                            onChange={(e) => handleShippingMethodToggle(method.id, e.target.checked)}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--robotina-orange)' }}
                                        />
                                        <span>{method.is_active ? 'Activo' : 'Inactivo'}</span>
                                    </label>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Costo (en Soles S/)</label>
                                        <input
                                            type="number"
                                            step="0.50"
                                            value={method.price_amount / 100}
                                            onChange={(e) => handleShippingMethodChange(method.id, 'price_amount', Math.round(parseFloat(e.target.value || '0') * 100))}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Tiempo Estimado</label>
                                        <input
                                            type="text"
                                            value={method.estimated_days || ''}
                                            onChange={(e) => handleShippingMethodChange(method.id, 'estimated_days', e.target.value)}
                                            placeholder="1 - 2 días hábiles"
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* SAVE BUTTON */}
                <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            background: 'linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%)',
                            color: '#ffffff',
                            padding: '12px 32px',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '1rem',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(255, 107, 0, 0.35)'
                        }}
                    >
                        {saving ? 'Guardando ajustes...' : '💾 GUARDAR CONFIGURACIÓN'}
                    </button>
                </div>
            </form>
        </div>
    );
}
