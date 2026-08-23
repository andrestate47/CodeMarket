'use client';

import React from 'react';
import styles from './ProductCard.module.css';

interface ProductBadgesProps {
    isOutOfStock?: boolean;
    isLowStock?: boolean;
    stockQuantity?: number;
    discountPercentage?: number;
    isFeatured?: boolean;
}

export default function ProductBadges({
    isOutOfStock,
    isLowStock,
    stockQuantity,
    discountPercentage,
    isFeatured,
}: ProductBadgesProps) {
    return (
        <div className={styles.badgeContainer}>
            {isOutOfStock ? (
                <span className={`${styles.badge} ${styles.badgeOutOfStock}`}>
                    AGOTADO
                </span>
            ) : (
                <>
                    {discountPercentage && discountPercentage > 0 && (
                        <span className={`${styles.badge} ${styles.badgeDiscount}`}>
                            -{discountPercentage}% OFF
                        </span>
                    )}
                    {isLowStock && (
                        <span className={`${styles.badge} ${styles.badgeLowStock}`}>
                            ÚLTIMAS {stockQuantity ? stockQuantity : ''} UDS.
                        </span>
                    )}
                    {isFeatured && !discountPercentage && !isLowStock && (
                        <span className={`${styles.badge} ${styles.badgeFeatured}`}>
                            DESTACADO
                        </span>
                    )}
                </>
            )}
        </div>
    );
}
