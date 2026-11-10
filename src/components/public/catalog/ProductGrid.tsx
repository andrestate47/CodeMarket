'use client';

import React, { useState } from 'react';
import { PublicProductItem } from '@/modules/catalog/publicActions';
import CatalogProductCard from './ProductCard';
import ProductQuickSheet from '@/components/public/social/ProductQuickSheet';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
    products: PublicProductItem[];
}

export default function ProductGrid({ products }: ProductGridProps) {
    const [quickProduct, setQuickProduct] = useState<PublicProductItem | null>(null);

    return (
        <>
            <div className={styles.grid}>
                {products.map((product) => (
                    <div key={product.id} className={styles.gridCol}>
                        <CatalogProductCard
                            product={product}
                            onOpenQuickSheet={(p) => setQuickProduct(p)}
                        />
                    </div>
                ))}
            </div>

            <ProductQuickSheet
                product={quickProduct}
                isOpen={Boolean(quickProduct)}
                onClose={() => setQuickProduct(null)}
            />
        </>
    );
}
