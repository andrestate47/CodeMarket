'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/money';
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

interface DBProduct {
    id: string;
    title: string;
    price: number;
    stock: number;
    status: string;
}

export default function AdminDashboard() {
    const [orders, setOrders] = useState<DBOrder[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<DBProduct[]>([]);
    const [stats, setStats] = useState({
        totalSales: 0,
        paidOrdersCount: 0,
        pendingOrdersCount: 0,
        activeProductsCount: 0,
        customersCount: 0,
    });
    const [loading, setLoading] = useState(true);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            const { data: dbOrders } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            const { count: prodCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            const { count: custCount } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true });

            const { data: dbLowStock } = await supabase
                .from('products')
                .select('id, title, price, stock, status')
                .lte('stock', 5)
                .order('stock', { ascending: true })
                .limit(5);

            const orderList = dbOrders || [];
            setOrders(orderList);
            setLowStockProducts(dbLowStock || []);

            const paidOrders = orderList.filter(o => o.payment_status === 'paid');
            const pendingOrders = orderList.filter(o => o.payment_status === 'pending');
            const totalSales = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

            setStats({
                totalSales,
                paidOrdersCount: paidOrders.length,
                pendingOrdersCount: pendingOrders.length,
                activeProductsCount: prodCount || 0,
                customersCount: custCount || 0,
            });
        } catch {
            // Keep default state
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMetrics();
    }, []);

    const orderColumns = [
        {
            header: 'Nº Pedido',
            cell: (order: DBOrder) => (
                <Link href={`/admin/pedidos/${order.id}`} style={{ color: '#c084fc', fontWeight: 700, textDecoration: 'none' }}>
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
                <span style={{ fontWeight: 700, color: 'white' }}>
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
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: 'white',
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
                description="Métricas y actividad en tiempo real de CodeMarket."
                action={
                    <Link
                        href="/admin/productos/nuevo"
                        style={{
                            padding: '10px 18px',
                            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                            color: 'white',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                        }}
                    >
                        <span>➕</span> Nuevo Producto
                    </Link>
                }
            />

            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <AdminStatCard
                    title="Ventas Confirmadas"
                    value={formatMoney(stats.totalSales)}
                    icon="💵"
                    subtitle="Órdenes con pago verificado"
                    accentColor="#4ade80"
                />
                <AdminStatCard
                    title="Pedidos Pendientes"
                    value={stats.pendingOrdersCount}
                    icon="⏳"
                    subtitle="Por validar o despachar"
                    accentColor="#facc15"
                />
                <AdminStatCard
                    title="Pedidos Pagados"
                    value={stats.paidOrdersCount}
                    icon="✅"
                    subtitle="Listos para entrega"
                    accentColor="#60a5fa"
                />
                <AdminStatCard
                    title="Productos Activos"
                    value={stats.activeProductsCount}
                    icon="📦"
                    subtitle="En catálogo visible"
                    accentColor="#c084fc"
                />
                <AdminStatCard
                    title="Clientes Registrados"
                    value={stats.customersCount}
                    icon="👥"
                    subtitle="Base de compradores"
                    accentColor="#f472b6"
                />
            </div>

            {/* Quick Actions Grid */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '16px' }}>Acciones Rápidas</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <Link href="/admin/productos/nuevo" style={{ padding: '16px', background: '#0e0e14', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '0.9rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>📦</span> Crear Producto
                    </Link>
                    <Link href="/admin/pedidos" style={{ padding: '16px', background: '#0e0e14', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '0.9rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>💰</span> Ver Pedidos
                    </Link>
                    <Link href="/admin/categorias" style={{ padding: '16px', background: '#0e0e14', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '0.9rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>🏷️</span> Crear Categoría
                    </Link>
                    <Link href="/admin/configuracion/pagos" style={{ padding: '16px', background: '#0e0e14', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '0.9rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>💳</span> Métodos de Pago
                    </Link>
                </div>
            </div>

            {/* Low Stock Warning Section (Only if products with low stock exist) */}
            {lowStockProducts.length > 0 && (
                <div style={{ marginBottom: '32px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <h3 style={{ margin: 0, color: '#f87171', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>⚠️</span> Productos con Bajo Stock ({lowStockProducts.length})
                        </h3>
                        <Link href="/admin/inventario" style={{ color: '#f87171', fontSize: '0.82rem', fontWeight: 600 }}>Ver todo en inventario →</Link>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {lowStockProducts.map(prod => (
                            <div key={prod.id} style={{ padding: '10px 14px', background: '#0e0e14', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: 'white', fontWeight: 600 }}>{prod.title}</span>
                                <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                                    Quedan {prod.stock}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Orders Section */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Pedidos Recientes</h2>
                    {orders.length > 0 && (
                        <Link href="/admin/pedidos" style={{ color: '#c084fc', fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none' }}>
                            Ver todos los pedidos ({orders.length}) →
                        </Link>
                    )}
                </div>

                {orders.length === 0 && !loading ? (
                    <AdminEmptyState
                        title="Todavía no tienes pedidos"
                        description="Cuando un cliente complete una compra en la tienda, su pedido aparecerá aquí en tiempo real."
                        action={
                            <Link href="/" target="_blank" style={{ padding: '10px 16px', background: 'rgba(255, 255, 255, 0.08)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
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
