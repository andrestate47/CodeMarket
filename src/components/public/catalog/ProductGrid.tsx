'use client';

import React from 'react';
import { PublicProductItem } from '@/modules/catalog/publicActions';
import CatalogProductCard from './ProductCard';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
    products: PublicProductItem[];
}

export default function ProductGrid({ products }: ProductGridProps) {
    return (
        <div className={styles.grid}>
            {products.map((product) => (
                <div key={product.id} className={styles.gridCol}>
                    <CatalogProductCard product={product} />
                </div>
            ))}
        </div>
    );
}
