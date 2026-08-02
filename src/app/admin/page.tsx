'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/money';
import { getInstantProducts, CatalogProduct } from '@/modules/catalog/queries';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatCard from '@/components/admin/AdminStatCard';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

interface DBOrder {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    payment_status: string;
    fulfillment_status: string;
    total_amount: number;
    currency: string;
    created_at: string;
}

export default function AdminDashboard() {
    const [orders, setOrders] = useState<DBOrder[]>([]);
    const [products, setProducts] = useState<CatalogProduct[]>(() => getInstantProducts());
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrdersCount: 0,
        paidOrdersCount: 0,
        pendingOrdersCount: 0,
        activeProductsCount: 0,
        lowStockCount: 0,
        customersCount: 0,
        averageTicket: 0,
    });
    const [loading, setLoading] = useState(true);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            // 1. Local products & stock calculate
            const currentProds = getInstantProducts();
            setProducts(currentProds);
            const activeProds = currentProds.filter(p => (p.status || 'active') === 'active');
            const lowStockProds = currentProds.filter(p => (p.stock_quantity ?? 10) <= 5);

            // 2. Local orders or Supabase orders
            let localOrders: DBOrder[] = [];
            try {
                localOrders = JSON.parse(localStorage.getItem('admin_orders') || '[]');
            } catch {
                localOrders = [];
            }

            const { data: dbOrders } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            const { count: custCount } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true });

            const combinedOrders = [...localOrders, ...(dbOrders || [])].filter((ord, idx, self) =>
                idx === self.findIndex(o => o.id === ord.id || o.order_number === ord.order_number)
            );

            setOrders(combinedOrders);

            const paidOrders = combinedOrders.filter(o => o.payment_status === 'paid');
            const pendingOrders = combinedOrders.filter(o => o.payment_status === 'pending');
            const totalSales = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
            const avgTicket = paidOrders.length > 0 ? totalSales / paidOrders.length : 0;

            setStats({
                totalSales,
                totalOrdersCount: combinedOrders.length,
                paidOrdersCount: paidOrders.length,
                pendingOrdersCount: pendingOrders.length,
                activeProductsCount: activeProds.length,
                lowStockCount: lowStockProds.length,
                customersCount: custCount || 0,
                averageTicket: avgTicket,
            });
        } catch {
            // Safe fallback
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMetrics();
    }, []);

    const lowStockList = products.filter(p => (p.stock_quantity ?? 10) <= 5);

    const orderColumns = [
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
                    <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{order.customer_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{order.customer_email}</div>
                </div>
            ),
        },
        {
            header: 'Fecha',
            cell: (order: DBOrder) => new Date(order.created_at).toLocaleDateString('es-PE'),
        },
        {
            header: 'Total',
            cell: (order: DBOrder) => (
                <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                    {formatMoney(order.total_amount)}
                </span>
            ),
        },
        {
            header: 'Pago',
            cell: (order: DBOrder) => <AdminStatusBadge status={order.payment_status} />,
        },
        {
            header: 'Entrega',
            cell: (order: DBOrder) => <AdminStatusBadge status={order.fulfillment_status} />,
        },
        {
            header: 'Acción',
            cell: (order: DBOrder) => (
                <Link
                    href={`/admin/pedidos/${order.id}`}
                    style={{
                        padding: '6px 12px',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '6px',
                        color: 'var(--foreground)',
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        fontWeight: 600,
                    }}
                >
                    Gestionar
                </Link>
            ),
        },
    ];

    return (
        <div>
            <AdminPageHeader
                title="Resumen del Ecommerce"
                description="Métricas reales y rendimiento operativo de CodeMarket."
                action={
                    <Link
                        href="/admin/productos/nuevo"
                        style={{
                            padding: '10px 18px',
                            background: 'var(--gradient-main)',
                            color: 'white',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(255, 107, 0, 0.35)',
                        }}
                    >
                        <span>➕</span> Nuevo Producto
                    </Link>
                }
            />

            {/* Real Metrics Stat Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <AdminStatCard
                    title="Ventas Confirmadas"
                    value={formatMoney(stats.totalSales)}
                    icon="💵"
                    subtitle="Pagos completados"
                    accentColor="#22c55e"
                />
                <AdminStatCard
                    title="Pedidos Totales"
                    value={stats.totalOrdersCount}
                    icon="📦"
                    subtitle="Órdenes registradas"
                    accentColor="#3b82f6"
                />
                <AdminStatCard
                    title="Pedidos Pendientes"
                    value={stats.pendingOrdersCount}
                    icon="⏳"
                    subtitle="Por validar o despachar"
                    accentColor="#f59e0b"
                />
                <AdminStatCard
                    title="Ticket Promedio"
                    value={formatMoney(stats.averageTicket)}
                    icon="📊"
                    subtitle="Valor medio por venta"
                    accentColor="#8b5cf6"
                />
                <AdminStatCard
                    title="Productos Activos"
                    value={stats.activeProductsCount}
                    icon="🏷️"
                    subtitle="Visibles en tienda"
                    accentColor="#ff6b00"
                />
                <AdminStatCard
                    title="Stock Bajo"
                    value={stats.lowStockCount}
                    icon="⚠️"
                    subtitle="Unidades <= 5"
                    accentColor="#ef4444"
                />
                <AdminStatCard
                    title="Clientes Registrados"
                    value={stats.customersCount}
                    icon="👥"
                    subtitle="Base de clientes"
                    accentColor="#10b981"
                />
            </div>

            {/* Quick Actions Grid */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '16px' }}>Acciones Rápidas</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <Link href="/admin/productos/nuevo" style={{ padding: '14px 16px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '0.88rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>📦</span> Crear Producto
                    </Link>
                    <Link href="/admin/pedidos" style={{ padding: '14px 16px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '0.88rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>📋</span> Ver Pedidos
                    </Link>
                    <Link href="/admin/descuentos/nuevo" style={{ padding: '14px 16px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '0.88rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>🎟️</span> Crear Descuento
                    </Link>
                    <Link href="/admin/categorias" style={{ padding: '14px 16px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '0.88rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>🔖</span> Gestionar Categorías
                    </Link>
                    <Link href="/admin/configuracion/pagos" style={{ padding: '14px 16px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '0.88rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>💳</span> Configurar Pagos
                    </Link>
                    <Link href="/" target="_blank" style={{ padding: '14px 16px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '0.88rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>🛍️</span> Ver Tienda Pública ↗
                    </Link>
                </div>
            </div>

            {/* Low Stock Warning Section (Only real products with low stock) */}
            {lowStockList.length > 0 && (
                <div style={{ marginBottom: '32px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <h3 style={{ margin: 0, color: '#ef4444', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>⚠️</span> Productos con Bajo Stock ({lowStockList.length})
                        </h3>
                        <Link href="/admin/inventario" style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>Ir a control de inventario →</Link>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {lowStockList.map(prod => (
                            <div key={prod.id} style={{ padding: '10px 14px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>{prod.title}</span>
                                <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}>
                                    Quedan {prod.stock_quantity ?? 0} un.
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Orders Section */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>Pedidos Recientes</h2>
                    {orders.length > 0 && (
                        <Link href="/admin/pedidos" style={{ color: 'var(--robotina-orange)', fontSize: '0.88rem', fontWeight: 700, textDecoration: 'none' }}>
                            Ver todos los pedidos ({orders.length}) →
                        </Link>
                    )}
                </div>

                {orders.length === 0 && !loading ? (
                    <AdminEmptyState
                        title="Todavía no tienes pedidos"
                        description="Cuando un cliente realice una compra o registres una venta manual, aparecerá aquí."
                        action={
                            <Link href="/" target="_blank" style={{ padding: '10px 16px', background: 'var(--robotina-orange)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                                Probar Tienda Pública
                            </Link>
                        }
                    />
                ) : (
                    <AdminDataTable
                        columns={orderColumns}
                        data={orders.slice(0, 5)}
                        keyExtractor={o => o.id}
                        loading={loading}
                    />
                )}
            </div>
        </div>
    );
}
