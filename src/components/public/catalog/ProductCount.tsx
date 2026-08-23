'use client';

import React from 'react';
import styles from './ProductCollectionSection.module.css';

interface ProductCountProps {
    count: number;
    categoryName?: string;
}

export default function ProductCount({ count, categoryName }: ProductCountProps) {
    const text = count === 1 ? '1 producto' : `${count} productos`;
    return (
        <div className={styles.productCountText}>
            {categoryName && categoryName !== 'Todos' && (
                <span className={styles.categoryNameHighlight}>{categoryName} • </span>
            )}
            <span>{text}</span>
        </div>
    );
}
