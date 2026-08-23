'use client';

import React, { useState } from 'react';
import styles from '@/app/page.module.css';
import ProductCard from '@/components/ProductCard';
import { products } from '@/data/products';

export default function ProductCatalogGrid() {
    const [filter, setFilter] = useState('Todos');

    const filteredProducts = filter === 'Todos'
        ? products
        : products.filter(p => p.type === (filter === 'Servicios' ? 'service' : 'digital'));

    return (
        <section className={styles.storeSection} id="productos">
            <div className={styles.storeHeader}>
                <h2 className={styles.storeTitle}>
                    <span className="text-gradient">Colección de Productos</span>
                </h2>
                <div className={styles.filterBar}>
                    {['Todos', 'Digital', 'Servicios'].map((item) => (
                        <span
                            key={item}
                            className={`${styles.filterItem} ${filter === item ? styles.active : ''}`}
                            onClick={() => setFilter(item)}
                        >
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            <div className={styles.grid}>
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
}
