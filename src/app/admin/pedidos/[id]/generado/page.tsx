'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatMoney } from '@/lib/money';
import { getSingleOrderAction, OrderRecord } from '@/modules/orders/actions';

export default function ManualOrderGeneratedPage() {
    const params = useParams();
    const orderId = params?.id as string;
    const [order, setOrder] = useState<OrderRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        if (!orderId) return;
        getSingleOrderAction(orderId).then((res) => {
            if (active && res.success && res.order) {
                setOrder(res.order);
            }
            if (active) setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [orderId]);

    return (
        <div
            style={{
                minHeight: 'calc(100vh - 140px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 16px',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '520px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '40px 36px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
                    textAlign: 'center',
                }}
            >
                {/* Check Icon Badge */}
                <div
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(22, 163, 74, 0.1)',
                        border: '1.5px solid rgba(22, 163, 74, 0.3)',
                        color: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px auto',
                    }}
                >
                    <svg
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>

                {/* Title & Subtitle */}
                <h1
                    style={{
                        fontSize: '1.55rem',
                        fontWeight: 800,
                        color: 'var(--foreground)',
                        margin: '0 0 8px 0',
                        letterSpacing: '-0.02em',
                    }}
                >
                    Tu pedido ha sido generado
                </h1>
                <p
                    style={{
                        fontSize: '0.92rem',
                        color: 'var(--text-muted)',
                        margin: '0 0 24px 0',
                        lineHeight: 1.5,
                    }}
                >
                    El pedido manual se registró correctamente en el sistema y ya se encuentra listo para su gestión.
                </p>

                {/* Order Mini Summary Box */}
                {!loading && order && (
                    <div
                        style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            padding: '16px 18px',
                            marginBottom: '28px',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Nº de Pedido
                            </span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--foreground)' }}>
                                #{order.order_number}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Cliente</span>
                            <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>{order.customer_name}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Entrega</span>
                            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>
                                {order.delivery_type === 'pickup' ? 'Recoger en tienda' : `Delivery (${order.shipping_district || 'Lima'})`}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', borderTop: '1px solid var(--glass-border)', paddingTop: '10px', marginTop: '2px' }}>
                            <span style={{ color: 'var(--foreground)', fontWeight: 800 }}>Total</span>
                            <span style={{ color: 'var(--foreground)', fontWeight: 800 }}>{formatMoney(order.total_amount)}</span>
                        </div>
                    </div>
                )}

                {/* Two Primary / Secondary Action Buttons */}
                <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <Link
                        href="/admin"
                        style={{
                            padding: '13px 18px',
                            borderRadius: '10px',
                            background: 'var(--card-bg)',
                            border: '1.5px solid var(--glass-border)',
                            color: 'var(--foreground)',
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        Ir a inicio
                    </Link>

                    <Link
                        href={`/admin/pedidos/${orderId}`}
                        style={{
                            padding: '13px 18px',
                            borderRadius: '10px',
                            background: 'var(--robotina-orange, #ff6b00)',
                            border: '1.5px solid var(--robotina-orange, #ff6b00)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        Ver el pedido →
                    </Link>
                </div>
            </div>
        </div>
    );
}

