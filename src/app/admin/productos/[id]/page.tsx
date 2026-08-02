'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchCatalogProducts, getInstantProducts, CatalogProduct } from '@/modules/catalog/queries';
import { parseMoneyToCents } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default function AdminEditProductPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [price, setPrice] = useState('0.00');
    const [comparePrice, setComparePrice] = useState('');
    const [productType, setProductType] = useState<'digital' | 'service' | 'physical'>('digital');
    const [stockQuantity, setStockQuantity] = useState('10');
    const [trackInventory, setTrackInventory] = useState(false);
    const [featured, setFeatured] = useState(false);
    const [status, setStatus] = useState<'active' | 'draft'>('active');

    useEffect(() => {
        let isMounted = true;

        const loadProductData = async () => {
            if (!productId) return;

            // 1. Check instant local/cache products first
            const instantList = getInstantProducts();
            const foundLocal = instantList.find(p => p.id === productId);

            if (foundLocal && isMounted) {
                populateForm(foundLocal);
                setLoading(false);
                return;
            }

            // 2. Fallback to catalog fetch
            const allProducts = await fetchCatalogProducts();
            const found = allProducts.find(p => p.id === productId);

            if (found && isMounted) {
                populateForm(found);
            } else if (isMounted) {
                setError('No se encontró el producto especificado.');
            }
            setLoading(false);
        };

        loadProductData();
        return () => { isMounted = false; };
    }, [productId]);

    const populateForm = (prod: CatalogProduct) => {
        setName(prod.title || '');
        setShortDescription(prod.description || '');
        setDescription(prod.longDescription || prod.description || '');
        setImageUrl(prod.image || '');

        // Extract numerical price
        const numPrice = typeof prod.price === 'number'
            ? prod.price
            : (prod.price_amount ? prod.price_amount / 100 : parseFloat((prod.price || '0').replace(/[^0-9.]/g, '')) || 0);

        setPrice(numPrice.toFixed(2));

        if (prod.comparePrice) {
            const numCompare = prod.compare_at_amount
                ? prod.compare_at_amount / 100
                : parseFloat((prod.comparePrice || '').replace(/[^0-9.]/g, '')) || 0;
            setComparePrice(numCompare > 0 ? numCompare.toFixed(2) : '');
        } else {
            setComparePrice('');
        }

        setProductType(prod.type || 'digital');
        setStockQuantity(String(prod.stock_quantity ?? 10));
        setTrackInventory(prod.track_inventory || false);
        setFeatured(prod.highlight || false);
        setStatus((prod.status as 'active' | 'draft') || 'active');
    };

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const compressed = canvas.toDataURL('image/jpeg', 0.75);
                setImageUrl(compressed);
            };
            if (typeof event.target?.result === 'string') {
                img.src = event.target.result;
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const priceAmount = parseMoneyToCents(price);
            const compareAtAmount = comparePrice ? parseMoneyToCents(comparePrice) : null;
            const finalImage = imageUrl || '/web-basica-hero.png';

            const updatedProduct: CatalogProduct = {
                id: productId,
                title: name,
                category: productType === 'service' ? 'Servicios' : (productType === 'physical' ? 'Físicos' : 'Digital'),
                description: shortDescription,
                longDescription: description,
                price: `S/ ${parseFloat(price).toFixed(2)}`,
                comparePrice: comparePrice ? `S/ ${parseFloat(comparePrice).toFixed(2)}` : undefined,
                price_amount: priceAmount,
                compare_at_amount: compareAtAmount || undefined,
                features: [shortDescription],
                type: productType,
                cta: productType === 'service' ? 'Cotizar Proyecto' : 'Comprar',
                highlight: featured,
                color: 'linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%)',
                image: finalImage,
                stock_quantity: trackInventory ? (parseInt(stockQuantity, 10) || 10) : 100,
                track_inventory: trackInventory,
                status: status,
            };

            // 1. Save locally in localStorage
            try {
                const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
                const existingIndex = localSaved.findIndex(p => p.id === productId);

                if (existingIndex >= 0) {
                    localSaved[existingIndex] = updatedProduct;
                } else {
                    localSaved.unshift(updatedProduct);
                }

                localStorage.setItem('admin_products', JSON.stringify(localSaved.slice(0, 30)));
            } catch {
                // Ignore storage errors
            }

            // 2. Broadcast updates
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('products_updated'));
            }

            // 3. Attempt update on Supabase DB
            try {
                await supabase.from('products').update({
                    name,
                    short_description: shortDescription,
                    description,
                    product_type: productType,
                    status: status,
                    price_amount: priceAmount,
                    compare_at_amount: compareAtAmount,
                    track_inventory: trackInventory,
                    stock_quantity: trackInventory ? parseInt(stockQuantity, 10) : 100,
                    featured,
                    image_url: finalImage,
                    metadata: {
                        features: [shortDescription],
                        cta: productType === 'service' ? 'Cotizar Proyecto' : 'Comprar',
                        image: finalImage,
                    }
                }).eq('id', productId);
            } catch {
                // Ignore remote sync errors
            }

            setSuccessMsg('¡Producto actualizado con éxito!');
            setTimeout(() => {
                router.push('/admin/productos');
                router.refresh();
            }, 800);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al actualizar el producto';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Cargando datos del producto...
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '750px' }}>
            <AdminPageHeader
                title="Editar Producto"
                description={`Modifica los detalles, precio, imagen y disponibilidad de "${name || 'Producto'}".`}
                action={
                    <Link
                        href="/admin/productos"
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
                        ← Volver a Productos
                    </Link>
                }
            />

            <form onSubmit={handleSubmit} style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '20px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'var(--transition)' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>Nombre del Producto *</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ej. Kit Ecommerce Pro"
                        style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px 16px', color: 'var(--input-text)', outline: 'none' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>Imagen Principal del Producto</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {!imageUrl ? (
                            <label
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '32px 20px',
                                    border: '2px dashed var(--glass-border)',
                                    borderRadius: '14px',
                                    background: 'var(--input-bg)',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'border-color 0.2s ease, background 0.2s ease',
                                }}
                            >
                                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</div>
                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)', marginBottom: '4px' }}>
                                    Haz clic para subir o cambiar la foto del producto
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Soporta imágenes PNG, JPG o WEBP (Recomendado 800x800 px)
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageFileChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--input-bg)', padding: '16px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ width: '90px', height: '90px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                                    <img src={imageUrl} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--foreground)' }}>Imagen configurada</span>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <label
                                            style={{
                                                padding: '6px 12px',
                                                background: 'var(--glass-bg)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                color: 'var(--foreground)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            🔄 Cambiar Foto
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageFileChange}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setImageUrl('')}
                                            style={{
                                                padding: '6px 12px',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            🗑️ Quitar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>Descripción Corta *</label>
                    <input
                        type="text"
                        required
                        value={shortDescription}
                        onChange={e => setShortDescription(e.target.value)}
                        placeholder="Resumen atractivo para la tarjeta del producto"
                        style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px 16px', color: 'var(--input-text)', outline: 'none' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>Descripción Completa</label>
                    <textarea
                        rows={4}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Detalles del producto o servicio"
                        style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px 16px', color: 'var(--input-text)', outline: 'none', resize: 'vertical' }}
                    ></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>Precio (S/) *</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px 16px', color: 'var(--input-text)', outline: 'none' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>Precio Anterior / Tachado (S/)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={comparePrice}
                            onChange={e => setComparePrice(e.target.value)}
                            style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px 16px', color: 'var(--input-text)', outline: 'none' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>Tipo de Producto</label>
                        <select
                            value={productType}
                            onChange={e => setProductType(e.target.value as 'digital' | 'service' | 'physical')}
                            style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px 16px', color: 'var(--input-text)', outline: 'none' }}
                        >
                            <option value="digital">Digital (Plantilla / Software)</option>
                            <option value="service">Servicio (Desarrollo / Consultoría)</option>
                            <option value="physical">Físico (Envío Requerido)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>Estado de Visibilidad</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value as 'active' | 'draft')}
                            style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px 16px', color: 'var(--input-text)', outline: 'none' }}
                        >
                            <option value="active">Activo (Publicado en Tienda)</option>
                            <option value="draft">Borrador (Oculto de Clientes)</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>Control de Inventario</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '45px' }}>
                            <input
                                type="checkbox"
                                checked={trackInventory}
                                onChange={e => setTrackInventory(e.target.checked)}
                                id="trackCheck"
                                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--robotina-orange)' }}
                            />
                            <label htmlFor="trackCheck" style={{ cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-muted)' }}>Controlar unidades en stock</label>
                        </div>
                    </div>

                    {trackInventory && (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>Cantidad en Stock</label>
                            <input
                                type="number"
                                value={stockQuantity}
                                onChange={e => setStockQuantity(e.target.value)}
                                style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px 16px', color: 'var(--input-text)', outline: 'none' }}
                            />
                        </div>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>Producto Destacado</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            checked={featured}
                            onChange={e => setFeatured(e.target.checked)}
                            id="featuredCheckEdit"
                            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--robotina-orange)' }}
                        />
                        <label htmlFor="featuredCheckEdit" style={{ cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-muted)' }}>Mostrar en portada y destacados</label>
                    </div>
                </div>

                {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}
                {successMsg && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', color: '#22c55e', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>{successMsg}</div>}

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            flex: 1,
                            background: 'var(--gradient-main)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '14px',
                            fontWeight: 800,
                            fontSize: '1rem',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 14px rgba(255, 107, 0, 0.35)',
                        }}
                    >
                        {saving ? 'Guardando Cambios...' : 'Guardar Cambios'}
                    </button>
                    <Link
                        href="/admin/productos"
                        style={{
                            padding: '14px 20px',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            color: 'var(--foreground)',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        Cancelar
                    </Link>
                </div>
            </form>
        </div>
    );
}
