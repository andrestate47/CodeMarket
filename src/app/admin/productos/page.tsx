'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { fetchCatalogProducts, getInstantProducts, CatalogProduct } from '@/modules/catalog/queries';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminProductsList() {
    const pathname = usePathname();
    const [productsList, setProductsList] = useState<CatalogProduct[]>(() => getInstantProducts());
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('products_view_mode') as 'list' | 'grid';
            if (saved === 'grid' || saved === 'list') return saved;
        }
        return 'list';
    });
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    useEffect(() => {
        const handleOutsideClick = () => setOpenMenuId(null);
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    const refreshData = useCallback(async () => {
        // Immediate sync read
        const instant = getInstantProducts();
        setProductsList(instant);

        // Background async read
        const data = await fetchCatalogProducts();
        if (data.length > 0) {
            setProductsList(data);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (isMounted) {
                await refreshData();
            }
        })();

        window.addEventListener('storage', refreshData);
        window.addEventListener('products_updated', refreshData);
        window.addEventListener('focus', refreshData);
        return () => {
            isMounted = false;
            window.removeEventListener('storage', refreshData);
            window.removeEventListener('products_updated', refreshData);
            window.removeEventListener('focus', refreshData);
        };
    }, [pathname, refreshData]);

    const toggleStatus = async (productId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'active' ? 'draft' : 'active';
        setProductsList(prev => prev.map(p => p.id === productId ? { ...p, status: nextStatus } : p));
        
        try {
            // Update local storage if present
            const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedLocal = localSaved.map(p => p.id === productId ? { ...p, status: nextStatus } : p);
            localStorage.setItem('admin_products', JSON.stringify(updatedLocal));

            // Also update Supabase
            await supabase.from('products').update({ status: nextStatus }).eq('id', productId);
        } catch {
            // Ignore error
        }
    };

    const deleteProduct = async (productId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto del catálogo?')) return;
        
        setProductsList(prev => prev.filter(p => p.id !== productId));
        
        try {
            // Delete from localStorage
            const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedLocal = localSaved.filter(p => p.id !== productId);
            localStorage.setItem('admin_products', JSON.stringify(updatedLocal));

            // Delete from Supabase DB
            await supabase.from('products').delete().eq('id', productId);
        } catch {
            // Ignore error
        }
    };

    const columns = [
        {
            header: 'Producto',
            cell: (prod: CatalogProduct) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                    }}>
                        {prod.image ? (
                            <img src={prod.image} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '1.2rem' }}>📦</span>
                        )}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{prod.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{prod.category}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Precio',
            cell: (prod: CatalogProduct) => (
                <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                    {typeof prod.price === 'number' ? formatMoney(prod.price) : prod.price}
                </span>
            ),
        },
        {
            header: 'Stock',
            cell: (prod: CatalogProduct) => {
                const stock = prod.stock_quantity ?? 10;
                const isLow = stock <= 5;
                return (
                    <span style={{
                        fontWeight: 700,
                        color: isLow ? '#ef4444' : 'var(--foreground)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: isLow ? 'rgba(239, 68, 68, 0.12)' : 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                    }}>
                        {stock} unidades
                    </span>
                );
            },
        },
        {
            header: 'Estado',
            cell: (prod: CatalogProduct) => <AdminStatusBadge status={prod.status || 'active'} />,
        },
        {
            header: 'Acciones',
            cell: (prod: CatalogProduct) => {
                const isActive = (prod.status || 'active') === 'active';
                return (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => toggleStatus(prod.id, prod.status || 'active')}
                            style={{
                                padding: '6px 12px',
                                background: isActive ? 'var(--glass-bg)' : 'var(--robotina-orange)',
                                border: `1px solid ${isActive ? 'var(--glass-border)' : 'var(--robotina-orange)'}`,
                                color: isActive ? 'var(--foreground)' : '#ffffff',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                fontWeight: 700,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {isActive ? '👁️ Ocultar' : '🚀 Publicar'}
                        </button>
                        <Link
                            href={`/admin/productos/${prod.id}`}
                            style={{
                                padding: '6px 12px',
                                background: 'var(--glass-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--foreground)',
                                fontSize: '0.8rem',
                                textDecoration: 'none',
                                fontWeight: 600,
                            }}
                        >
                            ✏️ Editar
                        </Link>
                        <button
                            onClick={() => deleteProduct(prod.id)}
                            style={{
                                padding: '6px 10px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                color: '#ef4444',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                            }}
                        >
                            🗑️
                        </button>
                    </div>
                );
            },
        },
    ];

    return (
        <div>
            <AdminPageHeader
                title="Gestión de Productos"
                description="Administra el catálogo, precios, stock y visibilidad de CodeMarket."
                action={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* View Switcher: Lista vs Cuadrícula */}
                        <div style={{ display: 'flex', background: 'var(--glass-bg)', padding: '3px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                            <button
                                onClick={() => { setViewMode('list'); localStorage.setItem('products_view_mode', 'list'); }}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '7px',
                                    background: viewMode === 'list' ? 'var(--robotina-orange)' : 'transparent',
                                    color: viewMode === 'list' ? '#ffffff' : 'var(--foreground)',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                ☰ Lista
                            </button>
                            <button
                                onClick={() => { setViewMode('grid'); localStorage.setItem('products_view_mode', 'grid'); }}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '7px',
                                    background: viewMode === 'grid' ? 'var(--robotina-orange)' : 'transparent',
                                    color: viewMode === 'grid' ? '#ffffff' : 'var(--foreground)',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                🎛️ Cuadrícula
                            </button>
                        </div>

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
                    </div>
                }
            />

            {productsList.length === 0 && !loading ? (
                <AdminEmptyState
                    title="No hay productos creados"
                    description="Comienza agregando el primer producto a tu tienda para tener un catálogo activo."
                    action={
                        <Link
                            href="/admin/productos/nuevo"
                            style={{
                                padding: '10px 18px',
                                background: 'var(--robotina-orange)',
                                color: 'white',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 700,
                            }}
                        >
                            Crear Primer Producto
                        </Link>
                    }
                />
            ) : viewMode === 'list' ? (
                <AdminDataTable
                    columns={columns}
                    data={productsList}
                    keyExtractor={p => p.id}
                    loading={loading}
                />
            ) : (
                /* Grid View Layout */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '28px 22px', paddingTop: '10px' }}>
                    {productsList.map(prod => {
                        const isActive = (prod.status || 'active') === 'active';
                        const isMenuOpen = openMenuId === prod.id;

                        return (
                            <div
                                key={prod.id}
                                style={{
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '16px',
                                    overflow: 'visible',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                }}
                            >
                                {/* Floating Circular Action Button (+) OVER top right corner */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(isMenuOpen ? null : prod.id);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '-10px',
                                        right: '-10px',
                                        width: '36px',
                                        height: '36px',
                                        minWidth: '36px',
                                        minHeight: '36px',
                                        borderRadius: '50%',
                                        background: 'var(--card-bg)',
                                        border: '1.5px solid var(--glass-border)',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                        color: 'var(--foreground)',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 30,
                                        padding: 0,
                                        boxSizing: 'border-box',
                                        transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
                                        transform: isMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                                    }}
                                    title="Opciones del Producto"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                </button>

                                {/* Floating Action Menu Dropdown */}
                                {isMenuOpen && (
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            position: 'absolute',
                                            top: '34px',
                                            right: '-10px',
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                                            padding: '6px',
                                            zIndex: 40,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                            minWidth: '150px',
                                        }}
                                    >
                                        <Link
                                            href={`/admin/productos/${prod.id}`}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                color: 'var(--foreground)',
                                                textDecoration: 'none',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                            }}
                                        >
                                            ✏️ Editar
                                        </Link>
                                        <button
                                            onClick={() => {
                                                toggleStatus(prod.id, prod.status || 'active');
                                                setOpenMenuId(null);
                                            }}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                background: 'transparent',
                                                color: 'var(--foreground)',
                                                border: 'none',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                            }}
                                        >
                                            {isActive ? '👁️ Ocultar' : '🚀 Publicar'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                deleteProduct(prod.id);
                                                setOpenMenuId(null);
                                            }}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                border: 'none',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                            }}
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </div>
                                )}

                                {/* Product Image Header */}
                                <div style={{ height: '160px', width: '100%', background: 'var(--input-bg)', position: 'relative', overflow: 'hidden', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                                    {prod.image ? (
                                        <img src={prod.image} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem' }}>📦</div>
                                    )}
                                </div>

                                {/* Card Body */}
                                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            {prod.category}
                                        </span>
                                        <AdminStatusBadge status={prod.status || 'active'} />
                                    </div>

                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)', margin: '4px 0' }}>
                                        {prod.title}
                                    </h3>

                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-description)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '36px' }}>
                                        {prod.description}
                                    </p>

                                    <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)' }}>
                                            {typeof prod.price === 'number' ? formatMoney(prod.price) : prod.price}
                                        </span>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                            📦 {prod.stock_quantity ?? 10} un.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
