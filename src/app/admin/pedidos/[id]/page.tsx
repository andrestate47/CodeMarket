'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import {
    updateOrderStatusAction,
    createOrderNoteAction,
    OrderRecord,
    OrderItemRecord,
    OrderEventRecord,
    OrderNoteRecord
} from '@/modules/orders/actions';

export default function AdminOrderDetailPage() {
    const params = useParams();
    const orderId = params?.id as string;

    const [order, setOrder] = useState<OrderRecord | null>(null);
    const [items, setItems] = useState<OrderItemRecord[]>([]);
    const [events, setEvents] = useState<OrderEventRecord[]>([]);
    const [notes, setNotes] = useState<OrderNoteRecord[]>([]);
    const [customerHistory, setCustomerHistory] = useState<{ totalOrders: number; totalSpent: number }>({ totalOrders: 0, totalSpent: 0 });

    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // New Note Form
    const [newNoteContent, setNewNoteContent] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (!orderId) return;
            setLoading(true);

            // Fetch Order
            const { data: orderData } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (orderData && isMounted) {
                setOrder(orderData);

                // Fetch Order Items
                const { data: itemsData } = await supabase
                    .from('order_items')
                    .select('*')
                    .eq('order_id', orderId);
                setItems(itemsData || []);

                // Fetch Order Events (History)
                const { data: eventsData } = await supabase
                    .from('order_events')
                    .select('*')
                    .eq('order_id', orderId)
                    .order('created_at', { ascending: false });
                setEvents(eventsData || []);

                // Fetch Internal Notes
                const { data: notesData } = await supabase
                    .from('order_notes')
                    .select('*')
                    .eq('order_id', orderId)
                    .order('created_at', { ascending: false });
                setNotes(notesData || []);

                // Fetch Customer history if customer_id exists
                if (orderData.customer_id) {
                    const { data: custOrders } = await supabase
                        .from('orders')
                        .select('total_amount')
                        .eq('customer_id', orderData.customer_id);

                    if (custOrders && isMounted) {
                        const totalSpent = custOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
                        setCustomerHistory({
                            totalOrders: custOrders.length,
                            totalSpent,
                        });
                    }
                }

                setLoading(false);
            }
        })();

        return () => { isMounted = false; };
    }, [orderId, refreshTrigger]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const handleUpdateStatus = (updates: { orderStatus?: string; paymentStatus?: string; fulfillmentStatus?: string }) => {
        startTransition(async () => {
            const res = await updateOrderStatusAction(orderId, updates);
            if (res.success) {
                showToast('Estado actualizado.');
                setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(`Error: ${res.error}`);
            }
        });
    };

    const handleAddInternalNote = () => {
        if (!newNoteContent.trim()) return;
        startTransition(async () => {
            const res = await createOrderNoteAction(orderId, newNoteContent);
            if (res.success) {
                setNewNoteContent('');
                showToast('Nota interna agregada.');
                setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(`Error: ${res.error}`);
            }
        });
    };

    const handleCopyAddress = () => {
        if (!order) return;
        const fullAddr = `${order.shipping_address_line || ''}, ${order.shipping_district || ''}, ${order.shipping_province || ''}, ${order.shipping_department || ''}. Ref: ${order.shipping_reference || 'S/R'}`;
        navigator.clipboard.writeText(fullAddr);
        showToast('Dirección de entrega copiada.');
    };

    const handleContactWhatsApp = () => {
        if (!order || !order.customer_phone) {
            showToast('El cliente no tiene teléfono registrado.');
            return;
        }
        const phone = order.customer_phone.replace(/[^0-9]/g, '');
        const message = encodeURIComponent(`Hola ${order.customer_name}, te contactamos por tu pedido ${order.order_number} en CodeMarket.`);
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    };

    if (loading) {
        return <div style={{ padding: '48px', color: '#a1a1aa' }}>Cargando detalle completo del pedido...</div>;
    }

    if (!order) {
        return (
            <div>
                <AdminPageHeader title="Pedido no encontrado" description="El pedido solicitado no existe." />
                <Link href="/admin/pedidos" style={{ color: 'var(--robotina-orange)', textDecoration: 'none', fontWeight: 700 }}>← Volver a Pedidos</Link>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <AdminPageHeader
                title={`Pedido #${order.order_number}`}
                description={`Realizado el ${new Date(order.created_at).toLocaleString('es-PE')} • Canal: ${order.source || 'Tienda online'}`}
                action={
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleContactWhatsApp}
                            style={{ padding: '8px 14px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', color: '#4ade80', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            💬 Contactar WhatsApp
                        </button>
                        <Link
                            href={`/admin/pedidos/${order.id}/imprimir`}
                            target="_blank"
                            style={{ padding: '8px 14px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: 'white', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
                        >
                            🖨️ Imprimir
                        </Link>
                        <Link
                            href="/admin/pedidos"
                            style={{ padding: '8px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
                        >
                            ← Volver a Lista
                        </Link>
                    </div>
                }
            />

            {/* Notification Toast */}
            {toastMessage && (
                <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: '#18181b', color: '#f4f4f5', padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--robotina-orange)', fontWeight: 600 }}>
                    💬 {toastMessage}
                </div>
            )}

            {/* STATUS SUMMARY BAR */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                        <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block' }}>Estado del Pedido</span>
                        <AdminStatusBadge status={order.order_status || 'new'} />
                    </div>
                    <div>
                        <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block' }}>Estado de Pago</span>
                        <AdminStatusBadge status={order.payment_status || 'pending'} />
                    </div>
                    <div>
                        <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block' }}>Estado de Entrega</span>
                        <AdminStatusBadge status={order.fulfillment_status || 'unfulfilled'} />
                    </div>
                </div>

                {/* Quick Status Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {order.payment_status !== 'paid' && (
                        <button
                            onClick={() => handleUpdateStatus({ paymentStatus: 'paid' })}
                            disabled={isPending}
                            style={{ padding: '7px 12px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', color: '#4ade80', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            ✓ Registrar Pago
                        </button>
                    )}
                    {order.fulfillment_status !== 'delivered' && (
                        <button
                            onClick={() => handleUpdateStatus({ fulfillmentStatus: 'delivered', orderStatus: 'completed' })}
                            disabled={isPending}
                            style={{ padding: '7px 12px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', color: '#60a5fa', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            🚚 Marcar Entregado
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN TWO COLUMN LAYOUT */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
                {/* LEFT CONTENT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* ITEMS TABLE CARD */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '16px' }}>Productos del Pedido</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: '#a1a1aa' }}>
                                        <th style={{ padding: '10px' }}>Producto</th>
                                        <th style={{ padding: '10px' }}>SKU</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Precio Unit.</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>Cant.</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '12px 10px' }}>
                                                <div style={{ fontWeight: 700, color: 'white' }}>{item.product_name}</div>
                                                {item.variant_name && <div style={{ fontSize: '0.78rem', color: '#60a5fa' }}>{item.variant_name}</div>}
                                            </td>
                                            <td style={{ padding: '12px 10px', color: '#71717a', fontSize: '0.8rem' }}>{item.sku || '—'}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', color: '#e4e4e7' }}>{formatMoney(item.unit_price_amount)}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, color: 'white' }}>{item.quantity}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, color: 'white' }}>{formatMoney(item.total_amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* FINANCIAL BREAKDOWN */}
                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa' }}>
                                    <span>Subtotal</span>
                                    <span>{formatMoney(order.subtotal_amount)}</span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                                        <span>Descuento</span>
                                        <span>-{formatMoney(order.discount_amount)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa' }}>
                                    <span>Envío</span>
                                    <span>{formatMoney(order.shipping_amount)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: 800, fontSize: '1.1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '8px' }}>
                                    <span>Total</span>
                                    <span>{formatMoney(order.total_amount, order.currency)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80', fontSize: '0.85rem' }}>
                                    <span>Monto Pagado</span>
                                    <span>{formatMoney(order.paid_amount || 0)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#facc15', fontSize: '0.85rem' }}>
                                    <span>Saldo Pendiente</span>
                                    <span>{formatMoney(order.balance_amount || (order.total_amount - (order.paid_amount || 0)))}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TIMELINE / HISTORIAL DEL PEDIDO */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '16px' }}>📜 Historial del Pedido (Timeline)</h3>
                        {events.length === 0 ? (
                            <div style={{ color: '#71717a', fontSize: '0.85rem' }}>No hay eventos registrados en la línea de tiempo.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '2px solid var(--glass-border)', paddingLeft: '16px', marginLeft: '6px' }}>
                                {events.map((evt) => (
                                    <div key={evt.id} style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--robotina-orange)' }} />
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{evt.description}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#71717a' }}>
                                            {new Date(evt.created_at).toLocaleString('es-PE')} • Registrado por: {evt.created_by || 'Sistema'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* INTERNAL NOTES SECTION */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '14px' }}>📝 Notas Internas (Solo Administradores)</h3>

                        {order.customer_notes && (
                            <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#facc15', fontWeight: 700, display: 'block' }}>NOTA DEL CLIENTE EN CHECKOUT:</span>
                                <div style={{ fontSize: '0.88rem', color: 'white', marginTop: '2px' }}>&quot;{order.customer_notes}&quot;</div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                            <input
                                type="text"
                                value={newNoteContent}
                                onChange={e => setNewNoteContent(e.target.value)}
                                placeholder="Agregar una nota interna para el equipo..."
                                style={{ flex: 1, padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', fontSize: '0.88rem' }}
                            />
                            <button
                                onClick={handleAddInternalNote}
                                disabled={isPending}
                                style={{ padding: '10px 16px', background: 'var(--gradient-main)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                            >
                                + Agregar Nota
                            </button>
                        </div>

                        {notes.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {notes.map(note => (
                                    <div key={note.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 14px' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'white' }}>{note.content}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '4px' }}>
                                            {new Date(note.created_at).toLocaleString('es-PE')} • {note.user_name || 'Admin'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR — CLIENTE Y ENTREGA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* CUSTOMER CARD */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '14px' }}>👤 Datos del Cliente</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Nombre</span>
                                <span style={{ fontWeight: 700, color: 'white' }}>{order.customer_name}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Correo</span>
                                <span style={{ color: '#e4e4e7' }}>{order.customer_email}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Teléfono</span>
                                <span style={{ color: '#e4e4e7' }}>{order.customer_phone || 'No registrado'}</span>
                            </div>

                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px', marginTop: '4px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Historial del Cliente</span>
                                <div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>
                                    Total de pedidos: <strong style={{ color: 'white' }}>{customerHistory.totalOrders}</strong>
                                    <br />
                                    Monto total gastado: <strong style={{ color: '#4ade80' }}>{formatMoney(customerHistory.totalSpent)}</strong>
                                </div>
                            </div>

                            {order.customer_id && (
                                <Link
                                    href={`/admin/clientes/${order.customer_id}`}
                                    style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', textAlign: 'center', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem', marginTop: '6px' }}
                                >
                                    Ver Perfil del Cliente →
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* DELIVERY CARD */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '14px' }}>🚚 Información de Entrega</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Tipo de Entrega</span>
                                <span style={{ fontWeight: 700, color: 'white', textTransform: 'capitalize' }}>{order.delivery_type || 'pickup'}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Destinatario</span>
                                <span style={{ color: '#e4e4e7' }}>{order.recipient_name || order.customer_name}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Dirección</span>
                                <span style={{ color: '#e4e4e7' }}>{order.shipping_address_line || 'Sin dirección especificada'}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Ubicación</span>
                                <span style={{ color: '#e4e4e7' }}>{order.shipping_district || ''} {order.shipping_province ? `• ${order.shipping_province}` : ''}</span>
                            </div>
                            {order.shipping_reference && (
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Referencia</span>
                                    <span style={{ color: '#e4e4e7' }}>&quot;{order.shipping_reference}&quot;</span>
                                </div>
                            )}

                            <button
                                onClick={handleCopyAddress}
                                style={{ padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', marginTop: '6px' }}
                            >
                                📋 Copiar Dirección Completa
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
