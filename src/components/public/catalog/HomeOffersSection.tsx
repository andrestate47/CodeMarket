'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductGrid from './ProductGrid';
import { getPublicCatalogProductsAction, PublicProductItem } from '@/modules/catalog/publicActions';
import { isProductOnSale } from '@/lib/pricing';
import styles from './ProductCollectionSection.module.css';

export default function HomeOffersSection() {
    const [offers, setOffers] = useState<PublicProductItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isCurrent = true;
        (async () => {
            setLoading(true);
            const res = await getPublicCatalogProductsAction({ categorySlug: 'ofertas', pageSize: 12 });
            if (isCurrent && res.success) {
                const saleProducts = res.products.filter(p => isProductOnSale(p.price_amount, p.compare_at_amount));
                setOffers(saleProducts.slice(0, 4));
            }
            if (isCurrent) setLoading(false);
        })();
        return () => {
            isCurrent = false;
        };
    }, []);

    if (loading || offers.length === 0) {
        return null; // AUTOMATICALLY HIDDEN IF NO PRODUCTS ARE ON SALE
    }

    return (
        <section className={styles.section} style={{ paddingBottom: '20px' }}>
            <div className={styles.container}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <span className={styles.sectionBadge}>
                            🔥 TIEMPO LIMITADO
                        </span>
                        <h2 className={styles.sectionTitle} style={{ marginTop: '6px', marginBottom: '4px' }}>
                            Ofertas especiales
                        </h2>
                        <p style={{ color: 'var(--text-muted, #a1a1aa)', fontSize: '0.92rem', margin: 0 }}>
                            Aprovecha precios especiales en productos seleccionados por tiempo limitado.
                        </p>
                    </div>

                    <Link
                        href="/ofertas"
                        style={{
                            color: 'var(--robotina-orange)',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        {'Ver todas las ofertas →'}
                    </Link>
                </div>

                <ProductGrid products={offers} />
            </div>
        </section>
    );
}
