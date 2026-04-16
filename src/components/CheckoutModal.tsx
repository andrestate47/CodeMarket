'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './CheckoutModal.module.css';
import { Product } from '@/data/products';

interface CheckoutModalProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
}

export default function CheckoutModal({ product, isOpen, onClose }: CheckoutModalProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Prevent scrolling when modal is open
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate payment processing
        setTimeout(() => {
            setLoading(false);
            alert('¡Pago exitoso! Te hemos enviado el acceso a tu email.');
            onClose();
        }, 1500);
    };

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Finalizar Compra</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>

                <div className={styles.productSummary}>
                    <div className={styles.productName}>{product.title}</div>
                    <div className={styles.productPrice}>{product.price}</div>
                </div>

                <form onSubmit={handlePay}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email para recibir el producto</label>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="tu@email.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Detalles de Tarjeta (Simulado)</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="0000 0000 0000 0000"
                            disabled
                            style={{ cursor: 'not-allowed', opacity: 0.7 }}
                        />
                    </div>

                    <button type="submit" className={`btn-primary ${styles.payButton}`} disabled={loading}>
                        {loading ? 'Procesando...' : `Pagar ${product.price}`}
                    </button>
                </form>

                <div className={styles.secureIcon}>
                    🔒 Pago seguro con SSL de 256-bits (Simulado)
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
