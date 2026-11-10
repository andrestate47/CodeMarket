'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatMoney } from '@/lib/money';
import styles from './StickyMobileCartBar.module.css';

export default function StickyMobileCartBar() {
    const pathname = usePathname();
    const router = useRouter();
    const { itemCount, total, isOpen, toggleCart } = useCart();

    if (!pathname) return null;

    // Hide on admin, checkout, login, or confirmation routes
    const isExcluded =
        pathname.startsWith('/admin') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/checkout') ||
        pathname.startsWith('/pedido') ||
        pathname.startsWith('/login');

    if (isExcluded || itemCount === 0 || isOpen) {
        return null;
    }

    return (
        <div className={styles.stickyWrapper} role="region" aria-label="Resumen rápido del carrito">
            <div className={styles.bar}>
                <div className={styles.leftInfo} onClick={toggleCart}>
                    <div className={styles.bagBadge}>
                        <span>🛍️</span>
                        <span className={styles.countPill}>{itemCount}</span>
                    </div>
                    <div className={styles.totalsText}>
                        <span className={styles.subLabel}>
                            {itemCount} {itemCount === 1 ? 'producto' : 'productos'} en tu bolsa
                        </span>
                        <span className={styles.totalAmount}>{formatMoney(total)}</span>
                    </div>
                </div>

                <div className={styles.actionsGroup}>
                    <button
                        type="button"
                        onClick={toggleCart}
                        className={styles.viewCartBtn}
                    >
                        Ver bolsa
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push('/checkout')}
                        className={styles.checkoutBtn}
                    >
                        Finalizar compra →
                    </button>
                </div>
            </div>
        </div>
    );
}
