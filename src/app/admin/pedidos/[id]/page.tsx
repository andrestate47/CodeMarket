'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatMoney } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import {
    updateOrderStatusAction,
    createOrderNoteAction,
    getSingleOrderAction,
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

            const res = await getSingleOrderAction(orderId);

            if (res.success && res.order && isMounted) {
                setOrder(res.order);
                setItems(res.items || []);
                setEvents(res.events || []);
                setNotes(res.notes || []);
                if (res.customerHistory) {
                    setCustomerHistory(res.customerHistory);
                }
            }
            if (isMounted) {
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

    const formatDateStr = (dateStr?: string) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return '—';
        }
    };

    if (loading) {
        return <div style={{ padding: '48px 16px', color: 'var(--text-muted)', textAlign: 'center' }}>Cargando detalle completo del pedido...</div>;
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
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            {/* Header */}
            <AdminPageHeader
                title={`Pedido #${order.order_number}`}
                description={`Realizado el ${formatDateStr(order.created_at)} • Canal: ${order.source || 'Tienda online'}`}
                action={
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleContactWhatsApp}
                            style={{
                                padding: '9px 16px',
                                background: 'rgba(34, 197, 94, 0.15)',
                                border: '1.5px solid #22c55e',
                                color: '#4ade80',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            💬 Contactar WhatsApp
                        </button>
                        <Link
                            href={`/admin/pedidos/${order.id}/imprimir`}
                            target="_blank"
                            style={{
                                padding: '9px 16px',
                                background: 'var(--input-bg)',
                                border: '1.5px solid var(--glass-border)',
                                color: 'var(--foreground)',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            🖨️ Imprimir
                        </Link>
                        <Link
                            href="/admin/pedidos"
                            style={{
                                padding: '9px 16px',
                                background: 'var(--input-bg)',
                                border: '1.5px solid var(--glass-border)',
                                color: 'var(--foreground)',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            ← Volver a Lista
                        </Link>
                    </div>
                }
            />

            {/* Notification Toast */}
            {toastMessage && (
                <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: 'var(--card-bg)', color: 'var(--foreground)', padding: '12px 20px', borderRadius: '10px', border: '1.5px solid var(--robotina-orange)', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', maxWidth: 'calc(100vw - 48px)' }}>
                    💬 {toastMessage}
                </div>
            )}

            {/* STATUS SUMMARY BAR */}
            <div style={{
                background: 'var(--card-bg)',
                border: '1.5px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' }}>
                    <div style={{ background: 'var(--input-bg)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Estado Pedido</span>
                        <AdminStatusBadge status={order.order_status || 'new'} />
                    </div>
                    <div style={{ background: 'var(--input-bg)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Estado Pago</span>
                        <AdminStatusBadge status={order.payment_status || 'pending'} />
                    </div>
                    <div style={{ background: 'var(--input-bg)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Estado Entrega</span>
                        <AdminStatusBadge status={order.fulfillment_status || 'unfulfilled'} />
                    </div>
                </div>

                {/* Quick Status Action Buttons */}
                {(order.payment_status !== 'paid' || order.fulfillment_status !== 'delivered') && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                        {order.payment_status !== 'paid' && (
                            <button
                                onClick={() => handleUpdateStatus({ paymentStatus: 'paid' })}
                                disabled={isPending}
                                style={{
                                    padding: '10px 18px',
                                    background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    flex: '1 1 140px',
                                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)',
                                }}
                            >
                                ✓ Registrar Pago
                            </button>
                        )}
                        {order.fulfillment_status !== 'delivered' && (
                            <button
                                onClick={() => handleUpdateStatus({ fulfillmentStatus: 'delivered', orderStatus: 'completed' })}
                                disabled={isPending}
                                style={{
                                    padding: '10px 18px',
                                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    flex: '1 1 140px',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                                }}
                            >
                                🚚 Marcar Entregado
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* MAIN TWO COLUMN RESPONSIVE LAYOUT */}
            <div className="order-details-grid">
                {/* LEFT CONTENT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

                    {/* ITEMS TABLE CARD */}
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '16px' }}>Productos del Pedido</h3>
                        <div style={{ overflowX: 'auto', margin: '0 -8px' }}>
                            <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1.5px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '10px' }}>Producto</th>
                                        <th style={{ padding: '10px' }}>SKU</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Precio Unit.</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>Cant.</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '12px 10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '44px',
                                                        height: '44px',
                                                        borderRadius: '10px',
                                                        overflow: 'hidden',
                                                        background: 'var(--input-bg)',
                                                        border: '1.5px solid var(--glass-border)',
                                                        flexShrink: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        {item.image_url || item.image ? (
                                                            <img
                                                                src={item.image_url || item.image}
                                                                alt={item.product_name}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <span style={{ fontSize: '1.2rem' }}>📦</span>
                                                        )}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, color: 'var(--foreground)', wordBreak: 'break-word' }}>{item.product_name}</div>
                                                        {item.variant_name && <div style={{ fontSize: '0.78rem', color: '#2563eb' }}>{item.variant_name}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 10px', color: 'var(--text-description)', fontSize: '0.8rem' }}>{item.sku || '—'}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', color: 'var(--foreground)' }}>{formatMoney(item.unit_price_amount)}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, color: 'var(--foreground)' }}>{item.quantity}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--foreground)' }}>{formatMoney(item.total_amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* FINANCIAL BREAKDOWN */}
                        <div style={{ borderTop: '1.5px solid var(--glass-border)', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                    <span>Subtotal</span>
                                    <span>{formatMoney(order.subtotal_amount)}</span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                                        <span>Descuento</span>
                                        <span>-{formatMoney(order.discount_amount)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                    <span>Envío</span>
                                    <span>{formatMoney(order.shipping_amount)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--foreground)', fontWeight: 800, fontSize: '1.1rem', borderTop: '1.5px solid var(--glass-border)', paddingTop: '8px' }}>
                                    <span>Total</span>
                                    <span>{formatMoney(order.total_amount, order.currency)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontSize: '0.85rem' }}>
                                    <span>Monto Pagado</span>
                                    <span>{formatMoney(order.paid_amount || 0)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706', fontSize: '0.85rem' }}>
                                    <span>Saldo Pendiente</span>
                                    <span>{formatMoney(order.balance_amount !== undefined ? order.balance_amount : (order.total_amount - (order.paid_amount || 0)))}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TIMELINE / HISTORIAL DEL PEDIDO */}
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '16px' }}>📜 Historial del Pedido (Timeline)</h3>
                        {events.length === 0 ? (
                            <div style={{ color: 'var(--text-description)', fontSize: '0.85rem' }}>No hay eventos registrados en la línea de tiempo.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '2px solid var(--glass-border)', paddingLeft: '16px', marginLeft: '6px' }}>
                                {events.map((evt) => (
                                    <div key={evt.id} style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--robotina-orange)' }} />
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)' }}>{evt.description}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-description)' }}>
                                            {formatDateStr(evt.created_at)} • Registrado por: {evt.created_by || 'Sistema'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* INTERNAL NOTES SECTION */}
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '14px' }}>📝 Notas Internas (Solo Administradores)</h3>

                        {order.customer_notes && (
                            <div style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1.5px solid #d97706', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700, display: 'block' }}>NOTA DEL CLIENTE EN CHECKOUT:</span>
                                <div style={{ fontSize: '0.88rem', color: 'var(--foreground)', marginTop: '2px' }}>&quot;{order.customer_notes}&quot;</div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                value={newNoteContent}
                                onChange={e => setNewNoteContent(e.target.value)}
                                placeholder="Agregar una nota interna para el equipo..."
                                style={{ flex: '1 1 200px', padding: '10px 14px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.88rem' }}
                            />
                            <button
                                onClick={handleAddInternalNote}
                                disabled={isPending}
                                style={{ padding: '10px 16px', background: 'var(--gradient-main)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer', flex: '0 0 auto' }}
                            >
                                + Agregar Nota
                            </button>
                        </div>

                        {notes.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {notes.map(note => (
                                    <div key={note.id} style={{ background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', padding: '10px 14px' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{note.content}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-description)', marginTop: '4px' }}>
                                            {formatDateStr(note.created_at)} • {note.user_name || 'Admin'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR — CLIENTE Y ENTREGA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

                    {/* CUSTOMER CARD */}
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '14px' }}>👤 Datos del Cliente</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Nombre</span>
                                <span style={{ fontWeight: 700, color: 'var(--foreground)', wordBreak: 'break-word' }}>{order.customer_name}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Correo</span>
                                <span style={{ color: 'var(--text-muted)', wordBreak: 'break-all' }}>{order.customer_email}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Teléfono</span>
                                <span style={{ color: 'var(--text-muted)' }}>{order.customer_phone || 'No registrado'}</span>
                            </div>

                            <div style={{ borderTop: '1.5px solid var(--glass-border)', paddingTop: '10px', marginTop: '4px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Historial del Cliente</span>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    Total de pedidos: <strong style={{ color: 'var(--foreground)' }}>{customerHistory.totalOrders}</strong>
                                    <br />
                                    Monto total gastado: <strong style={{ color: '#16a34a' }}>{formatMoney(customerHistory.totalSpent)}</strong>
                                </div>
                            </div>

                            {order.customer_id && (
                                <Link
                                    href={`/admin/clientes/${order.customer_id}`}
                                    style={{ padding: '8px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '6px', textAlign: 'center', color: 'var(--foreground)', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem', marginTop: '6px' }}
                                >
                                    Ver Perfil del Cliente →
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* DELIVERY CARD */}
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '14px' }}>🚚 Información de Entrega</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Tipo de Entrega</span>
                                <span style={{ fontWeight: 700, color: 'var(--foreground)', textTransform: 'capitalize' }}>{order.delivery_type || 'pickup'}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Destinatario</span>
                                <span style={{ color: 'var(--text-muted)', wordBreak: 'break-word' }}>{order.recipient_name || order.customer_name}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Dirección</span>
                                <span style={{ color: 'var(--text-muted)', wordBreak: 'break-word' }}>{order.shipping_address_line || 'Sin dirección especificada'}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Ubicación</span>
                                <span style={{ color: 'var(--text-muted)' }}>{order.shipping_district || ''} {order.shipping_province ? `• ${order.shipping_province}` : ''}</span>
                            </div>
                            {order.shipping_reference && (
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Referencia</span>
                                    <span style={{ color: 'var(--text-muted)', wordBreak: 'break-word' }}>&quot;{order.shipping_reference}&quot;</span>
                                </div>
                            )}

                            <button
                                onClick={handleCopyAddress}
                                style={{ padding: '8px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '6px', color: 'var(--foreground)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', marginTop: '6px' }}
                            >
                                📋 Copiar Dirección Completa
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            <style jsx>{`
                .order-details-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 340px;
                    gap: 24px;
                    align-items: start;
                }
                @media (max-width: 960px) {
                    .order-details-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }
                }
            `}</style>
        </div>
    );
}
