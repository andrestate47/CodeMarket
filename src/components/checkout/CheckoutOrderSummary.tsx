'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart, parseItemPrice } from '@/context/CartContext';
import { formatMoney } from '@/lib/money';
import styles from './CheckoutOrderSummary.module.css';

interface CheckoutOrderSummaryProps {
    shippingCostAmount: number; // in cents
    currency?: string;
    couponCode?: string;
    discountAmount?: number; // in cents
}

export default function CheckoutOrderSummary({
    shippingCostAmount,
    currency = 'PEN',
    couponCode,
    discountAmount = 0
}: CheckoutOrderSummaryProps) {
    const { items, total, itemCount, toggleCart } = useCart();
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);

    const subtotalCents = Math.round(total * 100);
    const finalTotalCents = Math.max(0, subtotalCents + shippingCostAmount - discountAmount);

    return (
        <div>
            {/* Mobile Expandable Toggle Bar */}
            <button
                type="button"
                className={styles.mobileAccordionToggle}
                onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                aria-expanded={isMobileExpanded}
            >
                <span>
                    🛒 Tu Pedido ({itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}) {isMobileExpanded ? '▲' : '▼'}
                </span>
                <span className={styles.mobileTotalLabel}>
                    {formatMoney(finalTotalCents / 100, currency)}
                </span>
            </button>

            {/* Main Summary Card (Sticky in Desktop, Collapsible in Mobile) */}
            <div className={`${styles.summaryCard} ${!isMobileExpanded ? styles.collapsed : ''}`}>
                <div className={styles.headerRow}>
                    <h3 className={styles.title}>Resumen del Pedido</h3>
                    <button
                        type="button"
                        onClick={toggleCart}
                        className={styles.editCartBtn}
                    >
                        Editar Carrito
                    </button>
                </div>

                <div className={styles.itemsList}>
                    {items.map((item) => {
                        const unitPriceStr = item.selectedVariant?.price || item.price;
                        const unitPriceNum = parseItemPrice(unitPriceStr);
                        const itemSubtotal = unitPriceNum * (item.quantity || 1);

                        return (
                            <div key={item.cartId} className={styles.itemRow}>
                                <div className={styles.itemThumb}>
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className={styles.thumbImg}
                                        />
                                    ) : (
                                        <div
                                            className={styles.colorPlaceholder}
                                            style={{ background: item.color || '#18181b' }}
                                        >
                                            {item.title.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.itemDetails}>
                                    <h4 className={styles.itemTitle}>{item.title}</h4>
                                    <div className={styles.itemMeta}>
                                        <span>Cant: <strong>{item.quantity || 1}</strong></span>
                                        {item.selectedVariant && (
                                            <span className={styles.variantTag}>
                                                {item.selectedVariant.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.itemPrice}>
                                    {formatMoney(itemSubtotal, currency)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.breakdown}>
                    <div className={styles.breakdownRow}>
                        <span>Subtotal</span>
                        <span>{formatMoney(total, currency)}</span>
                    </div>

                    {discountAmount > 0 && (
                        <div className={`${styles.breakdownRow} ${styles.discountRow}`}>
                            <span>Descuento {couponCode ? `(${couponCode})` : ''}</span>
                            <span>-{formatMoney(discountAmount / 100, currency)}</span>
                        </div>
                    )}

                    <div className={styles.breakdownRow}>
                        <span>Envío</span>
                        <span>
                            {shippingCostAmount === 0
                                ? 'Gratis'
                                : formatMoney(shippingCostAmount / 100, currency)}
                        </span>
                    </div>

                    <div className={`${styles.breakdownRow} ${styles.totalRow}`}>
                        <span>TOTAL</span>
                        <span className={styles.totalAmount}>
                            {formatMoney(finalTotalCents / 100, currency)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
