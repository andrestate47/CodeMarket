'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PublicProductItem } from '@/modules/catalog/publicActions';
import { useCart } from '@/context/CartContext';
import { Product } from '@/data/products';
import { getProductPricing } from '@/lib/pricing';
import { fireAddToCartConfetti } from '@/lib/confetti';
import styles from './ProductQuickSheet.module.css';

interface ProductQuickSheetProps {
    product: PublicProductItem | null;
    isOpen: boolean;
    onClose: () => void;
    whatsappPhone?: string;
    storeName?: string;
}

export default function ProductQuickSheet({
    product,
    isOpen,
    onClose,
    whatsappPhone = '+51900000000',
    storeName = 'TiendaVirt',
}: ProductQuickSheetProps) {
    const { addItem } = useCart();
    const router = useRouter();

    const [quantity, setQuantity] = useState(1);
    const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

    useEffect(() => {
        if (product) {
            setQuantity(1);
            setSelectedVariantIdx(0);
        }
    }, [product]);

    if (!product) return null;

    const pricing = getProductPricing(product);
    const variants = product.variants && product.variants.length > 0 ? product.variants : [];
    const currentVariant = variants[selectedVariantIdx] || null;
    const displayPrice = currentVariant?.price || pricing.currentPriceFormatted;

    const buildCartProduct = (): Product => ({
        id: product.id,
        title: product.title,
        category: product.category_name || 'General',
        description: product.description,
        price: displayPrice,
        comparePrice: pricing.compareAtPriceFormatted || undefined,
        features: [],
        type: product.type,
        cta: product.cta,
        image: product.image_url,
        color: '#181818',
    } as unknown as Product);

    const handleAddToCart = (e: React.MouseEvent) => {
        if (product.is_out_of_stock) return;
        addItem(
            buildCartProduct(),
            quantity,
            currentVariant ? { id: currentVariant.id, name: currentVariant.name, price: currentVariant.price } : undefined,
            { silent: true }
        );
        fireAddToCartConfetti(e);
        toast.success(`¡${product.title} agregado al carrito!`);
        onClose();
    };

    const handleBuyNow = () => {
        if (product.is_out_of_stock) return;
        addItem(
            buildCartProduct(),
            quantity,
            currentVariant ? { id: currentVariant.id, name: currentVariant.name, price: currentVariant.price } : undefined,
            { silent: true }
        );
        onClose();
        router.push('/checkout');
    };

    const cleanPhone = whatsappPhone.replace(/[^0-9]/g, '') || '51900000000';
    const waText = `Hola *${storeName}*, vi este producto en su tienda y deseo comprarlo:\n\n` +
        `🛍️ *Producto:* ${product.title}\n` +
        (currentVariant ? `✨ *Opción:* ${currentVariant.name}\n` : '') +
        `🔢 *Cantidad:* ${quantity}\n` +
        `💵 *Precio unitario:* ${displayPrice}\n\n` +
        `¿Me ayudan a coordinar el pago y envío?`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;

    return (
        <>
            <div
                className={`${styles.backdrop} ${isOpen ? styles.open : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={`${styles.sheet} ${isOpen ? styles.open : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label={product.title}
            >
                <div className={styles.handleBarWrapper} onClick={onClose}>
                    <div className={styles.handleBar} />
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Cerrar vista rápida"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.content}>
                    {/* CABECERA COMPACTA DEL PRODUCTO */}
                    <div className={styles.topProductRow}>
                        <div className={styles.imageBox}>
                            {product.image_url ? (
                                <Image
                                    src={product.image_url}
                                    alt={product.title}
                                    fill
                                    className={styles.productImg}
                                    unoptimized
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.8rem' }}>
                                    {product.title.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div className={styles.infoBox}>
                            {product.category_name && (
                                <span className={styles.categoryBadge}>{product.category_name}</span>
                            )}
                            <h3 className={styles.title}>{product.title}</h3>
                            <div className={styles.priceRow}>
                                <span className={styles.currentPrice}>{displayPrice}</span>
                                {pricing.isOnSale && pricing.compareAtPriceFormatted && (
                                    <span className={styles.comparePrice}>{pricing.compareAtPriceFormatted}</span>
                                )}
                                {pricing.isOnSale && pricing.discountPercentage > 0 && (
                                    <span className={styles.discountTag}>-{pricing.discountPercentage}%</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DESCRIPCIÓN BREVE */}
                    {product.description && (
                        <p className={styles.description}>{product.description}</p>
                    )}

                    {/* SELECTOR DE VARIANTES SI TIENE */}
                    {variants.length > 0 && (
                        <div>
                            <span className={styles.sectionLabel}>Selecciona una opción:</span>
                            <div className={styles.variantsGrid}>
                                {variants.map((v, idx) => (
                                    <button
                                        key={v.id || idx}
                                        type="button"
                                        onClick={() => setSelectedVariantIdx(idx)}
                                        className={`${styles.variantPill} ${selectedVariantIdx === idx ? styles.variantPillActive : ''}`}
                                    >
                                        {v.name} {v.price ? `· ${v.price}` : ''}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CANTIDAD Y STOCK */}
                    <div className={styles.qtyAndStockRow}>
                        <div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--foreground)' }}>
                                Cantidad
                            </div>
                            <div style={{ fontSize: '0.75rem', color: product.is_out_of_stock ? '#ef4444' : '#16a34a', fontWeight: 700 }}>
                                {product.is_out_of_stock
                                    ? 'Agotado temporalmente'
                                    : product.is_low_stock
                                    ? `¡Últimas ${product.stock_quantity} unidades!`
                                    : '✓ En stock para envío inmediato'}
                            </div>
                        </div>

                        <div className={styles.qtyControls}>
                            <button
                                type="button"
                                className={styles.qtyBtn}
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            >
                                −
                            </button>
                            <span className={styles.qtyValue}>{quantity}</span>
                            <button
                                type="button"
                                className={styles.qtyBtn}
                                onClick={() => setQuantity(q => q + 1)}
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* BOTONES DE ACCIÓN SOCIAL COMMERCE */}
                <div className={styles.actionsFooter}>
                    <div className={styles.primaryActionsRow}>
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={product.is_out_of_stock}
                            className={styles.addCartBtn}
                        >
                            + Al Carrito
                        </button>
                        <button
                            type="button"
                            onClick={handleBuyNow}
                            disabled={product.is_out_of_stock}
                            className={styles.buyNowBtn}
                        >
                            Comprar Ahora →
                        </button>
                    </div>

                    <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.whatsappDirectBtn}
                    >
                        <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="16" fill="#25D366" />
                            <path d="M23.5 8.5C21.5 6.5 18.8 5.4 16 5.4C10.1 5.4 5.4 10.1 5.4 16C5.4 17.9 5.9 19.7 6.8 21.3L5.4 26.6L10.8 25.2C12.3 26 14.1 26.5 16 26.5C21.9 26.5 26.6 21.8 26.6 15.9C26.6 13.1 25.5 10.5 23.5 8.5ZM16 24.7C14.4 24.7 12.8 24.3 11.5 23.5L11.2 23.3L7.9 24.2L8.8 21L8.5 20.6C7.6 19.2 7.2 17.6 7.2 16C7.2 11.1 11.1 7.2 16 7.2C18.4 7.2 20.6 8.1 22.3 9.8C24 11.5 24.9 13.7 24.9 16.1C24.8 20.9 20.9 24.7 16 24.7ZM20.9 18.7C20.6 18.5 19.3 17.9 19 17.8C18.8 17.7 18.6 17.7 18.5 17.9C18.3 18.2 17.8 18.7 17.7 18.9C17.5 19.1 17.4 19.1 17.1 19C16.8 18.8 15.8 18.5 14.7 17.5C13.8 16.7 13.2 15.7 13 15.4C12.8 15.1 13 15 13.1 14.8C13.2 14.7 13.4 14.5 13.5 14.4C13.6 14.2 13.7 14.1 13.7 14C13.8 13.8 13.8 13.7 13.7 13.6C13.6 13.5 13.1 12.3 12.9 11.8C12.7 11.3 12.5 11.4 12.4 11.4H11.9C11.7 11.4 11.5 11.5 11.3 11.7C11.1 11.9 10.5 12.5 10.5 13.7C10.5 14.9 11.4 16.1 11.5 16.2C11.6 16.4 13.2 18.8 15.7 19.9C17.8 20.8 18.2 20.6 18.7 20.6C19.2 20.5 20.2 20 20.4 19.4C20.6 18.8 20.6 18.3 20.5 18.2C20.5 18.8 21.2 18.8 20.9 18.7Z" fill="white" />
                        </svg>
                        <span>Comprar por WhatsApp</span>
                    </a>
                </div>
            </div>
        </>
    );
}

