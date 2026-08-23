'use client';

import React from 'react';
import Image from 'next/image';
import { useCart, parseItemPrice } from '@/context/CartContext';
import { formatMoney } from '@/lib/money';
import styles from './CartDrawer.module.css';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
    const { items, isOpen, toggleCart, removeItem, updateQuantity, total, itemCount } = useCart();
    const router = useRouter();

    const handleCheckout = () => {
        toggleCart();
        router.push('/checkout');
    };

    return (
        <>
            <div
                className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
                onClick={toggleCart}
                aria-hidden="true"
            />
            <aside className={`${styles.drawer} ${isOpen ? styles.open : ''}`} aria-label="Carrito de compras">
                <div className={styles.header}>
                    <div className={styles.headerTitleRow}>
                        <span className={styles.headerIcon}>🛒</span>
                        <h2 className={styles.title}>Tu Carrito</h2>
                        <span className={styles.badgeCount}>{itemCount}</span>
                    </div>
                    <button
                        className={styles.closeBtn}
                        onClick={toggleCart}
                        aria-label="Cerrar carrito"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    {items.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🛍️</div>
                            <p className={styles.emptyTitle}>Tu carrito está vacío</p>
                            <p className={styles.emptySubtitle}>Agrega tus productos favoritos para empezar.</p>
                            <button onClick={toggleCart} className={styles.continueBtn}>
                                Explorar Tienda
                            </button>
                        </div>
                    ) : (
                        <div className={styles.itemsList}>
                            {items.map((item) => {
                                const unitPriceStr = item.selectedVariant?.price || item.price;
                                const unitPriceNum = parseItemPrice(unitPriceStr);
                                const itemSubtotal = unitPriceNum * (item.quantity || 1);

                                return (
                                    <div key={item.cartId} className={styles.cartItem}>
                                        <div className={styles.itemThumb}>
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.title}
                                                    width={56}
                                                    height={56}
                                                    style={{ objectFit: 'cover', borderRadius: '8px' }}
                                                />
                                            ) : (
                                                <div className={styles.itemColorPlaceholder} style={{ background: item.color || '#181818' }}>
                                                    {item.title.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.itemInfo}>
                                            <div className={styles.itemTitle}>{item.title}</div>
                                            {item.selectedVariant && (
                                                <div className={styles.variantBadge}>
                                                    {item.selectedVariant.name}
                                                </div>
                                            )}
                                            <div className={styles.itemMeta}>
                                                {formatMoney(itemSubtotal)}
                                            </div>
                                            <div className={styles.qtyContainer}>
                                                <button 
                                                    className={styles.qtyBtn} 
                                                    onClick={() => updateQuantity(item.cartId, -1)}
                                                    aria-label="Disminuir cantidad"
                                                    title="Disminuir cantidad"
                                                >
                                                    −
                                                </button>
                                                <span className={styles.qtyValue}>{item.quantity || 1}</span>
                                                <button 
                                                    className={styles.qtyBtn} 
                                                    onClick={() => updateQuantity(item.cartId, 1)}
                                                    aria-label="Aumentar cantidad"
                                                    title="Aumentar cantidad"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => removeItem(item.cartId)}
                                            title="Eliminar producto"
                                            aria-label={`Eliminar ${item.title}`}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className={styles.footer}>
                        <div className={styles.subtotalRow}>
                            <span className={styles.subtotalLabel}>Subtotal ({itemCount} {itemCount === 1 ? 'unidad' : 'unidades'})</span>
                            <span className={styles.subtotalValue}>{formatMoney(total)}</span>
                        </div>
                        <p className={styles.taxNote}>Impuestos y envío calculados al finalizar la compra.</p>

                        <div className={styles.actionButtonsRow}>
                            <button
                                className={styles.checkoutBtn}
                                onClick={handleCheckout}
                            >
                                FINALIZAR COMPRA →
                            </button>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}

