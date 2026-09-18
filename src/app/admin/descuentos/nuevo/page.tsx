'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { CouponService } from '@/lib/services/couponService';

export default function AdminNewDiscountPage() {
    const router = useRouter();

    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState('15');
    const [minPurchase, setMinPurchase] = useState('0');
    const [maxUses, setMaxUses] = useState('');
    const [hasExpiration, setHasExpiration] = useState(false);
    const [expiresAt, setExpiresAt] = useState('');

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateRandomCode = () => {
        const prefixes = ['OFERTA', 'TIENDAVIR', 'SALE', 'PROMO', 'VAPE'];
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const randomNum = Math.floor(10 + Math.random() * 90);
        setCode(`${randomPrefix}${randomNum}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            if (!code.trim()) {
                setError('Ingresa un código de cupón.');
                setSaving(false);
                return;
            }

            const val = parseFloat(discountValue);
            if (isNaN(val) || val <= 0) {
                setError('El valor del descuento debe ser mayor a 0.');
                setSaving(false);
                return;
            }

            // If fixed, convert soles to cents. If percentage, use integer
            const finalDiscountValue = discountType === 'percentage'
                ? Math.min(100, Math.round(val))
                : Math.round(val * 100);

            const minPurchaseCents = minPurchase && parseFloat(minPurchase) > 0
                ? Math.round(parseFloat(minPurchase) * 100)
                : 0;

            const finalMaxUses = maxUses && parseInt(maxUses, 10) > 0
                ? parseInt(maxUses, 10)
                : null;

            await CouponService.createCoupon({
                code,
                discount_type: discountType,
                discount_value: finalDiscountValue,
                min_purchase_amount: minPurchaseCents,
                max_uses: finalMaxUses,
                expires_at: hasExpiration && expiresAt ? new Date(expiresAt).toISOString() : null,
            });

            router.push('/admin/descuentos');
            router.refresh();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar el cupón.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: '700px' }}>
            <AdminPageHeader
                title="Crear Nuevo Cupón de Descuento"
                description="Genera ofertas especiales por porcentaje o monto fijo para incentivar las ventas en TiendaVir."
                action={
                    <Link
                        href="/admin/descuentos"
                        style={{
                            padding: '8px 14px',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'var(--foreground)',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            fontWeight: 600,
                        }}
                    >
                        ← Volver a Descuentos
                    </Link>
                }
            />

            <form
                onSubmit={handleSubmit}
                style={{
                    background: 'var(--card-bg)',
                    padding: '32px',
                    borderRadius: '20px',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                }}
            >
                {/* Code Field with Generator */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>
                        Código del Cupón *
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Ej. OFERTA20"
                            style={{
                                flex: 1,
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                color: 'var(--input-text)',
                                fontWeight: 800,
                                fontSize: '1.05rem',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                outline: 'none',
                            }}
                        />
                        <button
                            type="button"
                            onClick={generateRandomCode}
                            style={{
                                padding: '12px 16px',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--foreground)',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            🎲 Generar Código
                        </button>
                    </div>
                </div>

                {/* Discount Type & Value */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>
                            Tipo de Descuento *
                        </label>
                        <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                            style={{
                                width: '100%',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                color: 'var(--input-text)',
                                outline: 'none',
                                fontWeight: 600,
                            }}
                        >
                            <option value="percentage">Porcentaje (%)</option>
                            <option value="fixed">Monto Fijo (S/)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>
                            {discountType === 'percentage' ? 'Porcentaje de Descuento (%) *' : 'Monto de Descuento (S/) *'}
                        </label>
                        <input
                            type="number"
                            step={discountType === 'percentage' ? '1' : '0.50'}
                            required
                            min="1"
                            max={discountType === 'percentage' ? '100' : undefined}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                color: 'var(--input-text)',
                                outline: 'none',
                                fontWeight: 700,
                            }}
                        />
                    </div>
                </div>

                {/* Restrictions: Minimum Purchase & Max Uses */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>
                            Compra Mínima (S/)
                        </label>
                        <input
                            type="number"
                            step="1"
                            value={minPurchase}
                            onChange={(e) => setMinPurchase(e.target.value)}
                            placeholder="0 para sin mínimo"
                            style={{
                                width: '100%',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                color: 'var(--input-text)',
                                outline: 'none',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>
                            Límite de Usos Máximo
                        </label>
                        <input
                            type="number"
                            step="1"
                            value={maxUses}
                            onChange={(e) => setMaxUses(e.target.value)}
                            placeholder="Ilimitado si se deja en blanco"
                            style={{
                                width: '100%',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                color: 'var(--input-text)',
                                outline: 'none',
                            }}
                        />
                    </div>
                </div>

                {/* Expiration Check & Date */}
                <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: hasExpiration ? '12px' : '0' }}>
                        <input
                            type="checkbox"
                            id="hasExp"
                            checked={hasExpiration}
                            onChange={(e) => setHasExpiration(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--robotina-orange)', cursor: 'pointer' }}
                        />
                        <label htmlFor="hasExp" style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--foreground)', cursor: 'pointer' }}>
                            ⏰ Establecer fecha límite de vencimiento
                        </label>
                    </div>

                    {hasExpiration && (
                        <input
                            type="date"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                color: 'var(--input-text)',
                                outline: 'none',
                            }}
                        />
                    )}
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        background: 'var(--gradient-main)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '14px',
                        fontWeight: 800,
                        fontSize: '1rem',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        marginTop: '8px',
                        boxShadow: '0 4px 14px rgba(255, 107, 0, 0.35)',
                    }}
                >
                    {saving ? 'Guardando Cupón...' : '🎟️ Crear y Activar Cupón'}
                </button>
            </form>
        </div>
    );
}
