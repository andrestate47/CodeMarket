'use client';

import React from 'react';
import styles from './ProductGrid.module.css';

interface ProductGridSkeletonProps {
    count?: number;
}

export default function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
    return (
        <div className={styles.grid}>
            {Array.from({ length: count }).map((_, idx) => (
                <div key={idx} className={styles.skeletonCard}>
                    <div className={styles.skeletonImage} />
                    <div className={styles.skeletonContent}>
                        <div className={styles.skeletonBadge} />
                        <div className={styles.skeletonTitle} />
                        <div className={styles.skeletonTitleShort} />
                        <div className={styles.skeletonPrice} />
                        <div className={styles.skeletonButton} />
                    </div>
                </div>
            ))}
        </div>
    );
}
