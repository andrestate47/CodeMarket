'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { getFullStoreSettingsAction } from '@/modules/config/storeSettingsActions';

type FlowStep = 'chat' | 'store' | 'checkout' | 'confirmed';

const URBAN_DEMO_PRODUCTS = [
    {
        id: 'u1',
        name: 'Casaca Oversize Street Black',
        category: 'Casacas',
        price: 'S/ 89.00',
        oldPrice: 'S/ 120.00',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80',
    },
    {
        id: 'u2',
        name: 'Hoodie Essential Purple Edition',
        category: 'Poleras',
        price: 'S/ 75.00',
        oldPrice: 'S/ 95.00',
        image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=80',
    },
    {
        id: 'u3',
        name: 'Polo Heavyweight Boxy Fit White',
        category: 'Polos',
        price: 'S/ 49.00',
        oldPrice: 'S/ 65.00',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=80',
    },
    {
        id: 'u4',
        name: 'Jogger Cargo Techwear Gris',
        category: 'Pantalones',
        price: 'S/ 85.00',
        oldPrice: 'S/ 110.00',
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=80',
    },
];

export default function AdminSocialCommercePage() {
    const [storeName, setStoreName] = useState('Urban Store');
    const [originUrl, setOriginUrl] = useState('https://tiendavir.duckdns.org');
    const [activeStep, setActiveStep] = useState<FlowStep>('chat');
    const [selectedPay, setSelectedPay] = useState<'yape' | 'plin' | 'card' | 'mp'>('yape');
    const [demoBrandMode, setDemoBrandMode] = useState<'urban' | 'actual'>('urban');
    const [realStoreName, setRealStoreName] = useState('TiendaVirt');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOriginUrl(window.location.origin);
        }
        (async () => {
            const res = await getFullStoreSettingsAction();
            if (res.success && res.settings?.storeName) {
                setRealStoreName(res.settings.storeName);
            }
        })();
    }, []);

    const displayBrand = demoBrandMode === 'urban' ? 'Urban Store' : realStoreName;
    const waStoreLink = `${originUrl}/tienda?from=wa`;
    const igStoreLink = `${originUrl}/tienda?from=ig`;

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`¡${label} copiado al portapapeles!`);
    };

    const shareMessageTemplate =
        `¡Hola! 👋 Bienvenido a *${displayBrand}*.\n\n` +
        `Mira nuestro catálogo actualizado y haz tu pedido directo sin salir de WhatsApp aquí:\n` +
        `🛍️ Ver nuestra tienda en TiendaVirt:\n${waStoreLink}`;

    return (
        <div>
            <AdminPageHeader
                title="Mini-Tienda Social (WhatsApp & Instagram)"
                description="Comparte el enlace optimizado para el navegador interno de WhatsApp e Instagram y visualiza el flujo completo de conversión."
                action={
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <Link
                            href="/tienda?from=wa"
                            target="_blank"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                background: '#25D366',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                textDecoration: 'none',
                                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                            }}
                        >
                            <span>📱 Abrir Mini-Tienda Real</span>
                        </Link>
                    </div>
                }
            />

            {/* CONTENEDOR PRINCIPAL: HERRAMIENTAS DE ENLACES + SIMULADOR COMERCIAL */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '24px',
                alignItems: 'start',
            }}>
                {/* COLUMNA IZQUIERDA: LINKS INTELIGENTES Y MENSAJE DE WHATSAPP */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1.5px solid var(--structural-border, var(--glass-border))',
                        borderRadius: '18px',
                        padding: '22px',
                    }}>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 900 }}>
                            🔗 Enlaces Oficiales de tu Mini-Tienda
                        </h3>
                        <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            Estos enlaces activan automáticamente la interfaz compacta pensada para abrirse dentro del navegador interno de WhatsApp e Instagram.
                        </p>

                        {/* Enlace para WhatsApp */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#16a34a', display: 'block', marginBottom: '6px' }}>
                                💬 Enlace para Chats y Respuesta Automática de WhatsApp
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={waStoreLink}
                                    style={{
                                        flex: 1,
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        border: '1.5px solid var(--structural-border, var(--glass-border))',
                                        background: 'var(--background)',
                                        color: 'var(--foreground)',
                                        fontSize: '0.84rem',
                                        fontWeight: 700,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleCopy(waStoreLink, 'Enlace de WhatsApp')}
                                    style={{
                                        padding: '0 16px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: '#25D366',
                                        color: '#ffffff',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Copiar
                                </button>
                            </div>
                        </div>

                        {/* Enlace para Instagram Bio */}
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#9333ea', display: 'block', marginBottom: '6px' }}>
                                📸 Enlace para Biografía de Instagram / Historias
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={igStoreLink}
                                    style={{
                                        flex: 1,
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        border: '1.5px solid var(--structural-border, var(--glass-border))',
                                        background: 'var(--background)',
                                        color: 'var(--foreground)',
                                        fontSize: '0.84rem',
                                        fontWeight: 700,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleCopy(igStoreLink, 'Enlace de Instagram')}
                                    style={{
                                        padding: '0 16px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #7e22ce 0%, #db2777 100%)',
                                        color: '#ffffff',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Copiar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* PLANTILLA DE MENSAJE PARA ENVIAR POR WHATSAPP */}
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1.5px solid var(--structural-border, var(--glass-border))',
                        borderRadius: '18px',
                        padding: '22px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 900 }}>
                                📲 Mensaje Listo para Enviar a Clientes
                            </h3>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => setDemoBrandMode('urban')}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '99px',
                                        border: '1px solid var(--glass-border)',
                                        background: demoBrandMode === 'urban' ? '#7c3aed' : 'var(--background)',
                                        color: demoBrandMode === 'urban' ? '#fff' : 'var(--text-muted)',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Demo: Urban Store
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDemoBrandMode('actual')}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '99px',
                                        border: '1px solid var(--glass-border)',
                                        background: demoBrandMode === 'actual' ? 'var(--robotina-orange)' : 'var(--background)',
                                        color: demoBrandMode === 'actual' ? '#fff' : 'var(--text-muted)',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Tu Tienda: {realStoreName}
                                </button>
                            </div>
                        </div>

                        <textarea
                            readOnly
                            rows={5}
                            value={shareMessageTemplate}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1.5px solid var(--structural-border, var(--glass-border))',
                                background: 'var(--background)',
                                color: 'var(--foreground)',
                                fontSize: '0.84rem',
                                lineHeight: 1.5,
                                resize: 'none',
                                marginBottom: '12px',
                            }}
                        />

                        <button
                            type="button"
                            onClick={() => handleCopy(shareMessageTemplate, 'Mensaje de bienvenida')}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1.5px solid rgba(37, 211, 102, 0.4)',
                                background: 'rgba(37, 211, 102, 0.1)',
                                color: '#16a34a',
                                fontWeight: 800,
                                fontSize: '0.86rem',
                                cursor: 'pointer',
                            }}
                        >
                            📋 Copiar Mensaje de Bienvenida
                        </button>
                    </div>
                </div>

                {/* COLUMNA DERECHA: MOCKUP INTERACTIVO DEL FLUJO COMPLETO WHATSAPP -> TIENDAVIRT */}
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1.5px solid var(--structural-border, var(--glass-border))',
                    borderRadius: '20px',
                    padding: '22px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7c3aed', background: 'rgba(124, 58, 237, 0.1)', padding: '3px 8px', borderRadius: '99px' }}>
                                Flujo Interactivo en Vivo
                            </span>
                            <h3 style={{ margin: '6px 0 0 0', fontSize: '1.08rem', fontWeight: 900 }}>
                                Experiencia de Compra desde WhatsApp
                            </h3>
                        </div>
                    </div>

                    {/* SELECTOR DE ETAPAS DEL FLUJO */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '6px',
                        marginBottom: '18px',
                        background: 'var(--background)',
                        padding: '6px',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                    }}>
                        {[
                            { id: 'chat', label: '1. Chat WA' },
                            { id: 'store', label: '2. Mini-Tienda' },
                            { id: 'checkout', label: '3. Pago' },
                            { id: 'confirmed', label: '4. Pedido OK' },
                        ].map(s => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setActiveStep(s.id as FlowStep)}
                                style={{
                                    padding: '8px 6px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeStep === s.id ? '#7c3aed' : 'transparent',
                                    color: activeStep === s.id ? '#ffffff' : 'var(--text-muted)',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* TELÉFONO SIMULADO REALISTA */}
                    <div style={{
                        maxWidth: '360px',
                        margin: '0 auto',
                        borderRadius: '34px',
                        border: '8px solid #18181b',
                        background: '#09090b',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
                        overflow: 'hidden',
                        minHeight: '590px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        {/* BARRA DE ESTADO DEL TELÉFONO */}
                        <div style={{
                            background: '#075E54',
                            color: '#ffffff',
                            padding: '6px 16px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}>
                            <span>9:41</span>
                            <span>5G · 100% 🔋</span>
                        </div>

                        {/* PANTALLA 1: CONVERSACIÓN DE WHATSAPP */}
                        {activeStep === 'chat' && (
                            <div style={{
                                flex: 1,
                                background: '#ECE5DD',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}>
                                {/* Header WhatsApp */}
                                <div style={{
                                    background: '#075E54',
                                    color: '#ffffff',
                                    padding: '10px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                }}>
                                    <span style={{ fontWeight: 900 }}>←</span>
                                    <div style={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '50%',
                                        background: '#7c3aed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 900,
                                        fontSize: '0.85rem',
                                    }}>
                                        US
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{displayBrand} ✓</div>
                                        <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>Cuenta de empresa · En línea</div>
                                    </div>
                                    <span>📞 ⋮</span>
                                </div>

                                {/* Mensajes del chat */}
                                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                                    <div style={{
                                        alignSelf: 'flex-end',
                                        background: '#DCF8C6',
                                        color: '#111827',
                                        padding: '8px 12px',
                                        borderRadius: '12px 12px 2px 12px',
                                        maxWidth: '82%',
                                        fontSize: '0.8rem',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                                    }}>
                                        ¡Hola! Quiero ver las casacas y poleras disponibles 🙌
                                        <div style={{ fontSize: '0.62rem', color: '#6b7280', textAlign: 'right', marginTop: '2px' }}>9:40 ✓✓</div>
                                    </div>

                                    <div style={{
                                        alignSelf: 'flex-start',
                                        background: '#ffffff',
                                        color: '#111827',
                                        padding: '8px',
                                        borderRadius: '12px 12px 12px 2px',
                                        maxWidth: '88%',
                                        fontSize: '0.8rem',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                    }}>
                                        {/* Preview card enriquecida */}
                                        <div
                                            onClick={() => setActiveStep('store')}
                                            style={{
                                                background: '#f3f4f6',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                marginBottom: '8px',
                                                borderLeft: '4px solid #7c3aed',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <div style={{
                                                height: '86px',
                                                background: 'linear-gradient(135deg, #111827 0%, #5b21b6 100%)',
                                                color: '#fff',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                padding: '12px',
                                            }}>
                                                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a78bfa', fontWeight: 800 }}>
                                                    TIENDAVIRT · MINI-TIENDA OFICIAL
                                                </span>
                                                <strong style={{ fontSize: '1rem', marginTop: '2px' }}>{displayBrand}</strong>
                                                <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>Catálogo interactivo · Pago Yape/Plin/Tarjeta</span>
                                            </div>
                                        </div>

                                        <div style={{ padding: '0 4px' }}>
                                            ¡Hola! 👋 Mira todo nuestro stock y compra directo sin salir de WhatsApp aquí:
                                            <button
                                                type="button"
                                                onClick={() => setActiveStep('store')}
                                                style={{
                                                    marginTop: '8px',
                                                    width: '100%',
                                                    padding: '9px 12px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: '#25D366',
                                                    color: '#ffffff',
                                                    fontWeight: 800,
                                                    fontSize: '0.78rem',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.35)',
                                                }}
                                            >
                                                🛍️ Ver nuestra tienda en TiendaVirt →
                                            </button>
                                        </div>
                                        <div style={{ fontSize: '0.62rem', color: '#6b7280', textAlign: 'right', marginTop: '4px' }}>9:41</div>
                                    </div>
                                </div>

                                {/* Barra inferior de chat */}
                                <div style={{
                                    padding: '8px 10px',
                                    background: '#f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}>
                                    <div style={{
                                        flex: 1,
                                        background: '#ffffff',
                                        borderRadius: '99px',
                                        padding: '7px 12px',
                                        fontSize: '0.74rem',
                                        color: '#9ca3af',
                                    }}>
                                        Toca el enlace verde para abrir la tienda...
                                    </div>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: '#075E54',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                    }}>
                                        🎤
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PANTALLA 2: MINI-TIENDA INTEGRADA EN EL NAVEGADOR DE WHATSAPP */}
                        {activeStep === 'store' && (
                            <div style={{ flex: 1, background: '#ffffff', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
                                {/* Barra superior In-App Browser de WhatsApp */}
                                <div style={{
                                    background: '#075E54',
                                    color: '#ffffff',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveStep('chat')}
                                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 900 }}
                                        >
                                            ✕
                                        </button>
                                        <div>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>{displayBrand} · TiendaVirt</div>
                                            <div style={{ fontSize: '0.62rem', opacity: 0.85 }}>🔒 Navegador integrado de WhatsApp</div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.2)', padding: '2px 7px', borderRadius: '99px', fontWeight: 800 }}>
                                        WhatsApp
                                    </span>
                                </div>

                                {/* Banner + Perfil Urban Store */}
                                <div style={{
                                    padding: '12px 14px',
                                    background: 'linear-gradient(135deg, #111827 0%, #4c1d95 100%)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '12px',
                                            background: '#7c3aed',
                                            border: '2px solid #fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 900,
                                        }}>
                                            US
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 900, fontSize: '0.92rem' }}>{displayBrand} ✓</div>
                                            <div style={{ fontSize: '0.68rem', color: '#c4b5fd' }}>🟢 Catálogo Oficial · Envío Hoy</div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiveStep('checkout')}
                                        style={{
                                            background: '#25D366',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '99px',
                                            padding: '5px 10px',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        🛒 Carrito (1)
                                    </button>
                                </div>

                                {/* Categorías */}
                                <div style={{
                                    display: 'flex',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    borderBottom: '1px solid #e2e8f0',
                                    overflowX: 'auto',
                                }}>
                                    {['Todos', 'Casacas', 'Poleras', 'Polos', 'Ofertas'].map((c, idx) => (
                                        <span
                                            key={c}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: '99px',
                                                fontSize: '0.68rem',
                                                fontWeight: 800,
                                                background: idx === 0 ? '#7c3aed' : '#f1f5f9',
                                                color: idx === 0 ? '#ffffff' : '#475569',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {c}
                                        </span>
                                    ))}
                                </div>

                                {/* Grilla de Productos */}
                                <div style={{
                                    padding: '10px 12px',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '8px',
                                    flex: 1,
                                }}>
                                    {URBAN_DEMO_PRODUCTS.map(prod => (
                                        <div
                                            key={prod.id}
                                            style={{
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                background: '#ffffff',
                                            }}
                                        >
                                            <div style={{ height: '84px', background: '#f8fafc', position: 'relative' }}>
                                                <img
                                                    src={prod.image}
                                                    alt={prod.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {prod.name}
                                                </div>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#7c3aed' }}>
                                                    {prod.price}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveStep('checkout')}
                                                    style={{
                                                        marginTop: '4px',
                                                        padding: '5px',
                                                        borderRadius: '7px',
                                                        border: 'none',
                                                        background: '#111827',
                                                        color: '#ffffff',
                                                        fontSize: '0.68rem',
                                                        fontWeight: 800,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Comprar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Sticky Cart Bar en el simulador */}
                                <div style={{
                                    margin: '0 10px 10px 10px',
                                    padding: '9px 12px',
                                    borderRadius: '12px',
                                    background: '#111827',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.64rem', color: '#9ca3af' }}>1 producto seleccionado</div>
                                        <div style={{ fontSize: '0.84rem', fontWeight: 900 }}>S/ 89.00</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiveStep('checkout')}
                                        style={{
                                            padding: '7px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: '#25D366',
                                            color: '#ffffff',
                                            fontSize: '0.74rem',
                                            fontWeight: 900,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Finalizar compra →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* PANTALLA 3: CHECKOUT CON YAPE, PLIN, TARJETA, MERCADO PAGO Y WHATSAPP */}
                        {activeStep === 'checkout' && (
                            <div style={{ flex: 1, background: '#f8fafc', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
                                <div style={{
                                    background: '#075E54',
                                    color: '#ffffff',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setActiveStep('store')}
                                        style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem' }}
                                    >
                                        ← Volver al catálogo
                                    </button>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>{displayBrand}</span>
                                </div>

                                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.76rem', fontWeight: 800 }}>Casaca Oversize Street Black</div>
                                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Talla L · Cant: 1</div>
                                        </div>
                                        <strong style={{ fontSize: '0.88rem', color: '#7c3aed' }}>S/ 89.00</strong>
                                    </div>

                                    <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginTop: '4px' }}>
                                        Selecciona tu método de pago:
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {[
                                            { id: 'yape', label: '🟣 Yape Instantáneo' },
                                            { id: 'plin', label: '🔵 Plin Rápido' },
                                            { id: 'card', label: '💳 Tarjeta Visa/MC' },
                                            { id: 'mp', label: '🤝 Mercado Pago' },
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setSelectedPay(m.id as 'yape' | 'plin' | 'card' | 'mp')}
                                                style={{
                                                    padding: '10px 8px',
                                                    borderRadius: '10px',
                                                    border: selectedPay === m.id ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                                                    background: selectedPay === m.id ? 'rgba(124, 58, 237, 0.08)' : '#ffffff',
                                                    color: '#0f172a',
                                                    fontSize: '0.74rem',
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                }}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveStep('confirmed')}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                                                color: '#ffffff',
                                                fontWeight: 900,
                                                fontSize: '0.84rem',
                                                cursor: 'pointer',
                                                boxShadow: '0 6px 16px rgba(124, 58, 237, 0.35)',
                                            }}
                                        >
                                            Confirmar y Pagar S/ 89.00 →
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setActiveStep('confirmed')}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: '12px',
                                                border: '1.5px solid #25D366',
                                                background: 'rgba(37, 211, 102, 0.1)',
                                                color: '#15803d',
                                                fontWeight: 800,
                                                fontSize: '0.78rem',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            💬 Comprar por WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PANTALLA 4: CONFIRMACIÓN DEL PEDIDO (#TV-4587) */}
                        {activeStep === 'confirmed' && (
                            <div style={{ flex: 1, background: '#ffffff', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
                                <div style={{
                                    background: '#075E54',
                                    color: '#ffffff',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <span style={{ fontSize: '0.76rem', fontWeight: 800 }}>✓ Compra completada en WhatsApp</span>
                                    <button
                                        type="button"
                                        onClick={() => setActiveStep('chat')}
                                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 800 }}
                                    >
                                        Volver al chat
                                    </button>
                                </div>

                                <div style={{ padding: '26px 18px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center' }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        background: '#dcfce7',
                                        color: '#16a34a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.8rem',
                                        fontWeight: 900,
                                    }}>
                                        🎉
                                    </div>

                                    <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                                        ¡Pedido realizado! 🎉
                                    </h4>

                                    <div style={{
                                        width: '100%',
                                        background: '#f8fafc',
                                        border: '1.5px solid #e2e8f0',
                                        borderRadius: '16px',
                                        padding: '14px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        marginTop: '6px',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                            <span style={{ color: '#64748b', fontWeight: 700 }}>Código:</span>
                                            <strong style={{ color: '#7c3aed', fontWeight: 900 }}>Pedido #TV-4587</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                            <span style={{ color: '#64748b', fontWeight: 700 }}>Tienda:</span>
                                            <strong style={{ color: '#0f172a' }}>{displayBrand}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                            <span style={{ color: '#64748b', fontWeight: 700 }}>Total:</span>
                                            <strong style={{ color: '#16a34a', fontSize: '0.95rem', fontWeight: 900 }}>S/ 89.00</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                                            <span style={{ color: '#64748b', fontWeight: 700 }}>Estado:</span>
                                            <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800 }}>
                                                ✓ Pedido recibido
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setActiveStep('chat')}
                                        style={{
                                            marginTop: '12px',
                                            width: '100%',
                                            padding: '11px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: '#25D366',
                                            color: '#ffffff',
                                            fontWeight: 800,
                                            fontSize: '0.82rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        💬 Regresar a la conversación de WhatsApp
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
