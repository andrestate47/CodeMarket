'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchCatalogProducts, CatalogProduct } from '@/modules/catalog/queries';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminProductsList() {
    const [productsList, setProductsList] = useState<CatalogProduct[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProducts = React.useCallback(async () => {
        setLoading(true);
        const data = await fetchCatalogProducts();
        setProductsList(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (isMounted) {
                await loadProducts();
            }
        })();
        return () => { isMounted = false; };
    }, [loadProducts]);

    const toggleStatus = async (productId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'active' ? 'draft' : 'active';
        await supabase.from('products').update({ status: nextStatus }).eq('id', productId);
        loadProducts();
    };

    const columns = [
        {
            header: 'Producto',
            cell: (prod: CatalogProduct) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                    }}>
                        {'📦'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'white' }}>{prod.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#71717a' }}>{prod.category}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Precio',
            cell: (prod: CatalogProduct) => (
                <span style={{ fontWeight: 700, color: 'white' }}>
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
                        color: isLow ? '#f87171' : 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isLow ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
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
            cell: (prod: CatalogProduct) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => toggleStatus(prod.id, prod.status || 'active')}
                        style={{
                            padding: '6px 12px',
                            background: prod.status === 'active' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                            border: `1px solid ${prod.status === 'active' ? '#f8717130' : '#4ade8030'}`,
                            color: prod.status === 'active' ? '#f87171' : '#4ade80',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        {prod.status === 'active' ? 'Ocultar' : 'Publicar'}
                    </button>
                    <Link
                        href={`/admin/productos/${prod.id}`}
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
                        Editar
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <div>
            <AdminPageHeader
                title="Gestión de Productos"
                description="Administra el catálogo, precios, stock y visibilidad de CodeMarket."
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
                        }}
                    >
                        <span>➕</span> Nuevo Producto
                    </Link>
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
                                background: '#a855f7',
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
            ) : (
                <AdminDataTable
                    columns={columns}
                    data={productsList}
                    keyExtractor={p => p.id}
                    loading={loading}
                />
            )}
        </div>
    );
}
