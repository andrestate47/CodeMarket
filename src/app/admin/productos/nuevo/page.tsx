'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { parseMoneyToCents } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default function AdminNewProduct() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('49.00');
    const [comparePrice, setComparePrice] = useState('79.00');
    const [productType, setProductType] = useState<'digital' | 'service' | 'physical'>('digital');
    const [stockQuantity, setStockQuantity] = useState('10');
    const [trackInventory, setTrackInventory] = useState(false);
    const [featured, setFeatured] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const priceAmount = parseMoneyToCents(price);
            const compareAtAmount = comparePrice ? parseMoneyToCents(comparePrice) : null;

            // Fetch default store id
            const { data: store } = await supabase.from('stores').select('id').eq('slug', 'codemarket').single();
            const storeId = store?.id;

            if (!storeId) {
                setError('No se encontró la tienda principal CodeMarket.');
                setSaving(false);
                return;
            }

            const { error: insertError } = await supabase.from('products').insert({
                store_id: storeId,
                name,
                slug,
                short_description: shortDescription,
                description,
                product_type: productType,
                status: 'active',
                price_amount: priceAmount,
                compare_at_amount: compareAtAmount,
                currency: 'PEN',
                track_inventory: trackInventory,
                stock_quantity: trackInventory ? parseInt(stockQuantity, 10) : 0,
                featured,
                metadata: {
                    features: [shortDescription],
                    cta: productType === 'service' ? 'Cotizar Proyecto' : 'Comprar',
                    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                }
            });

            if (insertError) {
                setError(`Error al guardar producto: ${insertError.message}`);
            } else {
                router.push('/admin/productos');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al crear producto';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: '750px' }}>
            <AdminPageHeader
                title="Crear Nuevo Producto"
                description="Agrega un producto digital, servicio o artículo físico al catálogo de CodeMarket."
                action={
                    <Link
                        href="/admin/productos"
                        style={{
                            padding: '8px 14px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            fontWeight: 600,
                        }}
                    >
                        ← Volver a Productos
                    </Link>
                }
            />

                <form onSubmit={handleSubmit} style={{ background: '#13131a', padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Nombre del Producto</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej. Kit Ecommerce Pro"
                            style={{ width: '100%', background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 16px', color: 'white', outline: 'none' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Descripción Corta</label>
                        <input
                            type="text"
                            required
                            value={shortDescription}
                            onChange={e => setShortDescription(e.target.value)}
                            placeholder="Resumen atractivo para la tarjeta del producto"
                            style={{ width: '100%', background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 16px', color: 'white', outline: 'none' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Descripción Completa</label>
                        <textarea
                            rows={5}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Detalles del producto o servicio"
                            style={{ width: '100%', background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 16px', color: 'white', outline: 'none', resize: 'vertical' }}
                        ></textarea>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Precio (S/)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                style={{ width: '100%', background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 16px', color: 'white', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Precio Anterior / Tanchado (S/)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={comparePrice}
                                onChange={e => setComparePrice(e.target.value)}
                                style={{ width: '100%', background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 16px', color: 'white', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Tipo de Producto</label>
                            <select
                                value={productType}
                                onChange={e => setProductType(e.target.value as 'digital' | 'service' | 'physical')}
                                style={{ width: '100%', background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 16px', color: 'white', outline: 'none' }}
                            >
                                <option value="digital">Digital (Plantilla / Software)</option>
                                <option value="service">Servicio (Desarrollo / Consultoría)</option>
                                <option value="physical">Físico (Envío Requerido)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Producto Destacado</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '45px' }}>
                                <input
                                    type="checkbox"
                                    id="featured"
                                    checked={featured}
                                    onChange={e => setFeatured(e.target.checked)}
                                />
                                <label htmlFor="featured" style={{ fontSize: '0.85rem' }}>Mostrar en portada</label>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Control de Stock</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '45px' }}>
                                <input
                                    type="checkbox"
                                    id="track"
                                    checked={trackInventory}
                                    onChange={e => setTrackInventory(e.target.checked)}
                                />
                                <label htmlFor="track" style={{ fontSize: '0.85rem' }}>Controlar unidades</label>
                            </div>
                        </div>
                    </div>

                    {trackInventory && (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Cantidad en Stock</label>
                            <input
                                type="number"
                                value={stockQuantity}
                                onChange={e => setStockQuantity(e.target.value)}
                                style={{ width: '100%', background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 16px', color: 'white', outline: 'none' }}
                            />
                        </div>
                    )}

                    {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '14px',
                            fontWeight: 800,
                            fontSize: '1rem',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            marginTop: '12px'
                        }}
                    >
                        {saving ? 'Guardando...' : 'Publicar Producto'}
                    </button>
                </form>
            </div>
    );
}
