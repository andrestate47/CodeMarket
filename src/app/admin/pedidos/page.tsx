'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import {
    getOrdersListAction,
    updateOrderStatusAction,
    bulkUpdateOrdersAction,
    exportOrdersToCSVAction,
    createQuickTestOrderAction,
    OrderFilterParams,
    OrderRecord
} from '@/modules/orders/actions';

export default function AdminOrdersPage() {
    const [isPending, startTransition] = useTransition();

    // Notification toast state
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = React.useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    }, []);

    // Filters state
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [orderStatus, setOrderStatus] = useState('all');
    const [paymentStatus, setPaymentStatus] = useState('all');
    const [fulfillmentStatus, setFulfillmentStatus] = useState('all');
    const [source, setSource] = useState('all');
    const [deliveryType, setDeliveryType] = useState('all');
    const [dateRange, setDateRange] = useState<'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month'>('all');
    const [paymentMethod, setPaymentMethod] = useState('all');

    // Data state (loaded once and filtered instantaneously on client)
    const [allOrders, setAllOrders] = useState<OrderRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection & Bulk State
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [activeKebabId, setActiveKebabId] = useState<string | null>(null);

    // Dialog state
    const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);

    // Sync debouncedSearch for CSV export compatibility
    useEffect(() => {
        setDebouncedSearch(searchQuery);
    }, [searchQuery]);

    // Load all orders once (or silently refresh)
    const fetchOrders = React.useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const res = await getOrdersListAction({ limit: 500 });
        if (res.success) {
            setAllOrders(res.orders || []);
        } else {
            showToast(`Error: ${res.error}`);
        }
        if (!silent) setLoading(false);
    }, [showToast]);

    useEffect(() => {
        fetchOrders(false);
    }, [fetchOrders]);

    useEffect(() => {
        const handleNewOrder = () => {
            fetchOrders(true);
        };
        window.addEventListener('admin:new-order', handleNewOrder);
        return () => window.removeEventListener('admin:new-order', handleNewOrder);
    }, [fetchOrders]);

    // Instant client-side metrics
    const metrics = React.useMemo(() => ({
        total: allOrders.length,
        new: allOrders.filter(o => o.order_status === 'new' || !o.order_status).length,
        pendingPayment: allOrders.filter(o => o.payment_status === 'pending' || o.payment_status === 'under_review').length,
        paid: allOrders.filter(o => o.payment_status === 'paid').length,
        preparing: allOrders.filter(o => o.fulfillment_status === 'preparing' || o.fulfillment_status === 'processing').length,
        shipped: allOrders.filter(o => o.fulfillment_status === 'shipped').length,
        delivered: allOrders.filter(o => o.fulfillment_status === 'delivered' || o.fulfillment_status === 'fulfilled').length,
    }), [allOrders]);

    // Instant client-side filtering (0ms lag on tabs, dropdowns, and search)
    const orders = React.useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
        const last7Days = new Date(startOfToday.getTime() - 7 * 86400000);
        const last30Days = new Date(startOfToday.getTime() - 30 * 86400000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const q = searchQuery.trim().toLowerCase();

        return allOrders.filter((o) => {
            if (orderStatus !== 'all' && o.order_status !== orderStatus) return false;
            if (paymentStatus !== 'all' && o.payment_status !== paymentStatus) return false;
            if (fulfillmentStatus !== 'all' && o.fulfillment_status !== fulfillmentStatus) return false;
            if (source !== 'all' && o.source !== source) return false;
            if (deliveryType !== 'all' && o.delivery_type !== deliveryType) return false;
            if (paymentMethod !== 'all' && o.payment_method !== paymentMethod) return false;

            if (dateRange !== 'all' && o.created_at) {
                const d = new Date(o.created_at);
                if (dateRange === 'today' && d < startOfToday) return false;
                if (dateRange === 'yesterday' && (d < startOfYesterday || d >= startOfToday)) return false;
                if (dateRange === 'last_7_days' && d < last7Days) return false;
                if (dateRange === 'last_30_days' && d < last30Days) return false;
                if (dateRange === 'this_month' && d < startOfMonth) return false;
            }

            if (q) {
                const match =
                    (o.order_number && o.order_number.toLowerCase().includes(q)) ||
                    (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
                    (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
                    (o.customer_phone && o.customer_phone.toLowerCase().includes(q));
                if (!match) return false;
            }
            return true;
        });
    }, [allOrders, orderStatus, paymentStatus, fulfillmentStatus, source, deliveryType, paymentMethod, dateRange, searchQuery]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setDebouncedSearch('');
        setOrderStatus('all');
        setPaymentStatus('all');
        setFulfillmentStatus('all');
        setSource('all');
        setDeliveryType('all');
        setDateRange('all');
        setPaymentMethod('all');
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedOrderIds(orders.map(o => o.id));
        } else {
            setSelectedOrderIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedOrderIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSingleStatusUpdate = async (orderId: string, updates: { orderStatus?: string; paymentStatus?: string; fulfillmentStatus?: string; reason?: string }) => {
        setActiveKebabId(null);
        // Optimistic UI update
        setAllOrders(prev => prev.map(o => o.id === orderId ? {
            ...o,
            ...(updates.orderStatus ? { order_status: updates.orderStatus } : {}),
            ...(updates.paymentStatus ? { payment_status: updates.paymentStatus } : {}),
            ...(updates.fulfillmentStatus ? { fulfillment_status: updates.fulfillmentStatus } : {}),
        } : o));
        startTransition(async () => {
            const res = await updateOrderStatusAction(orderId, updates);
            if (res.success) {
                showToast('Estado del pedido actualizado correctamente.');
                fetchOrders(true);
            } else {
                showToast(`Error: ${res.error}`);
                fetchOrders(true);
            }
        });
    };

    const handleBulkAction = async (action: 'confirm' | 'prepare' | 'ship') => {
        if (selectedOrderIds.length === 0) return;
        startTransition(async () => {
            const res = await bulkUpdateOrdersAction(selectedOrderIds, action);
            if (res.success) {
                showToast(`Acción masiva ejecutada en ${selectedOrderIds.length} pedidos.`);
                setSelectedOrderIds([]);
                fetchOrders(true);
            } else {
                showToast(`Error: ${res.error}`);
            }
        });
    };

    const handleExportCSV = async () => {
        startTransition(async () => {
            const res = await exportOrdersToCSVAction({
                searchQuery: debouncedSearch,
                orderStatus,
                paymentStatus,
                fulfillmentStatus,
                source,
                deliveryType,
                dateRange,
                paymentMethod,
            });

            if (res.success && res.csvContent) {
                const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `pedidos_codemarket_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast('Reporte CSV generado e iniciado descarga.');
            } else {
                showToast(`Error al exportar: ${res.error}`);
            }
        });
    };

    const handleContactWhatsApp = (order: OrderRecord) => {
        setActiveKebabId(null);
        const phone = order.customer_phone ? order.customer_phone.replace(/[^0-9]/g, '') : '';
        const message = encodeURIComponent(`Hola ${order.customer_name}, te contactamos por tu pedido ${order.order_number} en CodeMarket.`);
        if (phone) {
            window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
        } else {
            showToast('El cliente no tiene un teléfono registrado.');
        }
    };

    const handleCopyPaymentLink = (order: OrderRecord) => {
        setActiveKebabId(null);
        const link = `${window.location.origin}/pagar/${order.id.slice(0, 8)}`;
        navigator.clipboard.writeText(link);
        showToast(`Link de pago copiado: ${link}`);
    };

    const handleCreateTestOrder = async () => {
        startTransition(async () => {
            const res = await createQuickTestOrderAction();
            if (res.success && res.orderNumber) {
                showToast(`⚡ Pedido de prueba ${res.orderNumber} generado exitosamente.`);
                fetchOrders();
            } else {
                showToast(`Error al generar pedido de prueba: ${res.error}`);
            }
        });
    };

    return (
        <div>
            {/* Header & Metrics */}
            <AdminPageHeader
                title="Gestión de Pedidos"
                leftAction={
                    <Link
                        href="/admin/pedidos/nuevo"
                        style={{
                            padding: '8px 16px',
                            background: 'var(--robotina-orange, #ff6b00)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.86rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)',
                        }}
                    >
                        + Pedido manual
                    </Link>
                }
                action={
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                            onClick={handleExportCSV}
                            disabled={isPending}
                            title="Exportar CSV"
                            aria-label="Exportar CSV"
                            style={{
                                width: '38px',
                                height: '38px',
                                padding: 0,
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--foreground)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </button>
                    </div>
                }
            />

            {/* Notification Toast */}
            {toastMessage && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 9999,
                        background: 'var(--foreground)',
                        color: 'var(--card-bg)',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                    }}
                >
                    {toastMessage}
                </div>
            )}

            {/* METRIC CARDS FILTERS (CON COLORES COHERENTES POR ESTADO) */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: '10px',
                    marginBottom: '20px',
                }}
            >
                {[
                    {
                        label: 'TOTAL',
                        val: metrics.total,
                        color: '#ff6b00',
                        bg: 'rgba(255, 107, 0, 0.08)',
                        border: 'rgba(255, 107, 0, 0.3)',
                        active: orderStatus === 'all' && paymentStatus === 'all' && fulfillmentStatus === 'all',
                        onClick: () => { setOrderStatus('all'); setPaymentStatus('all'); setFulfillmentStatus('all'); }
                    },
                    {
                        label: 'PENDIENTES',
                        val: metrics.new,
                        color: '#d97706',
                        bg: 'rgba(245, 158, 11, 0.09)',
                        border: 'rgba(245, 158, 11, 0.32)',
                        active: orderStatus === 'new',
                        onClick: () => { setOrderStatus('new'); setPaymentStatus('all'); setFulfillmentStatus('all'); }
                    },
                    {
                        label: 'PAGO PENDIENTE',
                        val: metrics.pendingPayment,
                        color: '#ea580c',
                        bg: 'rgba(234, 88, 12, 0.09)',
                        border: 'rgba(234, 88, 12, 0.32)',
                        active: paymentStatus === 'pending',
                        onClick: () => { setPaymentStatus('pending'); setOrderStatus('all'); setFulfillmentStatus('all'); }
                    },
                    {
                        label: 'PAGADOS',
                        val: metrics.paid,
                        color: '#16a34a',
                        bg: 'rgba(22, 163, 74, 0.09)',
                        border: 'rgba(22, 163, 74, 0.32)',
                        active: paymentStatus === 'paid',
                        onClick: () => { setPaymentStatus('paid'); setOrderStatus('all'); setFulfillmentStatus('all'); }
                    },
                    {
                        label: 'EN PROCESO',
                        val: metrics.preparing,
                        color: '#16a34a',
                        bg: 'rgba(22, 163, 74, 0.09)',
                        border: 'rgba(22, 163, 74, 0.32)',
                        active: fulfillmentStatus === 'preparing',
                        onClick: () => { setFulfillmentStatus('preparing'); setOrderStatus('all'); setPaymentStatus('all'); }
                    },
                    {
                        label: 'EN RUTA',
                        val: metrics.shipped,
                        color: '#2563eb',
                        bg: 'rgba(37, 99, 235, 0.09)',
                        border: 'rgba(37, 99, 235, 0.32)',
                        active: fulfillmentStatus === 'shipped',
                        onClick: () => { setFulfillmentStatus('shipped'); setOrderStatus('all'); setPaymentStatus('all'); }
                    },
                    {
                        label: 'ENTREGADOS',
                        val: metrics.delivered,
                        color: '#15803d',
                        bg: 'rgba(21, 128, 61, 0.1)',
                        border: 'rgba(21, 128, 61, 0.35)',
                        active: fulfillmentStatus === 'delivered',
                        onClick: () => { setFulfillmentStatus('delivered'); setOrderStatus('all'); setPaymentStatus('all'); }
                    },
                ].map((m, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={m.onClick}
                        style={{
                            background: m.active ? m.bg : 'var(--card-bg)',
                            border: m.active ? `2px solid ${m.color}` : `1px solid ${m.border}`,
                            borderRadius: '10px',
                            padding: '14px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <span style={{ fontSize: '0.72rem', color: m.color, display: 'block', fontWeight: 800, letterSpacing: '0.03em' }}>
                            {m.label}
                        </span>
                        <span style={{ fontSize: '1.35rem', fontWeight: 800, color: m.color }}>
                            {m.val}
                        </span>
                    </button>
                ))}
            </div>

            {/* SEARCH & FILTERS BAR (SIMPLIFICADA SIN REDUNDANCIAS) */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search input with Debounce */}
                    <div style={{ position: 'relative', flex: '1 1 280px' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍</span>
                        <input
                            type="search"
                            name="q_search_orders"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar pedido..."
                            style={{
                                width: '100%',
                                padding: '9px 14px 9px 36px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--input-text)',
                                fontSize: '0.86rem',
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* Filter: Canal / Source */}
                    <select
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        style={{ flex: '1 1 140px', padding: '9px 12px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        <option value="all">Canal: Todos</option>
                        <option value="online_store">Tienda online</option>
                        <option value="manual">Manual</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="phone">Teléfono</option>
                        <option value="pos">Venta Presencial</option>
                        <option value="other">Otro</option>
                    </select>

                    {/* Filter: Fecha */}
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month')}
                        style={{ flex: '1 1 140px', padding: '9px 12px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        <option value="all">Fecha: Todas</option>
                        <option value="today">Hoy</option>
                        <option value="yesterday">Ayer</option>
                        <option value="last_7_days">Últimos 7 días</option>
                        <option value="last_30_days">Últimos 30 días</option>
                        <option value="this_month">Este mes</option>
                    </select>

                    {/* Clear Filters Button (solo aparece cuando hay algún filtro activo) */}
                    {(searchQuery || orderStatus !== 'all' || paymentStatus !== 'all' || fulfillmentStatus !== 'all' || source !== 'all' || dateRange !== 'all') && (
                        <button
                            onClick={handleClearFilters}
                            style={{
                                padding: '9px 12px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--foreground)',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            ✕ Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* BULK SELECTION ACTIONS BAR */}
            {selectedOrderIds.length > 0 && (
                <div
                    style={{
                        background: 'var(--card-bg)',
                        border: '1.5px solid var(--foreground)',
                        borderRadius: '10px',
                        padding: '12px 18px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                    }}
                >
                    <span style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.9rem' }}>
                        {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'pedido seleccionado' : 'pedidos seleccionados'}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => handleBulkAction('confirm')}
                            disabled={isPending}
                            style={{ padding: '6px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            ✓ Marcar Confirmados
                        </button>
                        <button
                            onClick={() => handleBulkAction('prepare')}
                            disabled={isPending}
                            style={{ padding: '6px 12px', background: '#d97706', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Marcar Preparando
                        </button>
                        <button
                            onClick={() => handleBulkAction('ship')}
                            disabled={isPending}
                            style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Marcar Enviados
                        </button>
                    </div>
                </div>
            )}

            {/* ORDERS TABLE */}
            {orders.length === 0 && !loading ? (
                <AdminEmptyState
                    title="No se encontraron pedidos"
                    description="Los pedidos realizados en la tienda o creados manualmente aparecerán aquí organizados por fecha."
                    action={
                        <Link
                            href="/admin/pedidos/nuevo"
                            style={{
                                padding: '10px 18px',
                                background: 'var(--foreground)',
                                color: 'var(--card-bg)',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                            }}
                        >
                            + Pedido manual
                        </Link>
                    }
                />
            ) : (
                <>
                    {/* VISTA TARJETAS MÓVIL (<= 768px) */}
                    <div className="admin-mobile-only" style={{ marginBottom: '20px' }}>
                        {loading ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                                Cargando pedidos...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        style={{
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '14px',
                                            padding: '14px 16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Link
                                                    href={`/admin/pedidos/${order.id}`}
                                                    style={{ color: 'var(--foreground)', fontWeight: 800, fontSize: '0.96rem', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                                                >
                                                    {order.order_number}
                                                </Link>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} · {new Date(order.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--robotina-orange, #ff6b00)' }}>
                                                {formatMoney(order.total_amount, order.currency)}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {order.customer_name}
                                                </div>
                                                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {order.customer_phone || order.customer_email || 'Sin contacto'}
                                                </div>
                                            </div>
                                            <AdminStatusBadge status={order.source || 'online_store'} />
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <AdminStatusBadge status={order.payment_status || 'pending'} />
                                                <AdminStatusBadge status={order.fulfillment_status || 'unfulfilled'} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {order.customer_phone && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleContactWhatsApp(order)}
                                                        style={{
                                                            padding: '6px 10px',
                                                            borderRadius: '8px',
                                                            background: 'rgba(37, 211, 102, 0.12)',
                                                            border: '1px solid rgba(37, 211, 102, 0.3)',
                                                            color: '#16a34a',
                                                            fontSize: '0.76rem',
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        WhatsApp
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/admin/pedidos/${order.id}`}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '8px',
                                                        background: 'var(--robotina-orange, #ff6b00)',
                                                        color: '#ffffff',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 700,
                                                        textDecoration: 'none',
                                                    }}
                                                >
                                                    Ver →
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* VISTA TABLA ESCRITORIO (> 768px) */}
                    <div className="admin-desktop-only" style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '14px', width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedOrderIds.length > 0 && selectedOrderIds.length === orders.length}
                                            onChange={handleSelectAll}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </th>
                                    <th style={{ padding: '14px' }}>Pedido</th>
                                    <th style={{ padding: '14px' }}>Fecha</th>
                                    <th style={{ padding: '14px' }}>Cliente</th>
                                    <th style={{ padding: '14px' }}>Canal</th>
                                    <th style={{ padding: '14px' }}>Total</th>
                                    <th style={{ padding: '14px' }}>Pago</th>
                                    <th style={{ padding: '14px' }}>Preparación/Envío</th>
                                    <th style={{ padding: '14px' }}>Estado</th>
                                    <th style={{ padding: '14px', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            Cargando pedidos...
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => {
                                        const isChecked = selectedOrderIds.includes(order.id);
                                        const isMenuOpen = activeKebabId === order.id;

                                        return (
                                            <tr
                                                key={order.id}
                                                style={{
                                                    borderBottom: '1px solid var(--glass-border)',
                                                    background: isChecked ? 'var(--input-bg)' : 'transparent',
                                                }}
                                            >
                                                <td style={{ padding: '14px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => handleSelectOne(order.id)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </td>

                                                {/* Pedido Number */}
                                                <td style={{ padding: '14px' }}>
                                                    <Link
                                                        href={`/admin/pedidos/${order.id}`}
                                                        style={{ color: 'var(--foreground)', fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: '3px' }}
                                                    >
                                                        {order.order_number}
                                                    </Link>
                                                </td>

                                                {/* Fecha */}
                                                <td style={{ padding: '14px', color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                                    {new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    <br />
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {new Date(order.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>

                                                {/* Cliente */}
                                                <td style={{ padding: '14px' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{order.customer_name}</div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{order.customer_email}</div>
                                                    {order.customer_phone && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer_phone}</div>
                                                    )}
                                                </td>

                                                {/* Canal */}
                                                <td style={{ padding: '14px' }}>
                                                    <AdminStatusBadge status={order.source || 'online_store'} />
                                                    {order.source_reference && (
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                            {order.source_reference}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Total */}
                                                <td style={{ padding: '14px' }}>
                                                    <div style={{ fontWeight: 800, color: 'var(--foreground)' }}>
                                                        {formatMoney(order.total_amount, order.currency)}
                                                    </div>
                                                </td>

                                                {/* Pago Status */}
                                                <td style={{ padding: '14px' }}>
                                                    <AdminStatusBadge status={order.payment_status || 'pending'} />
                                                </td>

                                                {/* Fulfillment Status */}
                                                <td style={{ padding: '14px' }}>
                                                    <AdminStatusBadge status={order.fulfillment_status || 'unfulfilled'} />
                                                </td>

                                                {/* Order Status */}
                                                <td style={{ padding: '14px' }}>
                                                    <AdminStatusBadge status={order.order_status || 'new'} />
                                                </td>

                                                {/* Quick Actions Kebab Menu */}
                                                <td style={{ padding: '14px', textAlign: 'right', position: 'relative' }}>
                                                    <button
                                                        onClick={() => setActiveKebabId(isMenuOpen ? null : order.id)}
                                                        style={{
                                                            background: 'rgba(255, 255, 255, 0.06)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            color: 'white',
                                                            borderRadius: '6px',
                                                            width: '32px',
                                                            height: '32px',
                                                            cursor: 'pointer',
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        ⋮
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {isMenuOpen && (
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                right: '14px',
                                                                top: '44px',
                                                                zIndex: 100,
                                                                background: '#18181b',
                                                                border: '1px solid var(--glass-border)',
                                                                borderRadius: '10px',
                                                                boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                                                                padding: '6px 0',
                                                                minWidth: '180px',
                                                                textAlign: 'left',
                                                            }}
                                                        >
                                                            <Link
                                                                href={`/admin/pedidos/${order.id}`}
                                                                style={{ display: 'block', padding: '8px 14px', color: 'white', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}
                                                            >
                                                                👁️ Ver pedido
                                                            </Link>

                                                            {order.payment_status !== 'paid' && (
                                                                <button
                                                                    onClick={() => handleSingleStatusUpdate(order.id, { paymentStatus: 'paid' })}
                                                                    style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#4ade80', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                                                                >
                                                                    ✓ Marcar como pagado
                                                                </button>
                                                            )}

                                                            {order.order_status !== 'confirmed' && order.order_status !== 'completed' && order.order_status !== 'cancelled' && (
                                                                <button
                                                                    onClick={() => handleSingleStatusUpdate(order.id, { orderStatus: 'confirmed' })}
                                                                    style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#34d399', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                                                                >
                                                                    👍 Confirmar pedido
                                                                </button>
                                                            )}

                                                            {order.fulfillment_status !== 'preparing' && order.fulfillment_status !== 'delivered' && order.order_status !== 'cancelled' && (
                                                                <button
                                                                    onClick={() => handleSingleStatusUpdate(order.id, { fulfillmentStatus: 'preparing' })}
                                                                    style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#fbbf24', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                                                                >
                                                                    📦 Preparar pedido
                                                                </button>
                                                            )}

                                                            {order.fulfillment_status !== 'shipped' && order.fulfillment_status !== 'delivered' && order.order_status !== 'cancelled' && (
                                                                <button
                                                                    onClick={() => handleSingleStatusUpdate(order.id, { fulfillmentStatus: 'shipped' })}
                                                                    style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#60a5fa', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                                                                >
                                                                    🚚 Marcar como enviado
                                                                </button>
                                                            )}

                                                            {order.fulfillment_status !== 'delivered' && order.order_status !== 'cancelled' && (
                                                                <button
                                                                    onClick={() => handleSingleStatusUpdate(order.id, { fulfillmentStatus: 'delivered', orderStatus: 'completed' })}
                                                                    style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#4ade80', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                                                                >
                                                                    🏁 Marcar como entregado
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => handleCopyPaymentLink(order)}
                                                                style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#38bdf8', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                                                            >
                                                                🔗 Copiar link de pago
                                                            </button>

                                                            <button
                                                                onClick={() => handleContactWhatsApp(order)}
                                                                style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#86efac', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                                                            >
                                                                💬 Contactar por WhatsApp
                                                            </button>

                                                            <Link
                                                                href={`/admin/pedidos/${order.id}/imprimir`}
                                                                target="_blank"
                                                                style={{ display: 'block', padding: '8px 14px', color: '#e4e4e7', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}
                                                            >
                                                                🖨️ Imprimir pedido
                                                            </Link>

                                                            {order.order_status !== 'cancelled' && (
                                                                <button
                                                                    onClick={() => { setActiveKebabId(null); setCancelModalOrderId(order.id); }}
                                                                    style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#f87171', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.08)' }}
                                                                >
                                                                    ❌ Cancelar pedido
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                </>
            )}

            {/* Cancel Modal Confirmation */}
            {cancelModalOrderId && (
                <ConfirmDialog
                    isOpen={!!cancelModalOrderId}
                    title="¿Cancelar este pedido?"
                    message="El pedido pasará a estado cancelado y los productos retornarán al inventario disponible de forma segura."
                    confirmText="Sí, cancelar pedido"
                    danger={true}
                    onConfirm={() => {
                        const id = cancelModalOrderId;
                        setCancelModalOrderId(null);
                        if (id) handleSingleStatusUpdate(id, { orderStatus: 'cancelled' });
                    }}
                    onCancel={() => setCancelModalOrderId(null)}
                />
            )}
        </div>
    );
}
