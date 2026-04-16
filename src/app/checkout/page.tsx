'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type PaymentMethod = 'card' | 'yape' | 'plin' | 'bcp' | 'bbva';

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
    const [isSuccess, setIsSuccess] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        cardName: '',
        cardNumber: '',
        exp: '',
        cvc: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const orderData = {
            id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            customer: formData.fullName,
            email: formData.email,
            items: items.map(i => ({ title: i.title, price: i.price })),
            total: total.toFixed(2),
            method: paymentMethod,
            date: new Date().toLocaleString('es-ES'),
            status: 'Completado'
        };

        // Simulate API call
        setTimeout(() => {
            // Save order to history
            const orders = JSON.parse(localStorage.getItem('admin_orders') || '[]');
            localStorage.setItem('admin_orders', JSON.stringify([orderData, ...orders]));

            // Add notification for admin
            const notifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
            const newNotif = {
                id: Date.now(),
                type: 'order',
                message: `Nueva compra de ${orderData.customer} por $${orderData.total}`,
                date: new Date().toLocaleTimeString(),
                read: false
            };
            localStorage.setItem('admin_notifications', JSON.stringify([newNotif, ...notifications]));

            setLoading(false);
            clearCart();
            setIsSuccess(true);
            toast.success('¡Pago procesado correctamente!');
            import('canvas-confetti').then((confetti) => confetti.default({ particleCount: 200, spread: 90, origin: { y: 0.6 } }));
        }, 1500);
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        const { error } = await supabase.auth.signUp({
            email: formData.email,
            password: password
        });

        setPasswordLoading(false);
        if (error) {
            toast.error("Error: " + error.message);
        } else {
            toast.success('¡Mágia! Tu cuenta ha sido asegurada.');
            router.push('/dashboard');
        }
    };

    if (isSuccess) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', paddingTop: '60px', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ background: 'var(--glass-bg)', padding: '50px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: 800 }}>¡Compra Exitosa!</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.05rem', lineHeight: '1.6' }}>
                        Te hemos enviado tu recibo y las instrucciones de acceso a <strong>{formData.email}</strong>.
                        <br/><br/>
                        Para ver tus compras ahora y a futuro, hemos pre-creado tu cuenta. Por favor elige una contraseña para terminar de asegurarla:
                    </p>
                    
                    <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '350px', margin: '0 auto' }}>
                        <input
                            type="password"
                            placeholder="Crea una contraseña segura"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                background: 'var(--background)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                color: 'var(--foreground)',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                        />
                        <button type="submit" disabled={passwordLoading} style={{
                            background: 'var(--card-bg)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--glass-border)',
                            padding: '14px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            cursor: passwordLoading ? 'not-allowed' : 'pointer',
                        }}>
                            {passwordLoading ? 'Asegurando...' : 'Guardar y Ver mis Compras'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px' }}>
                <h1 className={styles.title}>Tu carrito está vacío</h1>
                <button className="btn-primary" onClick={() => router.push('/')}>
                    Volver a la tienda
                </button>
            </div>
        );
    }

    const paymentOptions = [
        { id: 'card', name: 'Tarjeta', icon: '💳' },
        { id: 'yape', name: 'Yape', icon: '🟣' },
        { id: 'plin', name: 'Plin', icon: '🔵' },
        { id: 'bcp', name: 'BCP', icon: '🏦' },
        { id: 'bbva', name: 'BBVA', icon: '💎' },
    ];

    return (
        <div className={styles.container}>
            <button onClick={() => router.back()} className={styles.backButton}>
                &larr; Volver
            </button>
            <h1 className={styles.title}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#gradientLock)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                        <linearGradient id="gradientLock" x1="0" y1="0" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                    </defs>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Finalizar Compra
            </h1>

            <div className={styles.grid}>
                {/* Form Section */}
                <section className={styles.formSection}>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.sectionHeader}>Información Personal</div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombre de Facturación / Apodo</label>
                            <input
                                name="fullName"
                                className={styles.input}
                                required
                                onChange={handleChange}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Correo Electrónico (Aquí enviamos el producto)</label>
                            <input
                                name="email"
                                type="email"
                                className={styles.input}
                                required
                                onChange={handleChange}
                            />
                        </div>

                        {/* Payment Method Selector */}
                        <div className={styles.sectionHeader} style={{ marginTop: '40px' }}>Opciones de Pago</div>
                        <div className={styles.paymentMethodsGrid}>
                            {paymentOptions.map(option => (
                                <div
                                    key={option.id}
                                    className={`${styles.paymentMethodCard} ${paymentMethod === option.id ? styles.active : ''}`}
                                    onClick={() => setPaymentMethod(option.id as PaymentMethod)}
                                >
                                    <span className={styles.paymentIcon}>{option.icon}</span>
                                    <span className={styles.paymentName}>{option.name}</span>
                                </div>
                            ))}
                        </div>

                        {/* Dynamic Payment Content */}
                        {paymentMethod === 'card' ? (
                            <>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Nombre en la Tarjeta</label>
                                    <input
                                        name="cardName"
                                        className={styles.input}
                                        required
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Número de Tarjeta</label>
                                    <input
                                        name="cardNumber"
                                        className={styles.input}
                                        placeholder="0000 0000 0000 0000"
                                        required
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className={styles.row}>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.label}>Expiración (MM/YY)</label>
                                        <input
                                            name="exp"
                                            className={styles.input}
                                            placeholder="MM/YY"
                                            required
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.label}>CVC</label>
                                        <input
                                            name="cvc"
                                            className={styles.input}
                                            placeholder="123"
                                            required
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className={styles.paymentInstruction}>
                                <h4 style={{ marginBottom: '8px', color: 'white' }}>Instrucciones para {paymentOptions.find(p => p.id === paymentMethod)?.name}</h4>
                                {paymentMethod === 'yape' && <p>Yapea al número <strong>999-999-999</strong> (CodeMarket SAC) y envía la captura a pagos@codemarket.dev.</p>}
                                {paymentMethod === 'plin' && <p>Envía Plin al número <strong>999-999-999</strong> (CodeMarket SAC) y envía la captura a pagos@codemarket.dev.</p>}
                                {paymentMethod === 'bcp' && <p>Transferencia BCP: <strong>193-12345678-0-01</strong><br />CCI: 002-193-12345678001-12<br />Razón Social: CodeMarket SAC</p>}
                                {paymentMethod === 'bbva' && <p>Transferencia BBVA: <strong>0011-0123-98765432-10</strong><br />CCI: 011-123-9876543210-99<br />Razón Social: CodeMarket SAC</p>}

                                <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                                    <label className={styles.label}>Adjuntar Comprobante (Opcional)</label>
                                    <input type="file" className={styles.input} />
                                </div>
                            </div>
                        )}

                        <button type="submit" className={`btn-primary ${styles.payButton}`} disabled={loading}>
                            {loading ? 'Procesando...' : (paymentMethod === 'card' ? `Pagar $${total.toFixed(2)}` : 'Confirmar Pedido')}
                        </button>
                    </form>
                </section>

                {/* Summary Section */}
                <section className={styles.summarySection}>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryTitle}>Resumen del Pedido</div>

                        {items.map((item) => (
                            <div key={item.cartId} className={styles.summaryItem}>
                                <span>{item.title}</span>
                                <span>{item.price}</span>
                            </div>
                        ))}

                        <div className={styles.summaryItem} style={{ borderTop: '1px solid #333', paddingTop: '16px', marginTop: '16px' }}>
                            <span>Subtotal</span>
                            <span>${total.toFixed(2)}</span>
                        </div>

                        <div className={styles.totalRow}>
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>

                        <div style={{ marginTop: '24px', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
                            🔒 Transacción 100% segura y encriptada.
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
