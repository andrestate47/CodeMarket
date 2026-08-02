'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';

interface DBOrder {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    payment_method: string;
    payment_status: string;
    fulfillment_status: string;
    subtotal_amount: number;
    shipping_amount: number;
    discount_amount: number;
    total_amount: number;
    created_at: string;
    notes?: string;
}

export default function AdminOrderDetailPage() {
    const params = useParams();
    const orderId = params?.id as string;
    const [order, setOrder] = useState<DBOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (!orderId) return;
            setLoading(true);
            const { data } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (isMounted) {
                setOrder(data);
                setLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, [orderId]);

    const updateStatus = async (newPaymentStatus: string, newFulfillmentStatus: string) => {
        if (!order) return;
        await supabase
            .from('orders')
            .update({
                payment_status: newPaymentStatus,
                fulfillment_status: newFulfillmentStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

        setOrder({
            ...order,
            payment_status: newPaymentStatus,
            fulfillment_status: newFulfillmentStatus,
        });
    };

    if (loading) {
        return <div style={{ padding: '48px', color: '#a1a1aa' }}>Cargando detalle del pedido...</div>;
    }

    if (!order) {
        return (
            <div>
                <AdminPageHeader title="Pedido no encontrado" description="El pedido solicitado no existe o fue eliminado." />
                <Link href="/admin/pedidos" style={{ color: '#c084fc', textDecoration: 'none', fontWeight: 600 }}>← Volver a lista de pedidos</Link>
            </div>
        );
    }

    return (
        <div>
            <AdminPageHeader
                title={`Pedido ${order.order_number}`}
                description={`Realizado el ${new Date(order.created_at).toLocaleString('es-PE')}`}
                action={
                    <Link
                        href="/admin/pedidos"
                        style={{
                            padding: '8px 14px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            fontWeight: 600,
                        }}
                    >
                        ← Volver a Pedidos
                    </Link>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
                {/* Main Info */}
                <div style={{ background: '#0e0e14', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
                        <div>
                            <span style={{ fontSize: '0.85rem', color: '#71717a', display: 'block' }}>Estado de Pago</span>
                            <AdminStatusBadge status={order.payment_status} />
                        </div>
                        <div>
                            <span style={{ fontSize: '0.85rem', color: '#71717a', display: 'block' }}>Estado de Entrega</span>
                            <AdminStatusBadge status={order.fulfillment_status} />
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '12px' }}>Actualizar Estado</h3>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {order.payment_status !== 'paid' ? (
                                <button
                                    onClick={() => updateStatus('paid', order.fulfillment_status)}
                                    style={{ padding: '8px 16px', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #4ade80', color: '#4ade80', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    ✓ Confirmar Pago
                                </button>
                            ) : (
                                <button
                                    onClick={() => updateStatus('pending', order.fulfillment_status)}
                                    style={{ padding: '8px 16px', background: 'rgba(234, 179, 8, 0.2)', border: '1px solid #facc15', color: '#facc15', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Marcar Pago Pendiente
                                </button>
                            )}

                            {order.fulfillment_status !== 'fulfilled' ? (
                                <button
                                    onClick={() => updateStatus(order.payment_status, 'fulfilled')}
                                    style={{ padding: '8px 16px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #60a5fa', color: '#60a5fa', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    🚚 Marcar Entregado
                                </button>
                            ) : (
                                <button
                                    onClick={() => updateStatus(order.payment_status, 'unfulfilled')}
                                    style={{ padding: '8px 16px', background: 'rgba(249, 115, 22, 0.2)', border: '1px solid #fb923c', color: '#fb923c', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Marcar No Entregado
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '12px' }}>Resumen Económico</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa' }}>
                                <span>Subtotal</span>
                                <span>{formatMoney(order.subtotal_amount || order.total_amount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa' }}>
                                <span>Envío</span>
                                <span>{formatMoney(order.shipping_amount || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: 800, fontSize: '1.1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px', marginTop: '4px' }}>
                                <span>Total</span>
                                <span>{formatMoney(order.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div style={{ background: '#0e0e14', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: 0 }}>Datos del Cliente</h3>
                    <div>
                        <span style={{ fontSize: '0.78rem', color: '#71717a', display: 'block' }}>Nombre</span>
                        <span style={{ fontWeight: 600, color: 'white' }}>{order.customer_name}</span>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.78rem', color: '#71717a', display: 'block' }}>Correo Electrónico</span>
                        <span style={{ color: '#d4d4d8' }}>{order.customer_email}</span>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.78rem', color: '#71717a', display: 'block' }}>Teléfono</span>
                        <span style={{ color: '#d4d4d8' }}>{order.customer_phone || 'No registrado'}</span>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.78rem', color: '#71717a', display: 'block' }}>Método de Pago Seleccionado</span>
                        <span style={{ color: '#d4d4d8', textTransform: 'capitalize' }}>{order.payment_method || 'Yape / Plin'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
