'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductGrid from './ProductGrid';
import { getPublicCatalogProductsAction, PublicProductItem } from '@/modules/catalog/publicActions';
import styles from './ProductCollectionSection.module.css';

export default function NewArrivalsSection() {
    const [newArrivals, setNewArrivals] = useState<PublicProductItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isCurrent = true;
        (async () => {
            setLoading(true);
            const res = await getPublicCatalogProductsAction({ sortBy: 'newest', pageSize: 12 });
            if (isCurrent && res.success) {
                setNewArrivals(res.products.slice(0, 4));
            }
            if (isCurrent) setLoading(false);
        })();
        return () => {
            isCurrent = false;
        };
    }, []);

    if (loading && newArrivals.length === 0) return null;

    return (
        <section className={styles.section} style={{ padding: '72px 0', borderBottom: '1px solid var(--glass-border, rgba(255, 255, 255, 0.06))' }}>
            <div className={styles.container}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
                    <div>
                        <span className={styles.sectionBadge}>
                            CATÁLOGO ACTUALIZADO
                        </span>
                        <h2 className={styles.sectionTitle} style={{ marginTop: '8px' }}>
                            Recién llegados
                        </h2>
                    </div>

                    <Link
                        href="/#productos"
                        style={{
                            color: 'var(--robotina-orange)',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        {'Explorar novedades →'}
                    </Link>
                </div>

                <ProductGrid products={newArrivals} />
            </div>
        </section>
    );
}
