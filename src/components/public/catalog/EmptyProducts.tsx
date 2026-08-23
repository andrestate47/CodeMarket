'use client';

import React from 'react';
import styles from './ProductCollectionSection.module.css';

interface EmptyProductsProps {
    onResetCategory: () => void;
}

export default function EmptyProducts({ onResetCategory }: EmptyProductsProps) {
    return (
        <div className={styles.emptyContainer}>
            <div className={styles.emptyIcon}>📦</div>
            <h3 className={styles.emptyTitle}>No encontramos productos en esta categoría</h3>
            <p className={styles.emptySubtitle}>
                Intenta seleccionando otra categoría o borra los filtros de búsqueda para ver todo el catálogo.
            </p>
            <button onClick={onResetCategory} className={styles.emptyResetBtn}>
                Ver todos los productos
            </button>
        </div>
    );
}
