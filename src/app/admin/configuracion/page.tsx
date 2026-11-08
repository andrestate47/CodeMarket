'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
    getFullStoreSettingsAction,
    updateStoreSettingsAction,
    CompleteStoreSettings,
    PaymentMethodSetting,
    ShippingMethodSetting,
} from '@/modules/config/storeSettingsActions';

// Componente principal envuelto para evitar problemas con useSearchParams en Next.js
export default function AdminSettingsPage() {
    return (
        <React.Suspense fallback={<div>Cargando configuración...</div>}>
            <SettingsContent />
        </React.Suspense>
    );
}

function SettingsContent() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab') as 'general' | 'payments' | 'shipping' | 'checkout' | 'taxes' | null;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'shipping' | 'checkout' | 'taxes'>(tabParam || 'general');

    useEffect(() => {
        if (tabParam && ['general', 'payments', 'shipping', 'checkout', 'taxes'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

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


            <form onSubmit={handleSaveSettings}>

                {/* TAB 1: GENERAL & WHATSAPP */}
                {activeTab === 'general' && (
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1.5px solid var(--glass-border)',
                        borderRadius: '16px',
                        overflow: 'hidden'
                    }}>
                        <div style={{ 
                            padding: '16px 20px', 
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(0,0,0,0.02)'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)' }}>Información</h3>
                            <span style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>▲</span>
                        </div>
                    
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            
                            {/* Direcciones */}
                            <div>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>Direcciones de la tienda</h4>
                                {(settings.storeAddresses || []).map((addr, idx) => (
                                    <div key={idx} style={{ 
                                        border: '1px solid var(--glass-border)', 
                                        borderRadius: '8px', 
                                        padding: '8px 16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '12px',
                                        position: 'relative',
                                        background: 'var(--background)'
                                    }}>
                                        <div style={{ width: '100%' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Dirección</div>
                                            <input 
                                                type="text" 
                                                value={addr} 
                                                onChange={(e) => {
                                                    const newAddrs = [...(settings.storeAddresses || [])];
                                                    newAddrs[idx] = e.target.value;
                                                    setSettings(prev => ({ ...prev, storeAddresses: newAddrs }));
                                                }}
                                                placeholder="Ej: Jr. San Lorenzo 1064"
                                                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--foreground)', marginTop: '2px' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', marginLeft: '12px' }}>
                                            <button type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6366f1', padding: 0, fontSize: '1.1rem' }} title="Editar">✏️</button>
                                            <button type="button" onClick={() => {
                                                const newAddrs = settings.storeAddresses?.filter((_, i) => i !== idx);
                                                setSettings(prev => ({ ...prev, storeAddresses: newAddrs }));
                                            }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, fontSize: '1.1rem' }} title="Eliminar">🗑️</button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => {
                                    setSettings(prev => ({ ...prev, storeAddresses: [...(prev.storeAddresses || []), ''] }));
                                }} style={{ background: 'transparent', border: 'none', color: '#6366f1', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}>
                                    Agregar Dirección +
                                </button>
                            </div>
                    
                            {/* Información de la tienda */}
                            <div>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>Información de la tienda</h4>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                                    <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px 12px', background: 'var(--background)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nombre del Propietario</div>
                                        <input type="text" value={settings.ownerName || ''} onChange={(e) => setSettings(prev => ({ ...prev, ownerName: e.target.value }))} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--foreground)', marginTop: '2px' }} placeholder="Tu nombre" />
                                    </div>
                                    <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px 12px', background: 'var(--background)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nombre de tienda</div>
                                        <input type="text" value={settings.storeName} onChange={(e) => setSettings(prev => ({ ...prev, storeName: e.target.value }))} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--foreground)', marginTop: '2px' }} />
                                    </div>
                                    
                                    <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px 12px', background: 'var(--background)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>E-mail</div>
                                        <input type="email" value={settings.supportEmail} onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--foreground)', marginTop: '2px' }} />
                                    </div>
                                    
                                    <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px 12px', background: 'var(--background)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Teléfono</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                            <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                <span role="img" aria-label="Peru flag">🇵🇪</span> (51) <span style={{ fontSize: '0.6rem' }}>▼</span>
                                            </span>
                                            <div style={{ width: '1px', height: '14px', background: 'var(--glass-border)' }}></div>
                                            <input type="text" value={settings.storePhone || ''} onChange={(e) => setSettings(prev => ({ ...prev, storePhone: e.target.value }))} placeholder="926738921" style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--foreground)' }} />
                                        </div>
                                    </div>
                    
                                    <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px 12px', background: 'var(--background)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>WhatsApp</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                            <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                <span role="img" aria-label="Peru flag">🇵🇪</span> (51) <span style={{ fontSize: '0.6rem' }}>▼</span>
                                            </span>
                                            <div style={{ width: '1px', height: '14px', background: 'var(--glass-border)' }}></div>
                                            <input type="text" value={settings.whatsappPhone?.replace(/^\+?51\s*/, '')} onChange={(e) => setSettings(prev => ({ ...prev, whatsappPhone: '+51 ' + e.target.value }))} placeholder="926738921" style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--foreground)' }} />
                                        </div>
                                    </div>
                    
                                    <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px 12px', background: 'var(--background)', position: 'relative' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rubro de la tienda</div>
                                        <select value={settings.storeCategory || 'Hogar y Cocina'} onChange={(e) => setSettings(prev => ({ ...prev, storeCategory: e.target.value }))} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--foreground)', appearance: 'none', marginTop: '2px', cursor: 'pointer' }}>
                                            <option value="Hogar y Cocina">Hogar y Cocina</option>
                                            <option value="Ropa y Accesorios">Ropa y Accesorios</option>
                                            <option value="Tecnología">Tecnología</option>
                                            <option value="Salud y Belleza">Salud y Belleza</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                        <span style={{ position: 'absolute', right: '12px', top: '22px', fontSize: '0.6rem', pointerEvents: 'none', color: 'var(--foreground)' }}>▼</span>
                                    </div>
                    
                                    <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px 12px', background: 'var(--background)', position: 'relative' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>País de origen</div>
                                        <select value={settings.storeCountry || 'Peru'} onChange={(e) => setSettings(prev => ({ ...prev, storeCountry: e.target.value }))} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--foreground)', appearance: 'none', marginTop: '2px', cursor: 'pointer' }}>
                                            <option value="Peru">Perú</option>
                                            <option value="Argentina">Argentina</option>
                                            <option value="Chile">Chile</option>
                                            <option value="Colombia">Colombia</option>
                                        </select>
                                        <span style={{ position: 'absolute', right: '12px', top: '22px', fontSize: '0.6rem', pointerEvents: 'none', color: 'var(--foreground)' }}>▼</span>
                                    </div>
                    
                                    <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px 12px', background: 'var(--background)', position: 'relative' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Moneda</div>
                                        <select value={settings.currency || 'PEN'} onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--foreground)', appearance: 'none', marginTop: '2px', cursor: 'pointer' }}>
                                            <option value="PEN">PEN - Sol Peruano</option>
                                            <option value="USD">USD - Dólar Estadounidense</option>
                                            <option value="ARS">ARS - Peso Argentino</option>
                                        </select>
                                        <span style={{ position: 'absolute', right: '12px', top: '22px', fontSize: '0.6rem', pointerEvents: 'none', color: 'var(--foreground)' }}>▼</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: '24px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={settings.enableAutoWhatsappRedirect}
                                            onChange={(e) => setSettings(prev => ({ ...prev, enableAutoWhatsappRedirect: e.target.checked }))}
                                            style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                                        />
                                        <span>Ofrecer redirección rápida a WhatsApp al finalizar la compra</span>
                                    </label>
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

                                {method.id === 'bank_transfer' && method.banks && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                                        {method.banks.map((b, idx) => (
                                            <div key={idx} style={{ background: 'var(--background)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                <div style={{ fontWeight: 800, marginBottom: '8px', fontSize: '0.85rem' }}>{b.bank}</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <input
                                                        type="text"
                                                        value={b.account || ''}
                                                        onChange={(e) => {
                                                            const newBanks = [...method.banks!];
                                                            newBanks[idx] = { ...newBanks[idx], account: e.target.value };
                                                            handlePaymentMethodChange(method.id, 'banks', newBanks);
                                                        }}
                                                        placeholder="Nro de Cuenta"
                                                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--glass-border)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--foreground)' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={b.cci || ''}
                                                        onChange={(e) => {
                                                            const newBanks = [...method.banks!];
                                                            newBanks[idx] = { ...newBanks[idx], cci: e.target.value };
                                                            handlePaymentMethodChange(method.id, 'banks', newBanks);
                                                        }}
                                                        placeholder="CCI"
                                                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--glass-border)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--foreground)' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={b.holder || ''}
                                                        onChange={(e) => {
                                                            const newBanks = [...method.banks!];
                                                            newBanks[idx] = { ...newBanks[idx], holder: e.target.value };
                                                            handlePaymentMethodChange(method.id, 'banks', newBanks);
                                                        }}
                                                        placeholder="Titular"
                                                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--glass-border)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--foreground)' }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div style={{ marginTop: '14px' }}>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Instrucciones de Pago (se mostrarán al cliente)</label>
                                    <textarea
                                        value={method.instructions || ''}
                                        onChange={(e) => handlePaymentMethodChange(method.id, 'instructions', e.target.value)}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--background)', color: 'var(--foreground)', minHeight: '60px', resize: 'vertical' }}
                                    />
                                </div>
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
                                {method.requires_address === false && (
                                    <div style={{ marginTop: '14px' }}>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Dirección de Recojo en Tienda / Almacén</label>
                                        <input
                                            type="text"
                                            value={method.address_details || ''}
                                            onChange={(e) => handleShippingMethodChange(method.id, 'address_details', e.target.value)}
                                            placeholder="Ej. Av. Principal 123..."
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB 5: TAXES (Impuestos) */}
                {activeTab === 'taxes' && (
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1.5px solid var(--glass-border)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '2rem' }}>🧾</div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Configuración de Impuestos</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Actualmente los precios ya incluyen el IGV/IVA por defecto (18%). 
                                </p>
                            </div>
                        </div>
                        <div style={{ padding: '20px', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-muted)' }}>
                                🚧 Módulo de impuestos avanzados y facturación electrónica (FE) en desarrollo para próximas versiones.
                            </p>
                        </div>
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
