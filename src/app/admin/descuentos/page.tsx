'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import { CouponService, Coupon } from '@/lib/services/couponService';

export default function AdminDiscountsListPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const loadCoupons = useCallback(async () => {
        setLoading(true);
        const data = await CouponService.getCoupons();
        setCoupons(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadCoupons();
        window.addEventListener('coupons_updated', loadCoupons);
        return () => window.removeEventListener('coupons_updated', loadCoupons);
    }, [loadCoupons]);

    const handleToggle = async (id: string, currentStatus: boolean) => {
        await CouponService.toggleCouponStatus(id, !currentStatus);
        loadCoupons();
    };

    const handleDelete = async (id: string, code: string) => {
        if (confirm(`¿Estás seguro de que deseas eliminar el cupón "${code}"?`)) {
            await CouponService.deleteCoupon(id);
            loadCoupons();
        }
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ paddingBottom: '60px' }}>
            <AdminPageHeader
                title="Descuentos y Cupones"
                description="Administra códigos promocionales, ofertas por porcentaje y cupones de monto fijo para tus clientes."
                action={
                    <Link
                        href="/admin/descuentos/nuevo"
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
                        <span>🎟️</span> Nuevo Cupón
                    </Link>
                }
            />

            {/* Filter Search Bar */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="🔍 Buscar cupón por código..."
                    style={{
                        maxWidth: '350px',
                        width: '100%',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: 'var(--foreground)',
                        outline: 'none',
                    }}
                />
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Cargando cupones...
                </div>
            ) : filteredCoupons.length === 0 ? (
                <AdminEmptyState
                    icon="🎟️"
                    title="No se encontraron cupones"
                    description="Crea cupones de porcentaje, monto fijo o promociones especiales para tus clientes."
                    action={
                        <Link
                            href="/admin/descuentos/nuevo"
                            style={{
                                padding: '10px 18px',
                                background: 'var(--robotina-orange)',
                                color: 'white',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 700,
                            }}
                        >
                            Crear Primer Cupón
                        </Link>
                    }
                />
            ) : (
                <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--input-bg)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <th style={{ padding: '14px 18px' }}>Código</th>
                                    <th style={{ padding: '14px 18px' }}>Descuento</th>
                                    <th style={{ padding: '14px 18px' }}>Compra Mínima</th>
                                    <th style={{ padding: '14px 18px' }}>Usos Realizados</th>
                                    <th style={{ padding: '14px 18px' }}>Vencimiento</th>
                                    <th style={{ padding: '14px 18px' }}>Estado</th>
                                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCoupons.map((coupon) => {
                                    const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                                    const isLimitReached = coupon.max_uses && coupon.uses_count >= coupon.max_uses;

                                    return (
                                        <tr key={coupon.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s ease' }}>
                                            <td style={{ padding: '14px 18px' }}>
                                                <span style={{
                                                    fontFamily: 'monospace',
                                                    fontWeight: 800,
                                                    fontSize: '1.05rem',
                                                    background: 'rgba(255, 107, 0, 0.1)',
                                                    color: 'var(--robotina-orange)',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(255, 107, 0, 0.25)'
                                                }}>
                                                    {coupon.code}
                                                </span>
                                            </td>

                                            <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--foreground)' }}>
                                                {coupon.discount_type === 'percentage'
                                                    ? `${coupon.discount_value}% de descuento`
                                                    : `S/ ${(coupon.discount_value / 100).toFixed(2)} de rebaja`}
                                            </td>

                                            <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                                                {coupon.min_purchase_amount > 0
                                                    ? `S/ ${(coupon.min_purchase_amount / 100).toFixed(2)}`
                                                    : 'Sin mínimo'}
                                            </td>

                                            <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                                                <strong>{coupon.uses_count}</strong> {coupon.max_uses ? `/ ${coupon.max_uses}` : 'usos'}
                                            </td>

                                            <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                                                {coupon.expires_at
                                                    ? new Date(coupon.expires_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : 'Sin fecha de vencimiento'}
                                            </td>

                                            <td style={{ padding: '14px 18px' }}>
                                                {isExpired ? (
                                                    <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
                                                        ⏰ Expirado
                                                    </span>
                                                ) : isLimitReached ? (
                                                    <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
                                                        ⚠️ Limite Alcanzado
                                                    </span>
                                                ) : coupon.is_active ? (
                                                    <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
                                                        ● Activo
                                                    </span>
                                                ) : (
                                                    <span style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
                                                        Pausado
                                                    </span>
                                                )}
                                            </td>

                                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggle(coupon.id, coupon.is_active)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: 'var(--input-bg)',
                                                            border: '1px solid var(--glass-border)',
                                                            borderRadius: '6px',
                                                            fontSize: '0.78rem',
                                                            fontWeight: 600,
                                                            color: 'var(--foreground)',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {coupon.is_active ? '⏸️ Pausar' : '▶️ Activar'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(coupon.id, coupon.code)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                                            borderRadius: '6px',
                                                            fontSize: '0.78rem',
                                                            fontWeight: 600,
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        🗑️ Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
