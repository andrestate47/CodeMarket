'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProductGrid from '@/components/public/catalog/ProductGrid';
import ProductGridSkeleton from '@/components/public/catalog/ProductGridSkeleton';
import { getPublicCatalogProductsAction, PublicProductItem } from '@/modules/catalog/publicActions';
import { isProductOnSale, calculateDiscountPercentage } from '@/lib/pricing';
import styles from './page.module.css';

type SortOption = 'newest' | 'biggest_discount' | 'price_asc' | 'price_desc';

export default function OffersPage() {
    const [products, setProducts] = useState<PublicProductItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    useEffect(() => {
        let isMounted = true;
        (async () => {
            setLoading(true);
            const res = await getPublicCatalogProductsAction({ categorySlug: 'ofertas', pageSize: 100 });
            if (isMounted && res.success) {
                // Filter exclusively products where isProductOnSale is true
                const saleProducts = res.products.filter(p => isProductOnSale(p.price_amount, p.compare_at_amount));
                setProducts(saleProducts);
            }
            if (isMounted) setLoading(false);
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    // Sort products
    const sortedProducts = [...products].sort((a, b) => {
        if (sortBy === 'price_asc') return a.price_amount - b.price_amount;
        if (sortBy === 'price_desc') return b.price_amount - a.price_amount;
        if (sortBy === 'biggest_discount') {
            const pctA = calculateDiscountPercentage(a.price_amount, a.compare_at_amount || 0);
            const pctB = calculateDiscountPercentage(b.price_amount, b.compare_at_amount || 0);
            return pctB - pctA;
        }
        // Newest
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return (
        <main className={styles.main}>
            <Navbar />

            <div className={styles.container}>
                <header className={styles.pageHeader}>
                    <span className={styles.badge}>🔥 COLECCIÓN EXCLUSIVA</span>
                    <h1 className={styles.title}>
                        OFERTAS <span className="text-gradient">ESPECIALES</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Descubre productos seleccionados con precios rebajados por tiempo limitado.
                    </p>
                </header>

                <div className={styles.toolbar}>
                    <div className={styles.countText}>
                        🔥 Mostrando <strong>{sortedProducts.length}</strong> productos en oferta
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            Ordenar por:
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className={styles.sortSelect}
                        >
                            <option value="newest">Más recientes</option>
                            <option value="biggest_discount">Mayor descuento (%)</option>
                            <option value="price_asc">Precio: Menor a Mayor</option>
                            <option value="price_desc">Precio: Mayor a Menor</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <ProductGridSkeleton count={8} />
                ) : sortedProducts.length === 0 ? (
                    <div className={styles.emptyBox}>
                        <div className={styles.emptyIcon}>🏷️</div>
                        <h2 className={styles.emptyTitle}>No hay ofertas activas en este momento</h2>
                        <p className={styles.emptyText}>
                            Actualmente todos nuestros productos se encuentran a su precio regular. Vuelve pronto para nuevas promociones.
                        </p>
                        <Link href="/" className={styles.backBtn}>
                            Ver Catálogo General
                        </Link>
                    </div>
                ) : (
                    <ProductGrid products={sortedProducts} />
                )}
            </div>
        </main>
    );
}
