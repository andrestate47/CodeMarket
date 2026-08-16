'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatCard from '@/components/admin/AdminStatCard';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import SalesPerformance from '@/components/admin/analytics/SalesPerformance';
import { getDashboardMetrics, DashboardMetrics } from '@/lib/services/dashboardService';
import { PresetPeriod, MetricType, getLimaDateKey } from '@/components/admin/analytics/salesAnalyticsUtils';

export default function AdminDashboard() {
    // Filter Controls State (Global Single Source of Truth Control)
    const [preset, setPreset] = useState<PresetPeriod>('30d');
    const [metric, setMetric] = useState<MetricType>('sales');

    const todayStr = useMemo(() => getLimaDateKey(new Date()), []);
    const [customStart, setCustomStart] = useState<string>(todayStr);
    const [customEnd, setCustomEnd] = useState<string>(todayStr);

    // Dashboard Data State
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Single Fetch Function calling dashboardService
    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getDashboardMetrics(preset, customStart, customEnd);
            setMetrics(data);
        } catch {
            setError('No pudimos cargar los datos de ventas del servidor.');
        } finally {
            setLoading(false);
        }
    }, [preset, customStart, customEnd]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    return (
        <div style={{ paddingBottom: '60px' }}>
            {/* Page Header */}
            <AdminPageHeader
                title="Resumen"
                description="Métricas reales y rendimiento operativo de CodeMarket."
                action={
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {metrics?.isDemoData && (
                            <span style={{
                                fontSize: '0.75rem',
                                background: 'rgba(255, 107, 0, 0.15)',
                                color: 'var(--robotina-orange)',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 107, 0, 0.3)',
                                fontWeight: 700,
                            }}>
                                🛠️ Modo Demo (Desarrollo)
                            </span>
                        )}
                        <Link
                            href="/admin/pedidos/nuevo"
                            style={{
                                padding: '9px 16px',
                                background: 'var(--gradient-main)',
                                color: '#FFFFFF',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                boxShadow: '0 4px 14px rgba(255, 107, 0, 0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            ➕ Crear Pedido Manual
                        </Link>
                        <Link
                            href="/admin/productos/nuevo"
                            style={{
                                padding: '9px 16px',
                                background: 'var(--input-bg)',
                                border: '1.5px solid var(--glass-border)',
                                color: 'var(--foreground)',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            📦 Crear Producto
                        </Link>
                        <Link
                            href="/admin/reportes"
                            style={{
                                padding: '9px 16px',
                                background: 'var(--input-bg)',
                                border: '1.5px solid var(--glass-border)',
                                color: 'var(--foreground)',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            📊 Ver Reportes
                        </Link>
                    </div>
                }
            />

            {/* Row 1: Top Consolidated KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
            }}>
                <AdminStatCard
                    title="Ventas"
                    value={metrics ? formatMoney(metrics.paidSales) : 'S/ 0.00'}
                    icon="💵"
                    subtitle={metrics ? `${metrics.paidOrdersCount} pedidos pagados (${metrics.paidSalesTrend.trendLabel})` : 'Cargando...'}
                    accentColor="#22c55e"
                />
                <AdminStatCard
                    title="Pedidos"
                    value={metrics ? metrics.createdOrdersCount.toString() : '0'}
                    icon="📦"
                    subtitle={metrics ? `${metrics.diffCreatedOrders >= 0 ? '+' : ''}${metrics.diffCreatedOrders} pedidos vs anterior (${metrics.createdOrdersTrend.trendLabel})` : 'Cargando...'}
                    accentColor="#3b82f6"
                />
                <AdminStatCard
                    title="Ticket Promedio"
                    value={metrics ? formatMoney(metrics.averageTicket) : 'S/ 0.00'}
                    icon="📊"
                    subtitle="Valor promedio por pedido pagado"
                    accentColor="#ff6b00"
                />
                <AdminStatCard
                    title="Tasa de Pago"
                    value={metrics ? (metrics.createdOrdersCount > 0 ? `${Math.round(metrics.paymentRate)}%` : '—') : '—'}
                    icon="🎯"
                    subtitle={metrics ? (metrics.createdOrdersCount > 0 ? `${metrics.paidOrdersCount} de ${metrics.createdOrdersCount} pagados` : '0 pedidos') : 'Cargando...'}
                    accentColor="#8b5cf6"
                />
                <AdminStatCard
                    title="Stock Bajo"
                    value={metrics ? metrics.lowStockCount.toString() : '0'}
                    icon="⚠️"
                    subtitle="Productos/variantes bajo el mínimo"
                    accentColor="#ef4444"
                />
            </div>

            {/* Row 2: Sales Performance Section (Dynamic Bar Chart & Selector Controls) */}
            <SalesPerformance
                metrics={metrics}
                loading={loading}
                error={error}
                preset={preset}
                onPresetChange={setPreset}
                metric={metric}
                onMetricChange={setMetric}
                customStart={customStart}
                customEnd={customEnd}
                onCustomStartChange={setCustomStart}
                onCustomEndChange={setCustomEnd}
                onRetry={loadDashboardData}
            />

            {/* Row 3: Real Breakdown Panels (Métodos de Pago & Canales de Venta) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px',
                marginBottom: '32px',
            }}>
                {/* Real Payment Methods Breakdown */}
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1.5px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>💳</span> Métodos de Pago
                        </h3>
                    </div>

                    {!metrics || metrics.paymentMethods.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                            Aún no hay suficientes pagos confirmados en este período.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {metrics.paymentMethods.map((pm) => (
                                <div key={pm.key}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{pm.name}</span>
                                        <span style={{ fontWeight: 800, color: 'var(--robotina-orange)' }}>
                                            {pm.count === 1 ? '1 pago' : `${pm.count} pagos`} · {pm.percentage}%
                                        </span>
                                    </div>
                                    <div style={{ height: '7px', background: 'var(--input-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min(pm.percentage, 100)}%`,
                                            height: '100%',
                                            background: 'var(--gradient-main)',
                                            borderRadius: '4px',
                                            transition: 'width 0.3s ease',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Real Sales Channels Breakdown */}
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1.5px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📢</span> Canales de Venta
                        </h3>
                    </div>

                    {!metrics || metrics.salesChannels.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                            No hay información de canales registrada en este período.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {metrics.salesChannels.map((ch) => (
                                <div key={ch.key}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{ch.name}</span>
                                        <span style={{ fontWeight: 800, color: '#22c55e' }}>
                                            {ch.count === 1 ? '1 pedido' : `${ch.count} pedidos`} · {ch.percentage}%
                                        </span>
                                    </div>
                                    <div style={{ height: '7px', background: 'var(--input-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min(ch.percentage, 100)}%`,
                                            height: '100%',
                                            background: '#22c55e',
                                            borderRadius: '4px',
                                            transition: 'width 0.3s ease',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Row 4: Operational Lists (Pedidos Recientes & Productos con Bajo Stock) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px',
            }}>
                {/* Pedidos Recientes con Dual Badges */}
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1.5px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)' }}>
                            🛍️ Pedidos Recientes
                        </h3>
                        <Link
                            href="/admin/pedidos"
                            style={{ fontSize: '0.8rem', color: 'var(--robotina-orange)', fontWeight: 700, textDecoration: 'none' }}
                        >
                            Ver todos →
                        </Link>
                    </div>

                    {!metrics || metrics.recentOrders.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay pedidos registrados.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {metrics.recentOrders.map((ord) => (
                                <div
                                    key={ord.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        background: 'var(--input-bg)',
                                        borderRadius: '10px',
                                        fontSize: '0.83rem',
                                    }}
                                >
                                    <div>
                                        <Link
                                            href={`/admin/pedidos/${ord.id}`}
                                            style={{ fontWeight: 800, color: 'var(--foreground)', textDecoration: 'none' }}
                                        >
                                            {ord.order_number}
                                        </Link>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                                            {ord.customer_name}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        <strong style={{ color: 'var(--foreground)', fontWeight: 800, marginRight: '4px' }}>
                                            {formatMoney(ord.total_amount, ord.currency)}
                                        </strong>
                                        <AdminStatusBadge status={ord.payment_status} />
                                        <AdminStatusBadge status={ord.fulfillment_status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Productos con Bajo Stock */}
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1.5px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)' }}>
                            ⚠️ Productos con Bajo Stock
                        </h3>
                        <Link
                            href="/admin/inventario"
                            style={{ fontSize: '0.8rem', color: 'var(--robotina-orange)', fontWeight: 700, textDecoration: 'none' }}
                        >
                            Ajustar inventario →
                        </Link>
                    </div>

                    {!metrics || metrics.lowStockProducts.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay alertas de stock bajo.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {metrics.lowStockProducts.map((prod) => (
                                <div
                                    key={prod.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        background: 'var(--input-bg)',
                                        borderRadius: '10px',
                                        fontSize: '0.83rem',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 800, color: 'var(--foreground)' }}>
                                            {prod.name}
                                        </div>
                                        {prod.variantName && (
                                            <div style={{ color: 'var(--robotina-orange)', fontSize: '0.76rem', fontWeight: 700 }}>
                                                {prod.variantName}
                                            </div>
                                        )}
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                            {prod.sku}
                                        </div>
                                    </div>

                                    <div style={{
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                        padding: '3px 9px',
                                        borderRadius: '6px',
                                        fontWeight: 800,
                                        fontSize: '0.76rem',
                                    }}>
                                        {prod.stock} unidades
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
