'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PublicProductItem } from '@/modules/catalog/publicActions';
import { useCart } from '@/context/CartContext';
import { Product } from '@/data/products';
import { getProductPricing } from '@/lib/pricing';
import ProductBadges from './ProductBadges';
import ProductPrice from './ProductPrice';
import styles from './ProductCard.module.css';

interface CatalogProductCardProps {
    product: PublicProductItem;
}

export default function CatalogProductCard({ product }: CatalogProductCardProps) {
    const { addItem, items } = useCart();

    const isAddedToCart = items.some(item => item.id === product.id);

    const pricing = getProductPricing(product);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (product.is_out_of_stock) return;

        if (product.type === 'service') {
            window.location.href = 'mailto:contacto@codemarket.dev?subject=Consulta%20Servicio';
            return;
        }

        addItem({
            id: product.id,
            title: product.title,
            category: product.category_name || 'General',
            description: product.description,
            price: pricing.currentPriceFormatted,
            comparePrice: pricing.compareAtPriceFormatted || undefined,
            features: [],
            type: product.type,
            cta: product.cta,
            image: product.image_url,
            color: '#181818',
        } as unknown as Product);
    };

    return (
        <div className={`${styles.card} ${product.is_out_of_stock ? styles.outOfStockCard : ''}`}>
            {/* 1. IMAGE CONTAINER WITH 1/1 ASPECT RATIO */}
            <Link href={`/productos/${product.id}`} className={styles.imageLink} tabIndex={-1}>
                <div className={styles.imageWrapper}>
                    {/* OVERLAY BADGES */}
                    <ProductBadges
                        isOutOfStock={product.is_out_of_stock}
                        isLowStock={product.is_low_stock}
                        stockQuantity={product.stock_quantity}
                        discountPercentage={pricing.isOnSale ? pricing.discountPercentage : 0}
                        displayBadgeText={pricing.displayBadgeText}
                        isFeatured={product.is_featured}
                    />

                    {/* PRODUCT IMAGE */}
                    {product.image_url ? (
                        <Image
                            src={product.image_url}
                            alt={product.title}
                            fill
                            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            className={styles.productImg}
                            unoptimized
                        />
                    ) : (
                        <div className={styles.placeholderImg}>
                            {product.title.charAt(0)}
                        </div>
                    )}
                </div>
            </Link>

            {/* 2. CARD CONTENT & DETAILS */}
            <div className={styles.cardDetails}>
                {/* CATEGORY NAME (SECONDARY SMALL UPPERCASE) */}
                {product.category_name && (
                    <span className={styles.categoryName}>
                        {product.category_name}
                    </span>
                )}

                {/* PRODUCT TITLE (LINE CLAMP 2) */}
                <Link href={`/productos/${product.id}`} className={styles.titleLink}>
                    <h3 className={styles.productTitle} title={product.title}>
                        {product.title}
                    </h3>
                </Link>

                {/* VARIANTS / OPTIONS BADGE */}
                {product.has_variants && product.variant_count > 0 && (
                    <span className={styles.variantBadge}>
                        Disponible en {product.variant_count} opciones
                    </span>
                )}

                {/* PRICE SECTION */}
                <ProductPrice
                    price={pricing.currentPriceFormatted}
                    comparePrice={pricing.compareAtPriceFormatted || undefined}
                    discountPercentage={pricing.isOnSale ? pricing.discountPercentage : undefined}
                />

                {/* CTA BUTTON */}
                <div className={styles.ctaRow}>
                    {product.is_out_of_stock ? (
                        <Link href={`/productos/${product.id}`} className={styles.disabledBtn}>
                            Ver producto
                        </Link>
                    ) : product.has_variants ? (
                        <Link href={`/productos/${product.id}`} className={styles.optionsBtn}>
                            Ver opciones →
                        </Link>
                    ) : (
                        <button
                            onClick={handleAddToCart}
                            className={`${styles.cartBtn} ${isAddedToCart ? styles.addedBtn : ''}`}
                        >
                            {isAddedToCart ? '✓ En el carrito' : product.type === 'service' ? 'Cotizar servicio' : 'Agregar al carrito'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
