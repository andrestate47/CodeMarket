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
                            <a
                                href={`https://wa.me/51900000000?text=${encodeURIComponent(
                                    `Hola, deseo realizar este pedido de mi carrito:\n\n` +
                                    items.map(i => `• ${i.quantity || 1}x ${i.title}${i.selectedVariant ? ` (${i.selectedVariant.name})` : ''} — ${i.selectedVariant?.price || i.price}`).join('\n') +
                                    `\n\n*Total estimado:* ${formatMoney(total)}\n\n¿Me ayudan a finalizar la compra?`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.whatsappCartBtn}
                            >
                                <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="16" cy="16" r="16" fill="#25D366" />
                                    <path d="M23.5 8.5C21.5 6.5 18.8 5.4 16 5.4C10.1 5.4 5.4 10.1 5.4 16C5.4 17.9 5.9 19.7 6.8 21.3L5.4 26.6L10.8 25.2C12.3 26 14.1 26.5 16 26.5C21.9 26.5 26.6 21.8 26.6 15.9C26.6 13.1 25.5 10.5 23.5 8.5ZM16 24.7C14.4 24.7 12.8 24.3 11.5 23.5L11.2 23.3L7.9 24.2L8.8 21L8.5 20.6C7.6 19.2 7.2 17.6 7.2 16C7.2 11.1 11.1 7.2 16 7.2C18.4 7.2 20.6 8.1 22.3 9.8C24 11.5 24.9 13.7 24.9 16.1C24.8 20.9 20.9 24.7 16 24.7ZM20.9 18.7C20.6 18.5 19.3 17.9 19 17.8C18.8 17.7 18.6 17.7 18.5 17.9C18.3 18.2 17.8 18.7 17.7 18.9C17.5 19.1 17.4 19.1 17.1 19C16.8 18.8 15.8 18.5 14.7 17.5C13.8 16.7 13.2 15.7 13 15.4C12.8 15.1 13 15 13.1 14.8C13.2 14.7 13.4 14.5 13.5 14.4C13.6 14.2 13.7 14.1 13.7 14C13.8 13.8 13.8 13.7 13.7 13.6C13.6 13.5 13.1 12.3 12.9 11.8C12.7 11.3 12.5 11.4 12.4 11.4H11.9C11.7 11.4 11.5 11.5 11.3 11.7C11.1 11.9 10.5 12.5 10.5 13.7C10.5 14.9 11.4 16.1 11.5 16.2C11.6 16.4 13.2 18.8 15.7 19.9C17.8 20.8 18.2 20.6 18.7 20.6C19.2 20.5 20.2 20 20.4 19.4C20.6 18.8 20.6 18.3 20.5 18.2C20.5 18.8 21.2 18.8 20.9 18.7Z" fill="white" />
                                </svg>
                                <span>Comprar por WhatsApp</span>
                            </a>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}

