'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatMoney } from '@/lib/money';
import {
    updateOrderStatusAction,
    createOrderNoteAction,
    getSingleOrderAction,
    OrderRecord,
    OrderItemRecord,
    OrderEventRecord,
    OrderNoteRecord
} from '@/modules/orders/actions';

type OrderFlowStage = 'pending' | 'accepted' | 'in_route' | 'delivered';

function getOrderFlowStage(order: OrderRecord | null): OrderFlowStage {
    if (!order) return 'pending';
    const f = (order.fulfillment_status || '').toLowerCase();
    const s = (order.order_status || '').toLowerCase();

    if (f === 'delivered' || f === 'fulfilled' || s === 'completed') {
        return 'delivered';
    }
    if (f === 'shipped' || f === 'in_route' || s === 'processing' || s === 'in_route') {
        return 'in_route';
    }
    if (s === 'confirmed' || s === 'accepted' || f === 'preparing') {
        return 'accepted';
    }
    return 'pending';
}

const STAGE_META: Record<OrderFlowStage, { label: string; color: string; bg: string; border: string; stepIndex: number }> = {
    pending: {
        label: 'Pendiente',
        color: '#d97706',
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.35)',
        stepIndex: 0,
    },
    accepted: {
        label: 'Aceptado (En proceso)',
        color: '#16a34a',
        bg: 'rgba(22, 163, 74, 0.1)',
        border: 'rgba(22, 163, 74, 0.35)',
        stepIndex: 1,
    },
    in_route: {
        label: 'En ruta',
        color: '#2563eb',
        bg: 'rgba(37, 99, 235, 0.1)',
        border: 'rgba(37, 99, 235, 0.35)',
        stepIndex: 2,
    },
    delivered: {
        label: 'Entregado',
        color: '#16a34a',
        bg: 'rgba(22, 163, 74, 0.12)',
        border: 'rgba(22, 163, 74, 0.4)',
        stepIndex: 3,
    },
};

export default function AdminOrderDetailPage() {
    const params = useParams();
    const orderId = params?.id as string;

    const [order, setOrder] = useState<OrderRecord | null>(null);
    const [items, setItems] = useState<OrderItemRecord[]>([]);
    const [events, setEvents] = useState<OrderEventRecord[]>([]);
    const [notes, setNotes] = useState<OrderNoteRecord[]>([]);

    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Copied feedback key
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Slide-over drawer (right-to-left) for pre-written message when accepting order
    const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
    const [prewrittenMessage, setPrewrittenMessage] = useState('');

    // Internal notes
    const [newNoteContent, setNewNoteContent] = useState('');
    const [showTimelineNotes, setShowTimelineNotes] = useState(false);

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
            }
            if (isMounted) {
                setLoading(false);
            }
        })();

        return () => { isMounted = false; };
    }, [orderId, refreshTrigger]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    };

    const copyValue = (key: string, text: string, label: string) => {
        if (!text) {
            showToast(`No hay ${label.toLowerCase()} para copiar.`);
            return;
        }
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        showToast(`Copiado: ${label}`);
        setTimeout(() => {
            setCopiedKey(prev => (prev === key ? null : prev));
        }, 1800);
    };

    const buildAcceptedMessage = (ord: OrderRecord, ordItems: OrderItemRecord[]) => {
        const isPickup = ord.delivery_type === 'pickup';
        const itemsLines = ordItems
            .map(i => `• ${i.quantity}x ${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ''} — ${formatMoney(i.total_amount)}`)
            .join('\n');

        const deliveryLine = isPickup
            ? `📍 Modalidad: Recoger en tienda`
            : `🛵 Dirección de entrega: ${ord.shipping_address_line || 'Por confirmar'}, ${ord.shipping_district || 'Lima'} (${ord.shipping_department || 'Lima'} / ${ord.shipping_province || 'Lima'})${ord.shipping_reference ? `\n📌 Referencia: ${ord.shipping_reference}` : ''}`;

        return `¡Hola ${ord.customer_name}! 👋\n\nTe escribimos para confirmarte que tu pedido *#${ord.order_number}* ha sido *ACEPTADO* y ya se encuentra *en proceso* de preparación. 📦✨\n\n*Resumen de tu compra:*\n${itemsLines}\n\nSubtotal: ${formatMoney(ord.subtotal_amount)}\n${isPickup ? 'Recojo en tienda: Gratis' : `Delivery: ${formatMoney(ord.shipping_amount)}`}\n*TOTAL: ${formatMoney(ord.total_amount)}*\n\n${deliveryLine}\n\nTe avisaremos por aquí apenas tu pedido salga *en ruta*. ¡Muchas gracias por tu preferencia! 🙌`;
    };

    // Update prewritten message whenever order/items load
    useEffect(() => {
        if (order) {
            setPrewrittenMessage(buildAcceptedMessage(order, items));
        }
    }, [order, items]);

    // 1. Accept Order -> State becomes 'accepted' AND slide-over drawer opens from right to left
    const handleAcceptOrder = () => {
        if (!order) return;
        const msg = buildAcceptedMessage(order, items);
        setPrewrittenMessage(msg);
        // Optimistically update local order state so behind the drawer it's already Accepted
        setOrder(prev => prev ? { ...prev, order_status: 'confirmed', fulfillment_status: 'preparing' } : prev);
        setIsMessageDrawerOpen(true);

        startTransition(async () => {
            const res = await updateOrderStatusAction(orderId, {
                orderStatus: 'confirmed',
                fulfillmentStatus: 'preparing',
            });
            if (res.success) {
                showToast('✅ Pedido aceptado y en proceso.');
                setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(`Error: ${res.error}`);
            }
        });
    };

    // 2. Move to 'En ruta'
    const handleMoveToInRoute = () => {
        if (!order) return;
        setOrder(prev => prev ? { ...prev, order_status: 'processing', fulfillment_status: 'shipped' } : prev);

        startTransition(async () => {
            const res = await updateOrderStatusAction(orderId, {
                orderStatus: 'processing',
                fulfillmentStatus: 'shipped',
            });
            if (res.success) {
                showToast('🛵 Pedido actualizado a: En ruta.');
                setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(`Error: ${res.error}`);
            }
        });
    };

    // 3. Move to 'Entregado' (Final state)
    const handleMoveToDelivered = () => {
        if (!order) return;
        setOrder(prev => prev ? { ...prev, order_status: 'completed', fulfillment_status: 'delivered' } : prev);

        startTransition(async () => {
            const res = await updateOrderStatusAction(orderId, {
                orderStatus: 'completed',
                fulfillmentStatus: 'delivered',
            });
            if (res.success) {
                showToast('🎉 Pedido finalizado: Entregado.');
                setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(`Error: ${res.error}`);
            }
        });
    };

    // Direct jump if admin clicks a step in the stepper
    const handleSelectStageManual = (targetStage: OrderFlowStage) => {
        if (!order || isPending) return;
        if (targetStage === 'pending') {
            setOrder(prev => prev ? { ...prev, order_status: 'new', fulfillment_status: 'unfulfilled' } : prev);
            startTransition(async () => {
                await updateOrderStatusAction(orderId, { orderStatus: 'new', fulfillmentStatus: 'unfulfilled' });
                showToast('⏳ Estado cambiado a: Pendiente.');
                setRefreshTrigger(prev => prev + 1);
            });
        } else if (targetStage === 'accepted') {
            handleAcceptOrder();
        } else if (targetStage === 'in_route') {
            handleMoveToInRoute();
        } else if (targetStage === 'delivered') {
            handleMoveToDelivered();
        }
    };

    const handleTogglePaymentPaid = () => {
        if (!order) return;
        const nextStatus = order.payment_status === 'paid' ? 'pending' : 'paid';
        setOrder(prev => prev ? { ...prev, payment_status: nextStatus } : prev);
        startTransition(async () => {
            const res = await updateOrderStatusAction(orderId, { paymentStatus: nextStatus });
            if (res.success) {
                showToast(nextStatus === 'paid' ? '💳 Pago marcado como Pagado.' : '⏳ Pago marcado como Pendiente.');
                setRefreshTrigger(prev => prev + 1);
            }
        });
    };

    const handleSendWhatsAppMessage = (customText?: string) => {
        if (!order) return;
        const rawPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
        const normalizedPhone = rawPhone.length === 9 ? `51${rawPhone}` : rawPhone;
        const textToSend = customText || prewrittenMessage;
        if (!normalizedPhone) {
            navigator.clipboard.writeText(textToSend);
            showToast('El cliente no tiene teléfono; se copió el mensaje al portapapeles.');
            return;
        }
        window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(textToSend)}`, '_blank');
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

    if (loading && !order) {
        return <div style={{ padding: '48px 16px', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>Cargando pedido...</div>;
    }

    if (!order) {
        return (
            <div style={{ padding: '32px' }}>
                <h2 style={{ color: 'var(--foreground)', marginBottom: '12px' }}>Pedido no encontrado</h2>
                <Link href="/admin/pedidos" style={{ color: 'var(--robotina-orange)', textDecoration: 'none', fontWeight: 700 }}>← Volver a Pedidos</Link>
            </div>
        );
    }

    const currentStage = getOrderFlowStage(order);
    const stageInfo = STAGE_META[currentStage];
    const isPickup = order.delivery_type === 'pickup';

    // Split customer name into Nombres / Apellidos for visual parity with Step 2
    const nameParts = (order.customer_name || '').trim().split(/\s+/);
    const firstNameDisplay = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : (order.customer_name || '—');
    const lastNameDisplay = nameParts.length > 1 ? nameParts.slice(-1).join(' ') : '—';

    const fullCustomerCopyText = [
        `Cliente: ${order.customer_name}`,
        order.customer_phone ? `Teléfono: ${order.customer_phone}` : null,
        order.document_number ? `${order.document_type || 'DNI'}: ${order.document_number}` : null,
        order.customer_email ? `Correo: ${order.customer_email}` : null,
    ].filter(Boolean).join('\n');

    const fullDeliveryCopyText = isPickup
        ? `Método: Recoger en tienda\nCliente: ${order.customer_name}\nTeléfono: ${order.customer_phone || '—'}`
        : [
            `Destinatario: ${order.recipient_name || order.customer_name}`,
            `Teléfono: ${order.recipient_phone || order.customer_phone || '—'}`,
            `Dirección: ${order.shipping_address_line || '—'}`,
            `Ubicación: ${order.shipping_department || 'Lima'} / ${order.shipping_province || 'Lima'} / ${order.shipping_district || '—'}`,
            `Referencia: ${order.shipping_reference || 'Sin referencia'}`,
            `Delivery: ${formatMoney(order.shipping_amount)}`,
        ].join('\n');

    const fullSummaryCopyText = [
        `PEDIDO #${order.order_number} (${stageInfo.label.toUpperCase()})`,
        `Cliente: ${order.customer_name} (${order.customer_phone || 'Sin tlf'})`,
        `--- PRODUCTOS ---`,
        ...items.map(i => `• ${i.quantity}x ${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ''} = ${formatMoney(i.total_amount)}`),
        `-----------------`,
        `Subtotal: ${formatMoney(order.subtotal_amount)}`,
        `${isPickup ? 'Recojo en tienda' : 'Delivery'}: ${formatMoney(order.shipping_amount)}`,
        `TOTAL: ${formatMoney(order.total_amount)}`,
        isPickup ? `Entrega: Recoger en tienda` : `Dirección: ${order.shipping_address_line || ''}, ${order.shipping_district || ''} (Ref: ${order.shipping_reference || '—'})`,
    ].join('\n');

    // Reusable Copy Icon Button (Appears on hover over its parent .copy-field-row)
    const renderCopyBtn = (key: string, textToCopy: string, label: string, _compact = false) => {
        const isCopied = copiedKey === key;
        return (
            <button
                type="button"
                className={`hover-copy-btn ${isCopied ? 'is-copied' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    copyValue(key, textToCopy, label);
                }}
                title={isCopied ? `¡${label} copiado!` : `Copiar ${label}`}
                style={{
                    width: '30px',
                    height: '30px',
                    minHeight: '30px',
                    padding: 0,
                    borderRadius: '7px',
                    border: isCopied ? '1.5px solid #16a34a' : '1px solid var(--structural-border, var(--glass-border))',
                    background: isCopied ? 'rgba(22, 163, 74, 0.12)' : 'var(--background)',
                    color: isCopied ? '#16a34a' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                {isCopied ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                )}
            </button>
        );
    };

    return (
        <div style={{ position: 'relative', paddingBottom: '48px' }}>
            <style>{`
                .copy-field-row .hover-copy-btn {
                    opacity: 0;
                    pointer-events: none;
                    transform: scale(0.92);
                    transition: opacity 0.15s ease, transform 0.15s ease, color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
                }
                .copy-field-row:hover .hover-copy-btn,
                .copy-field-row .hover-copy-btn.is-copied,
                .copy-field-row .hover-copy-btn:focus-visible {
                    opacity: 1;
                    pointer-events: auto;
                    transform: scale(1);
                }
                .copy-field-row .hover-copy-btn:hover {
                    color: var(--robotina-orange, #ff6b00) !important;
                    border-color: var(--robotina-orange, #ff6b00) !important;
                    background: rgba(255, 107, 0, 0.08) !important;
                }
            `}</style>
            {/* Toast Notification */}
            {toastMessage && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 10000,
                    background: 'var(--foreground)',
                    color: 'var(--card-bg)',
                    padding: '11px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                }}>
                    {toastMessage}
                </div>
            )}

            {/* ─── HEADER BAR (CORPORATE MONOCHROME) ─── */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Inicio</Link>
                    <span>/</span>
                    <Link href="/admin/pedidos" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Pedidos</Link>
                    <span>/</span>
                    <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>#{order.order_number}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {/* Botón pequeña flechita para ir un paso más atrás y modificar cualquier dato */}
                        <Link
                            href={`/admin/pedidos/nuevo?edit=${order.id}`}
                            title="Ir un paso atrás para modificar algún dato del pedido"
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '8px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--foreground)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.15rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                flexShrink: 0,
                            }}
                        >
                            ←
                        </Link>
                        <div>
                            <div className="copy-field-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
                                    Pedido #{order.order_number}
                                </h1>
                                {renderCopyBtn('order_number', order.order_number, 'Número de pedido')}
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.78rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.03em',
                                    background: stageInfo.bg,
                                    color: stageInfo.color,
                                    border: `1px solid ${stageInfo.border}`,
                                }}>
                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: stageInfo.color }} />
                                    <span>Estado: {stageInfo.label}</span>
                                </span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
                                Creado el {formatDateStr(order.created_at)} • Usa la flecha <strong>←</strong> si deseas regresar un paso y modificar algún dato.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setIsMessageDrawerOpen(true)}
                            style={{
                                padding: '8px 14px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--foreground)',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                            }}
                        >
                            Ver mensaje pre-escrito
                        </button>
                        <Link
                            href={`/admin/pedidos/${order.id}/imprimir`}
                            target="_blank"
                            style={{
                                padding: '8px 14px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--foreground)',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                textDecoration: 'none',
                            }}
                        >
                            Imprimir
                        </Link>
                        <Link
                            href="/admin/pedidos/nuevo"
                            style={{
                                padding: '8px 14px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--foreground)',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                textDecoration: 'none',
                            }}
                        >
                            + Nuevo Pedido
                        </Link>
                        <Link
                            href="/admin/pedidos"
                            style={{
                                padding: '8px 14px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--foreground)',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                textDecoration: 'none',
                            }}
                        >
                            ← Volver a Pedidos
                        </Link>
                    </div>
                </div>
            </div>

            {/* ─── BARRA PROGRESIVA DE ESTADOS (EMPRESARIAL CON ESTADOS SEMÁNTICOS) ─── */}
            <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '22px',
            }}>
                <div className="admin-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {(['pending', 'accepted', 'in_route', 'delivered'] as OrderFlowStage[]).map((stKey, idx) => {
                        const meta = STAGE_META[stKey];
                        const isActive = currentStage === stKey;
                        const isCompleted = stageInfo.stepIndex > idx;
                        return (
                            <button
                                key={stKey}
                                type="button"
                                onClick={() => handleSelectStageManual(stKey)}
                                disabled={isPending}
                                style={{
                                    padding: '12px 14px',
                                    borderRadius: '8px',
                                    border: isActive
                                        ? `2px solid ${meta.color}`
                                        : isCompleted
                                            ? `1.5px solid ${meta.border}`
                                            : '1px solid var(--glass-border)',
                                    background: isActive
                                        ? meta.bg
                                        : isCompleted
                                            ? 'rgba(22, 163, 74, 0.05)'
                                            : 'var(--card-bg)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <div style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    background: isActive ? meta.color : isCompleted ? '#16a34a' : 'var(--card-bg)',
                                    color: isActive || isCompleted ? '#ffffff' : 'var(--text-muted)',
                                    border: isActive || isCompleted ? 'none' : '1px solid var(--glass-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.78rem',
                                    flexShrink: 0,
                                }}>
                                    {isCompleted ? '✓' : idx + 1}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.68rem', color: isActive ? meta.color : isCompleted ? '#16a34a' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Paso {idx + 1}
                                    </div>
                                    <div style={{
                                        fontSize: '0.86rem',
                                        fontWeight: 800,
                                        color: isActive ? meta.color : isCompleted ? '#16a34a' : 'var(--foreground)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {meta.label}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─── MAIN 70 / 30 SPLIT LAYOUT (IDENTICAL TO STEP 2) ─── */}
            <div className="admin-split-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(320px, 3fr)', gap: '24px', alignItems: 'start' }}>

                {/* 70% LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* SECTION 1: INFORMACIÓN DEL CLIENTE */}
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                        <div className="copy-field-row" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                                Información del Cliente
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {renderCopyBtn('all_customer', fullCustomerCopyText, 'Datos del cliente')}
                            </div>
                        </div>

                        <div style={{ padding: '0 20px 20px 20px' }}>
                            <div style={{ border: '1px solid var(--glass-border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--card-bg)' }}>

                                {/* Teléfono */}
                                <div className="copy-field-row" style={{ padding: '10px 16px', borderBottom: '1.5px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Número telefónico</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                <img src="https://flagcdn.com/w40/pe.png" alt="Perú" style={{ width: '18px', height: '13px', objectFit: 'cover', borderRadius: '2px' }} />
                                                (+51)
                                            </span>
                                            <span style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--foreground)' }}>
                                                {order.customer_phone || 'No registrado'}
                                            </span>
                                        </div>
                                    </div>
                                    {order.customer_phone && renderCopyBtn('cust_phone', order.customer_phone, 'Teléfono')}
                                </div>

                                {/* Nombres */}
                                <div className="copy-field-row" style={{ padding: '10px 16px', borderBottom: '1.5px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Nombres</label>
                                        <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '4px' }}>
                                            {firstNameDisplay}
                                        </div>
                                    </div>
                                    {renderCopyBtn('cust_firstname', firstNameDisplay, 'Nombres')}
                                </div>

                                {/* Apellidos */}
                                <div className="copy-field-row" style={{ padding: '10px 16px', borderBottom: '1.5px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Apellidos / Nombre Completo</label>
                                        <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '4px' }}>
                                            {lastNameDisplay !== '—' ? `${lastNameDisplay} (${order.customer_name})` : order.customer_name}
                                        </div>
                                    </div>
                                    {renderCopyBtn('cust_fullname', order.customer_name, 'Nombre completo')}
                                </div>

                                {/* Documento de identidad */}
                                <div className="copy-field-row" style={{ padding: '10px 16px', borderBottom: '1.5px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>
                                            Documento de identidad ({order.document_type || 'DNI'})
                                        </label>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)', marginTop: '4px' }}>
                                            {order.document_number || 'No especificado'}
                                        </div>
                                    </div>
                                    {order.document_number && renderCopyBtn('cust_doc', order.document_number, 'Documento')}
                                </div>

                                {/* Correo electrónico */}
                                <div className="copy-field-row" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Correo electrónico</label>
                                        <div style={{ fontSize: '0.95rem', color: 'var(--foreground)', marginTop: '4px' }}>
                                            {order.customer_email || 'No registrado'}
                                        </div>
                                    </div>
                                    {order.customer_email && renderCopyBtn('cust_email', order.customer_email, 'Correo electrónico')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: CANAL DE VENTA, VENDEDOR Y PAGO */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                                2. Canal de Venta, Vendedor y Pago
                            </h3>
                            <button
                                type="button"
                                onClick={handleTogglePaymentPaid}
                                disabled={isPending}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: order.payment_status === 'paid' ? '1px solid rgba(22, 163, 74, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                                    background: order.payment_status === 'paid' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    color: order.payment_status === 'paid' ? '#16a34a' : '#d97706',
                                    fontSize: '0.76rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                }}
                            >
                                {order.payment_status === 'paid' ? '✓ Pagado (Clic para cambiar)' : '● Pago Pendiente (Marcar Pagado)'}
                            </button>
                        </div>

                        <div className="admin-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            <div style={{ padding: '10px 14px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>Canal de Venta</label>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '2px', textTransform: 'capitalize' }}>
                                    {order.source || 'WhatsApp'}
                                </div>
                            </div>

                            <div style={{ padding: '10px 14px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden' }}>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>Vendedor / Referencia</label>
                                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--foreground)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {(order.source_reference || 'Administrador').replace(/\s*•\s*$/, '')}
                                </div>
                            </div>

                            <div style={{ padding: '10px 14px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>Método de Pago</label>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '2px', textTransform: 'uppercase' }}>
                                    {order.payment_method || 'YAPE'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: MÉTODO DE ENTREGA Y DIRECCIÓN */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
                        <div className="copy-field-row" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                                Método de entrega
                            </h3>
                            {renderCopyBtn('all_delivery', fullDeliveryCopyText, 'Toda la dirección de entrega')}
                        </div>

                        <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {/* Radio visual Recoger en tienda */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderBottom: 'none', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', opacity: isPickup ? 1 : 0.6 }}>
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: isPickup ? '5px solid var(--foreground)' : '1.5px solid var(--text-muted)', background: 'transparent' }} />
                                <span style={{ fontSize: '0.95rem', color: 'var(--foreground)', fontWeight: isPickup ? 700 : 500 }}>Recoger en tienda</span>
                            </div>

                            {/* Radio visual Delivery */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderBottomLeftRadius: isPickup ? '8px' : '0', borderBottomRightRadius: isPickup ? '8px' : '0', opacity: !isPickup ? 1 : 0.6 }}>
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: !isPickup ? '5px solid var(--foreground)' : '1.5px solid var(--text-muted)', background: 'transparent' }} />
                                <span style={{ fontSize: '0.95rem', color: 'var(--foreground)', fontWeight: !isPickup ? 700 : 500 }}>Delivery</span>
                            </div>

                            {/* Datos de Dirección desplegados cuando es Delivery */}
                            {!isPickup && (
                                <div style={{ border: '1px solid var(--glass-border)', borderTop: 'none', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', background: 'var(--card-bg)', overflow: 'hidden' }}>
                                    {/* Dirección exacta */}
                                    <div className="copy-field-row" style={{ padding: '10px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Dirección de entrega</label>
                                            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '4px' }}>
                                                {order.shipping_address_line || 'Sin dirección especificada'}
                                            </div>
                                        </div>
                                        {renderCopyBtn('addr_line', order.shipping_address_line || '', 'Dirección')}
                                    </div>

                                    {/* Lima / Lima / Distrito */}
                                    <div className="admin-ubigeo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', borderBottom: '1px solid var(--glass-border)' }}>
                                        <div style={{ padding: '10px 16px', borderRight: '1px solid var(--glass-border)' }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Departamento</label>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '4px' }}>
                                                {order.shipping_department || 'Lima'}
                                            </div>
                                        </div>

                                        <div style={{ padding: '10px 16px', borderRight: '1px solid var(--glass-border)' }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Provincia</label>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '4px' }}>
                                                {order.shipping_province || 'Lima'}
                                            </div>
                                        </div>

                                        <div style={{ padding: '10px 16px' }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Distrito</label>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '4px' }}>
                                                {order.shipping_district || 'Por definir'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Referencia */}
                                    <div className="copy-field-row" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Referencia</label>
                                            <div style={{ fontSize: '0.95rem', color: 'var(--foreground)', marginTop: '4px' }}>
                                                {order.shipping_reference || 'Sin referencia adicional'}
                                            </div>
                                        </div>
                                        {order.shipping_reference && renderCopyBtn('addr_ref', order.shipping_reference, 'Referencia')}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FORMULARIO PEQUEÑO DEL PRECIO DEL DELIVERY */}
                    {!isPickup && (
                        <div className="copy-field-row" style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--foreground)' }}>
                                    Precio del Delivery
                                </div>
                                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Sumado en la cuenta como <strong>Delivery</strong>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: 'var(--input-bg)', border: '1px solid var(--foreground)', borderRadius: '8px', padding: '6px 14px', fontWeight: 800, fontSize: '0.96rem', color: 'var(--foreground)' }}>
                                    {formatMoney(order.shipping_amount)}
                                </div>
                                {renderCopyBtn('delivery_fee', formatMoney(order.shipping_amount), 'Precio del Delivery')}
                            </div>
                        </div>
                    )}

                    {/* NOTAS E HISTORIAL (DESPLEGABLE COMPACTO) */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '14px 18px' }}>
                        <div
                            onClick={() => setShowTimelineNotes(prev => !prev)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        >
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--foreground)' }}>
                                Historial del Pedido y Notas Internas ({events.length} eventos)
                            </span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                {showTimelineNotes ? 'Ocultar ▲' : 'Ver detalle ▼'}
                            </span>
                        </div>

                        {showTimelineNotes && (
                            <div style={{ marginTop: '14px', borderTop: '1px solid var(--glass-border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={newNoteContent}
                                        onChange={e => setNewNoteContent(e.target.value)}
                                        placeholder="Agregar una nota interna sobre este pedido..."
                                        style={{ flex: 1, padding: '9px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--foreground)', fontSize: '0.85rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddInternalNote}
                                        disabled={isPending}
                                        style={{ padding: '9px 14px', background: 'var(--foreground)', color: 'var(--card-bg)', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                                    >
                                        + Guardar Nota
                                    </button>
                                </div>

                                {notes.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {notes.map(n => (
                                            <div key={n.id} style={{ padding: '8px 12px', background: 'var(--input-bg)', borderRadius: '6px', fontSize: '0.83rem', color: 'var(--foreground)' }}>
                                                <strong>Nota:</strong> {n.content} <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>({formatDateStr(n.created_at)})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '2px solid var(--glass-border)', paddingLeft: '12px', marginLeft: '4px' }}>
                                    {events.map(evt => (
                                        <div key={evt.id} style={{ fontSize: '0.8rem', color: 'var(--foreground)' }}>
                                            <strong>{evt.description}</strong>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDateStr(evt.created_at)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── 30% RIGHT COLUMN — STICKY RESUMEN DEL PEDIDO (CORPORATE MONOCHROME) ─── */}
                <div className="admin-sticky-card" style={{ position: 'sticky', top: '24px' }}>
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '22px' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>RESUMEN DEL PEDIDO</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                {items.reduce((a, b) => a + b.quantity, 0)} productos
                            </span>
                        </h3>

                        {/* Estado actual visible dentro del Resumen */}
                        <div style={{
                            marginBottom: '14px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: stageInfo.bg,
                            border: `1px solid ${stageInfo.border}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                Estado del pedido
                            </span>
                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: stageInfo.color }}>
                                ● {stageInfo.label}
                            </span>
                        </div>

                        {/* Itemized List Summary */}
                        <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                            {items.map((item, idx) => (
                                <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', color: 'var(--foreground)', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                                        {(item.image || item.image_url) ? (
                                            <img
                                                src={item.image || item.image_url}
                                                alt={item.product_name}
                                                style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--glass-border)' }}
                                            />
                                        ) : (
                                            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                                                ITEM
                                            </div>
                                        )}
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <span style={{ fontWeight: 700 }}>{item.product_name}</span>
                                            {item.variant_name && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> ({item.variant_name})</span>}
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> × {item.quantity}</span>
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: 800, flexShrink: 0 }}>{formatMoney(item.total_amount)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Financial Totals */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                                <span>Subtotal</span>
                                <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{formatMoney(order.subtotal_amount)}</span>
                            </div>

                            {order.discount_amount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--foreground)', fontWeight: 600 }}>
                                    <span>Descuento</span>
                                    <span>-{formatMoney(order.discount_amount)}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                                <span>{isPickup ? 'Recojo en tienda' : 'Delivery'}</span>
                                <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{formatMoney(order.shipping_amount)}</span>
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--foreground)', fontWeight: 800, fontSize: '1.25rem',
                                borderTop: '1px solid var(--glass-border)', paddingTop: '10px', marginTop: '4px'
                            }}>
                                <span>TOTAL</span>
                                <span style={{ color: 'var(--foreground)' }}>{formatMoney(order.total_amount)}</span>
                            </div>
                        </div>

                        {/* ─── BOTÓN PRINCIPAL AL FINAL QUE GUÍA AL USUARIO CON EL COLOR DE LA TIENDA ─── */}
                        {currentStage === 'pending' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Link
                                    href={`/admin/pedidos/nuevo?edit=${order.id}`}
                                    title="Ir un paso atrás para modificar un dato"
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '8px',
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'var(--foreground)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.15rem',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        flexShrink: 0,
                                    }}
                                >
                                    ←
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleAcceptOrder}
                                    disabled={isPending}
                                    style={{
                                        flex: 1,
                                        height: '48px',
                                        background: 'var(--robotina-orange, #ff6b00)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#ffffff',
                                        fontWeight: 800,
                                        fontSize: '0.95rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {isPending ? 'Aceptando pedido...' : '✓ Aceptar pedido'}
                                </button>
                            </div>
                        )}

                        {currentStage === 'accepted' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectStageManual('pending')}
                                        disabled={isPending}
                                        title="Volver un paso atrás (a Pendiente)"
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '8px',
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--foreground)',
                                            fontSize: '1.15rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                        }}
                                    >
                                        ←
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleMoveToInRoute}
                                        disabled={isPending}
                                        style={{
                                            flex: 1,
                                            height: '48px',
                                            background: 'var(--robotina-orange, #ff6b00)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#ffffff',
                                            fontWeight: 800,
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {isPending ? 'Actualizando...' : 'Pasar a: En ruta →'}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsMessageDrawerOpen(true)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: 'var(--foreground)',
                                        fontWeight: 700,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Abrir mensaje de pedido aceptado
                                </button>
                            </div>
                        )}

                        {currentStage === 'in_route' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectStageManual('accepted')}
                                        disabled={isPending}
                                        title="Volver un paso atrás (a Aceptado)"
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '8px',
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--foreground)',
                                            fontSize: '1.15rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                        }}
                                    >
                                        ←
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleMoveToDelivered}
                                        disabled={isPending}
                                        style={{
                                            flex: 1,
                                            height: '48px',
                                            background: 'var(--robotina-orange, #ff6b00)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#ffffff',
                                            fontWeight: 800,
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {isPending ? 'Actualizando...' : 'Pasar a: Entregado →'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStage === 'delivered' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => handleSelectStageManual('in_route')}
                                    disabled={isPending}
                                    title="Volver un paso atrás (a En ruta)"
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '8px',
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'var(--foreground)',
                                        fontSize: '1.15rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                    }}
                                >
                                    ←
                                </button>
                                <div style={{
                                    flex: 1,
                                    padding: '13px',
                                    background: 'rgba(22, 163, 74, 0.12)',
                                    border: '1px solid rgba(22, 163, 74, 0.4)',
                                    borderRadius: '8px',
                                    color: '#16a34a',
                                    fontWeight: 800,
                                    fontSize: '0.92rem',
                                    textAlign: 'center',
                                }}>
                                    ✓ Pedido Entregado
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── VENTANA DESLIZABLE DE DERECHA A IZQUIERDA (SLIDE-OVER DRAWER) CON MENSAJE PRE-ESCRITO ─── */}
            {isMessageDrawerOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsMessageDrawerOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.45)',
                            backdropFilter: 'blur(3px)',
                            zIndex: 9998,
                            animation: 'fadeInBackdrop 0.2s ease forwards',
                        }}
                    />

                    {/* Right-to-Left Sliding Panel */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: '100%',
                            maxWidth: '460px',
                            background: 'var(--card-bg)',
                            borderLeft: '1px solid var(--glass-border)',
                            boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.24)',
                            zIndex: 9999,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '24px',
                            animation: 'slideInRightToLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        }}
                    >
                        <div style={{ overflowY: 'auto', paddingRight: '4px' }}>
                            {/* Drawer Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '14px' }}>
                                <div>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        background: 'var(--foreground)',
                                        color: 'var(--card-bg)',
                                        fontWeight: 800,
                                        fontSize: '0.72rem',
                                        letterSpacing: '0.04em',
                                        marginBottom: '8px',
                                    }}>
                                        PEDIDO ACEPTADO Y EN PROCESO
                                    </span>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>
                                        Mensaje para el Cliente
                                    </h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        Copia este mensaje pre-escrito o envíalo directo al WhatsApp de <strong>{order.customer_name}</strong>.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsMessageDrawerOpen(false)}
                                    title="Cerrar ventana"
                                    style={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--input-bg)',
                                        color: 'var(--foreground)',
                                        fontSize: '0.95rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Quick Recipient Info */}
                            <div className="copy-field-row" style={{
                                padding: '10px 14px',
                                borderRadius: '8px',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                marginBottom: '14px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>DESTINATARIO</div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--foreground)' }}>
                                        {order.customer_name} • {order.customer_phone || 'Sin teléfono'}
                                    </div>
                                </div>
                                {order.customer_phone && renderCopyBtn('drawer_phone', order.customer_phone, 'Teléfono', true)}
                            </div>

                            {/* Editable Pre-written Message Box */}
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.03em' }}>
                                MENSAJE PRE-ESCRITO (EDITABLE):
                            </label>
                            <textarea
                                rows={12}
                                value={prewrittenMessage}
                                onChange={e => setPrewrittenMessage(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'var(--input-bg)',
                                    color: 'var(--foreground)',
                                    fontSize: '0.88rem',
                                    lineHeight: 1.5,
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    outline: 'none',
                                }}
                            />
                        </div>

                        {/* Drawer Footer Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', marginTop: '16px' }}>
                            <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => copyValue('drawer_msg', prewrittenMessage, 'Mensaje de confirmación')}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--foreground)',
                                        background: copiedKey === 'drawer_msg' ? 'var(--foreground)' : 'var(--card-bg)',
                                        color: copiedKey === 'drawer_msg' ? 'var(--card-bg)' : 'var(--foreground)',
                                        fontWeight: 800,
                                        fontSize: '0.88rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {copiedKey === 'drawer_msg' ? '✓ Mensaje Copiado' : 'Copiar Mensaje'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSendWhatsAppMessage(prewrittenMessage)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--input-bg)',
                                        color: 'var(--foreground)',
                                        fontWeight: 800,
                                        fontSize: '0.88rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Enviar por WhatsApp
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsMessageDrawerOpen(false)}
                                style={{
                                    width: '100%',
                                    padding: '13px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--foreground)',
                                    background: 'var(--foreground)',
                                    color: 'var(--card-bg)',
                                    fontWeight: 800,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Cerrar mensaje y continuar con el pedido →
                            </button>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                @keyframes slideInRightToLeft {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                @keyframes fadeInBackdrop {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
