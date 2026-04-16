'use client';

import React from 'react';
import styles from './ProductCard.module.css';
import { Product } from '@/data/products';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem, items } = useCart();

    // Check if item is in cart
    const isSelected = items.some(item => item.id === product.id);

    // We'll use the first letter of the title as a "logo"
    const logoLetter = product.title.charAt(0);

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (product.type === 'service') {
            window.location.href = 'mailto:hello@codemarket.dev?subject=Consulta%20Proyecto';
        } else {
            // For digital products, we add to cart if not present
            // If present, user can click cart icon in header to view.
            addItem(product);
        }
    };

    const handleHeartClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isSelected) {
            addItem(product);
        }
        // If already selected, do nothing or maybe open cart? 
        // For now, assuming "turns red" is the main feedback. 
        // We allow adding again if logic permits, but UI only shows "red".
        // Actually, addItem will open cart, so feedback is immediate.
    };

    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                <div className={styles.priceTag}>{product.price}</div>
                <div
                    className={styles.productImage}
                    style={{ background: product.color }}
                >
                    {logoLetter}
                </div>
            </div>

            <div className={styles.details}>
                <div className={styles.headerRow}>
                    <span className={styles.title}>{product.title}</span>
                    {product.type !== 'service' && (
                        <button
                            className={styles.heartButton}
                            onClick={handleHeartClick}
                            aria-label={isSelected ? "Producto en carrito" : "Agregar al carrito"}
                        >
                            <svg
                                className={`${styles.heartIcon} ${isSelected ? styles.selected : styles.unselected}`}
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                    )}
                </div>
                <span className={styles.category}>{product.category}</span>

                {product.type === 'service' && (
                    <button className={styles.ctaButton} onClick={handleAction}>
                        Cotizar &rarr;
                    </button>
                )}
            </div>
        </div>
    );
}
