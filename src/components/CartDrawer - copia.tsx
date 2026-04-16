'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import styles from './CartDrawer.module.css';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
    const { items, isOpen, toggleCart, removeItem, total } = useCart();
    const router = useRouter();

    const handleCheckout = () => {
        toggleCart(); // Close drawer
        router.push('/checkout');
    };

    return (
        <>
            <div
                className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
                onClick={toggleCart}
            />
            <div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Tu Carrito ({items.length})</h2>
                    <button className={styles.closeBtn} onClick={toggleCart}>&times;</button>
                </div>

                <div className={styles.body}>
                    {items.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>Tu carrito está vacío.</p>
                            <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>Explora nuestra colección para empezar.</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.cartId} className={styles.cartItem}>
                                <div
                                    className={styles.itemImage}
                                    style={{ background: item.color }}
                                >
                                    {item.title.charAt(0)}
                                </div>
                                <div className={styles.itemInfo}>
                                    <div className={styles.itemTitle}>{item.title}</div>
                                    <div className={styles.itemPrice}>{item.price}</div>
                                </div>
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => removeItem(item.cartId)}
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className={styles.footer}>
                        <div className={styles.totalRow}>
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <button className={`btn-primary ${styles.checkoutBtn}`} onClick={handleCheckout}>
                            Proceder al Pago
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
