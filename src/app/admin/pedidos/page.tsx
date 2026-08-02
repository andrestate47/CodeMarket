'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

interface DBOrder {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    payment_method: string;
    payment_status: string;
    fulfillment_status: string;
    total_amount: number;
    currency: string;
    created_at: string;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<DBOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const loadOrders = React.useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        setOrders(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (isMounted) {
                await loadOrders();
            }
        })();
        return () => { isMounted = false; };
    }, [loadOrders]);

    const updateStatus = async (orderId: string, newPaymentStatus: string, newFulfillmentStatus: string) => {
        await supabase
            .from('orders')
            .update({
                payment_status: newPaymentStatus,
                fulfillment_status: newFulfillmentStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

        loadOrders();
    };

    const columns = [
        {
            header: 'Nº Pedido',
            cell: (order: DBOrder) => (
                <Link href={`/admin/pedidos/${order.id}`} style={{ color: 'var(--robotina-orange)', fontWeight: 700, textDecoration: 'none' }}>
                    {order.order_number}
                </Link>
            ),
        },
        {
            header: 'Cliente',
            cell: (order: DBOrder) => (
                <div>
                    <div style={{ fontWeight: 600, color: 'white' }}>{order.customer_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#71717a' }}>{order.customer_email}</div>
                    {order.customer_phone && <div style={{ fontSize: '0.75rem', color: '#52525b' }}>📱 {order.customer_phone}</div>}
                </div>
            ),
        },
        {
            header: 'Método',
            cell: (order: DBOrder) => (
                <span style={{ fontSize: '0.82rem', color: '#d4d4d8', textTransform: 'capitalize' }}>
                    {order.payment_method || 'Yape / Plin'}
                </span>
            ),
        },
        {
            header: 'Monto Total',
            cell: (order: DBOrder) => (
                <span style={{ fontWeight: 800, color: 'white' }}>
                    {formatMoney(order.total_amount)}
                </span>
            ),
        },
        {
            header: 'Estado Pago',
            cell: (order: DBOrder) => <AdminStatusBadge status={order.payment_status} />,
        },
        {
            header: 'Estado Entrega',
            cell: (order: DBOrder) => <AdminStatusBadge status={order.fulfillment_status} />,
        },
        {
            header: 'Acciones de Pago',
            cell: (order: DBOrder) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {order.payment_status !== 'paid' ? (
                        <button
                            onClick={() => updateStatus(order.id, 'paid', order.fulfillment_status)}
                            style={{
                                padding: '6px 12px',
                                background: 'rgba(34, 197, 94, 0.15)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                color: '#4ade80',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            ✓ Marcar Pagado
                        </button>
                    ) : (
                        <button
                            onClick={() => updateStatus(order.id, 'pending', order.fulfillment_status)}
                            style={{
                                padding: '6px 12px',
                                background: 'rgba(234, 179, 8, 0.15)',
                                border: '1px solid rgba(234, 179, 8, 0.3)',
                                color: '#facc15',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Marcar Pendiente
                        </button>
                    )}
                    <Link
                        href={`/admin/pedidos/${order.id}`}
                        style={{
                            padding: '6px 12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Ver Detalle
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <div>
            <AdminPageHeader
                title="Gestión de Pedidos"
                description="Administra los pedidos entrantes, verifica pagos manuales y gestiona entregas."
            />

            {orders.length === 0 && !loading ? (
                <AdminEmptyState
                    title="No hay pedidos registrados"
                    description="Cuando los clientes realicen compras desde la tienda pública, las órdenes aparecerán aquí organizadas por fecha."
                    action={
                        <Link
                            href="/"
                            target="_blank"
                            style={{
                                padding: '10px 16px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'white',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                            }}
                        >
                            Probar Tienda Pública
                        </Link>
                    }
                />
            ) : (
                <AdminDataTable
                    columns={columns}
                    data={orders}
                    keyExtractor={o => o.id}
                    loading={loading}
                />
            )}
        </div>
    );
}
