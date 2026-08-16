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

    // Data state
    const [orders, setOrders] = useState<OrderRecord[]>([]);
    const [metrics, setMetrics] = useState({
        total: 0,
        new: 0,
        pendingPayment: 0,
        paid: 0,
        preparing: 0,
        shipped: 0,
        delivered: 0,
    });
    const [loading, setLoading] = useState(true);

    // Selection & Bulk State
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [activeKebabId, setActiveKebabId] = useState<string | null>(null);

    // Dialog state
    const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);

    // Debounce search input (300ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Load orders
    const fetchOrders = React.useCallback(async () => {
        setLoading(true);
        const filterParams: OrderFilterParams = {
            searchQuery: debouncedSearch,
            orderStatus,
            paymentStatus,
            fulfillmentStatus,
            source,
            deliveryType,
            dateRange,
            paymentMethod,
        };

        const res = await getOrdersListAction(filterParams);
        if (res.success) {
            setOrders(res.orders || []);
            setMetrics(res.metrics || { total: 0, new: 0, pendingPayment: 0, paid: 0, preparing: 0, shipped: 0, delivered: 0 });
        } else {
            showToast(`Error: ${res.error}`);
        }
        setLoading(false);
    }, [debouncedSearch, orderStatus, paymentStatus, fulfillmentStatus, source, deliveryType, dateRange, paymentMethod, showToast]);

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
        startTransition(async () => {
            const res = await updateOrderStatusAction(orderId, updates);
            if (res.success) {
                showToast('Estado del pedido actualizado correctamente.');
                fetchOrders();
            } else {
                showToast(`Error: ${res.error}`);
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
                fetchOrders();
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

    return (
        <div>
            {/* Header & Metrics */}
            <AdminPageHeader
                title="Gestión de Pedidos"
                action={
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Link
                            href="/admin/pedidos/nuevo"
                            style={{
                                padding: '8px 16px',
                                background: 'var(--gradient-main)',
                                color: 'white',
                                borderRadius: '10px',
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            + Pedido manual
                        </Link>
                        <button
                            onClick={handleExportCSV}
                            disabled={isPending}
                            style={{
                                padding: '8px 14px',
                                background: 'var(--input-bg)',
                                border: '1.5px solid var(--glass-border)',
                                color: 'var(--foreground)',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            📥 Exportar CSV
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
                        background: '#18181b',
                        color: '#f4f4f5',
                        padding: '12px 20px',
                        borderRadius: '10px',
                        border: '1px solid var(--robotina-orange)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                    }}
                >
                    💬 {toastMessage}
                </div>
            )}

            {/* METRIC CARDS FILTERS */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '12px',
                    marginBottom: '24px',
                }}
            >
                {/* TOTAL */}
                <button
                    type="button"
                    onClick={() => {
                        setOrderStatus('all');
                        setPaymentStatus('all');
                        setFulfillmentStatus('all');
                    }}
                    style={{
                        background: (orderStatus === 'all' && paymentStatus === 'all' && fulfillmentStatus === 'all') ? 'rgba(255, 107, 0, 0.12)' : 'var(--card-bg)',
                        border: (orderStatus === 'all' && paymentStatus === 'all' && fulfillmentStatus === 'all') ? '2px solid var(--robotina-orange)' : '1.5px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '14px',
                        textAlign: 'center',
                        boxShadow: (orderStatus === 'all' && paymentStatus === 'all' && fulfillmentStatus === 'all') ? '0 4px 14px rgba(255, 107, 0, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: (orderStatus === 'all' && paymentStatus === 'all' && fulfillmentStatus === 'all') ? 'translateY(-2px)' : 'none',
                    }}
                >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>TOTAL</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)' }}>{metrics.total}</span>
                </button>

                {/* NUEVOS */}
                <button
                    type="button"
                    onClick={() => {
                        setOrderStatus('new');
                        setPaymentStatus('all');
                        setFulfillmentStatus('all');
                    }}
                    style={{
                        background: orderStatus === 'new' ? 'rgba(37, 99, 235, 0.15)' : 'var(--card-bg)',
                        border: orderStatus === 'new' ? '2px solid #2563eb' : '1.5px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '14px',
                        textAlign: 'center',
                        boxShadow: orderStatus === 'new' ? '0 4px 14px rgba(37, 99, 235, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: orderStatus === 'new' ? 'translateY(-2px)' : 'none',
                    }}
                >
                    <span style={{ fontSize: '0.75rem', color: '#2563eb', display: 'block', fontWeight: 700 }}>NUEVOS</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb' }}>{metrics.new}</span>
                </button>

                {/* PENDIENTES PAGO */}
                <button
                    type="button"
                    onClick={() => {
                        setPaymentStatus('pending');
                        setOrderStatus('all');
                        setFulfillmentStatus('all');
                    }}
                    style={{
                        background: paymentStatus === 'pending' ? 'rgba(217, 119, 6, 0.15)' : 'var(--card-bg)',
                        border: paymentStatus === 'pending' ? '2px solid #d97706' : '1.5px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '14px',
                        textAlign: 'center',
                        boxShadow: paymentStatus === 'pending' ? '0 4px 14px rgba(217, 119, 6, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: paymentStatus === 'pending' ? 'translateY(-2px)' : 'none',
                    }}
                >
                    <span style={{ fontSize: '0.75rem', color: '#d97706', display: 'block', fontWeight: 700 }}>PENDIENTES PAGO</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706' }}>{metrics.pendingPayment}</span>
                </button>

                {/* PAGADOS */}
                <button
                    type="button"
                    onClick={() => {
                        setPaymentStatus('paid');
                        setOrderStatus('all');
                        setFulfillmentStatus('all');
                    }}
                    style={{
                        background: paymentStatus === 'paid' ? 'rgba(22, 163, 74, 0.15)' : 'var(--card-bg)',
                        border: paymentStatus === 'paid' ? '2px solid #16a34a' : '1.5px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '14px',
                        textAlign: 'center',
                        boxShadow: paymentStatus === 'paid' ? '0 4px 14px rgba(22, 163, 74, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: paymentStatus === 'paid' ? 'translateY(-2px)' : 'none',
                    }}
                >
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', fontWeight: 700 }}>PAGADOS</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>{metrics.paid}</span>
                </button>

                {/* PREPARANDO */}
                <button
                    type="button"
                    onClick={() => {
                        setFulfillmentStatus('preparing');
                        setOrderStatus('all');
                        setPaymentStatus('all');
                    }}
                    style={{
                        background: fulfillmentStatus === 'preparing' ? 'rgba(180, 83, 9, 0.15)' : 'var(--card-bg)',
                        border: fulfillmentStatus === 'preparing' ? '2px solid #b45309' : '1.5px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '14px',
                        textAlign: 'center',
                        boxShadow: fulfillmentStatus === 'preparing' ? '0 4px 14px rgba(180, 83, 9, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: fulfillmentStatus === 'preparing' ? 'translateY(-2px)' : 'none',
                    }}
                >
                    <span style={{ fontSize: '0.75rem', color: '#b45309', display: 'block', fontWeight: 700 }}>PREPARANDO</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>{metrics.preparing}</span>
                </button>

                {/* ENVIADOS */}
                <button
                    type="button"
                    onClick={() => {
                        setFulfillmentStatus('shipped');
                        setOrderStatus('all');
                        setPaymentStatus('all');
                    }}
                    style={{
                        background: fulfillmentStatus === 'shipped' ? 'rgba(2, 132, 199, 0.15)' : 'var(--card-bg)',
                        border: fulfillmentStatus === 'shipped' ? '2px solid #0284c7' : '1.5px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '14px',
                        textAlign: 'center',
                        boxShadow: fulfillmentStatus === 'shipped' ? '0 4px 14px rgba(2, 132, 199, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: fulfillmentStatus === 'shipped' ? 'translateY(-2px)' : 'none',
                    }}
                >
                    <span style={{ fontSize: '0.75rem', color: '#0284c7', display: 'block', fontWeight: 700 }}>ENVIADOS</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7' }}>{metrics.shipped}</span>
                </button>

                {/* ENTREGADOS */}
                <button
                    type="button"
                    onClick={() => {
                        setFulfillmentStatus('delivered');
                        setOrderStatus('all');
                        setPaymentStatus('all');
                    }}
                    style={{
                        background: fulfillmentStatus === 'delivered' ? 'rgba(5, 150, 105, 0.15)' : 'var(--card-bg)',
                        border: fulfillmentStatus === 'delivered' ? '2px solid #059669' : '1.5px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '14px',
                        textAlign: 'center',
                        boxShadow: fulfillmentStatus === 'delivered' ? '0 4px 14px rgba(5, 150, 105, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <span style={{ fontSize: '0.75rem', color: '#059669', display: 'block', fontWeight: 700 }}>ENTREGADOS</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{metrics.delivered}</span>
                </button>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '14px', padding: '18px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {/* Search input with Debounce */}
                    <div style={{ position: 'relative', flex: '2 1 240px' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por Nº pedido, cliente, correo, teléfono, doc..."
                            style={{
                                width: '100%',
                                padding: '10px 14px 10px 36px',
                                background: 'var(--input-bg)',
                                border: '1.5px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--input-text)',
                                fontSize: '0.88rem',
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* Filter: Estado de Pedido */}
                    <select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value)}
                        style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.85rem' }}
                    >
                        <option value="all">Estado Pedido: Todos</option>
                        <option value="new">Nuevo</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="processing">Preparando</option>
                        <option value="ready">Listo para enviar</option>
                        <option value="completed">Entregado / Completado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>

                    {/* Filter: Estado de Pago */}
                    <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.85rem' }}
                    >
                        <option value="all">Pago: Todos</option>
                        <option value="pending">Pendiente</option>
                        <option value="under_review">En revisión</option>
                        <option value="paid">Pagado</option>
                        <option value="partial">Pago parcial</option>
                        <option value="failed">Fallido</option>
                        <option value="refunded">Reembolsado</option>
                    </select>

                    {/* Filter: Canal / Source */}
                    <select
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.85rem' }}
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

                    {/* Filter: Envío */}
                    <select
                        value={fulfillmentStatus}
                        onChange={(e) => setFulfillmentStatus(e.target.value)}
                        style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.85rem' }}
                    >
                        <option value="all">Envío: Todos</option>
                        <option value="unfulfilled">Pendiente / Sin enviar</option>
                        <option value="preparing">Preparando</option>
                        <option value="ready">Listo</option>
                        <option value="shipped">En tránsito</option>
                        <option value="delivered">Entregado</option>
                        <option value="exception">Incidencia</option>
                    </select>

                    {/* Filter: Fecha */}
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month')}
                        style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.85rem' }}
                    >
                        <option value="all">Fecha: Todas</option>
                        <option value="today">Hoy</option>
                        <option value="yesterday">Ayer</option>
                        <option value="last_7_days">Últimos 7 días</option>
                        <option value="last_30_days">Últimos 30 días</option>
                        <option value="this_month">Este mes</option>
                    </select>

                    {/* Clear Filters Button */}
                    <button
                        onClick={handleClearFilters}
                        style={{
                            padding: '10px 14px',
                            background: 'var(--input-bg)',
                            border: '1.5px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Limpiar filtros
                    </button>
                </div>
            </div>

            {/* BULK SELECTION ACTIONS BAR */}
            {selectedOrderIds.length > 0 && (
                <div
                    style={{
                        background: 'rgba(249, 115, 22, 0.12)',
                        border: '1px solid rgba(249, 115, 22, 0.4)',
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
                    <span style={{ fontWeight: 700, color: '#f97316', fontSize: '0.9rem' }}>
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
                            📦 Marcar Preparando
                        </button>
                        <button
                            onClick={() => handleBulkAction('ship')}
                            disabled={isPending}
                            style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            🚚 Marcar Enviados
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
                                background: 'var(--gradient-main)',
                                color: 'white',
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
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)' }}>
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
                                        <td colSpan={10} style={{ padding: '36px', textAlign: 'center', color: '#a1a1aa' }}>
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
                                                    background: isChecked ? 'rgba(249, 115, 22, 0.05)' : 'transparent',
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
                                                        style={{ color: 'var(--robotina-orange)', fontWeight: 800, textDecoration: 'none' }}
                                                    >
                                                        {order.order_number}
                                                    </Link>
                                                </td>

                                                {/* Fecha */}
                                                <td style={{ padding: '14px', color: '#a1a1aa', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                                    {new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    <br />
                                                    <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
                                                        {new Date(order.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>

                                                {/* Cliente */}
                                                <td style={{ padding: '14px' }}>
                                                    <div style={{ fontWeight: 600, color: 'white' }}>{order.customer_name}</div>
                                                    <div style={{ fontSize: '0.78rem', color: '#71717a' }}>{order.customer_email}</div>
                                                    {order.customer_phone && (
                                                        <div style={{ fontSize: '0.75rem', color: '#52525b' }}>📱 {order.customer_phone}</div>
                                                    )}
                                                </td>

                                                {/* Canal */}
                                                <td style={{ padding: '14px' }}>
                                                    <AdminStatusBadge status={order.source || 'online_store'} />
                                                    {order.source_reference && (
                                                        <div style={{ fontSize: '0.72rem', color: '#a1a1aa', marginTop: '2px' }}>
                                                            {order.source_reference}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Total */}
                                                <td style={{ padding: '14px' }}>
                                                    <div style={{ fontWeight: 800, color: 'white' }}>
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
