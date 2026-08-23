'use client';

import React from 'react';
import styles from './ProductCollectionSection.module.css';

export type SortOptionValue = 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

interface ProductSortProps {
    value: SortOptionValue;
    onChange: (val: SortOptionValue) => void;
}

export default function ProductSort({ value, onChange }: ProductSortProps) {
    return (
        <div className={styles.sortWrapper}>
            <label htmlFor="product-sort-select" className={styles.sortLabel}>
                Ordenar por:
            </label>
            <select
                id="product-sort-select"
                value={value}
                onChange={(e) => onChange(e.target.value as SortOptionValue)}
                className={styles.sortSelect}
            >
                <option value="newest">Más recientes</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="name_asc">Nombre: A – Z</option>
                <option value="name_desc">Nombre: Z – A</option>
            </select>
        </div>
    );
}
