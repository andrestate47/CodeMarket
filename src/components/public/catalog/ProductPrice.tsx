'use client';

import React from 'react';
import styles from './ProductCard.module.css';

interface ProductPriceProps {
    price: string;
    comparePrice?: string;
    discountPercentage?: number;
}

export default function ProductPrice({ price, comparePrice, discountPercentage }: ProductPriceProps) {
    return (
        <div className={styles.priceContainer}>
            <span className={styles.mainPrice}>{price}</span>
            {comparePrice && (
                <span className={styles.comparePrice}>{comparePrice}</span>
            )}
            {discountPercentage && discountPercentage > 0 && comparePrice && (
                <span className={styles.discountInlineBadge}>
                    -{discountPercentage}%
                </span>
            )}
        </div>
    );
}
