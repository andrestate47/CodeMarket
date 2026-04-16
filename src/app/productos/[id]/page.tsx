'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { products } from '@/data/products';
import { useCart } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import styles from './ProductPage.module.css';

// Parses **text** into colored highlights and \n\n into paragraph breaks
function RichText({ text }: { text: string }) {
    const paragraphs = text.split('\n\n');
    return (
        <>
            {paragraphs.map((para, pIndex) => {
                const parts = para.split(/\*\*(.*?)\*\*/g);
                return (
                    <p key={pIndex} className={styles.richParagraph}>
                        {parts.map((part, i) =>
                            i % 2 === 1 ? (
                                <span key={i} className={styles.highlight}>{part}</span>
                            ) : (
                                part
                            )
                        )}
                    </p>
                );
            })}
        </>
    );
}

// ─── Reviews Section ───────────────────────────────────────────────
interface Review {
    id: string;
    name: string;
    rating: number;
    comment: string;
    date: string;
}

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
    const [hovered, setHovered] = React.useState(0);
    return (
        <div style={{ display: 'flex', gap: '4px', cursor: onChange ? 'pointer' : 'default' }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    style={{
                        fontSize: '1.4rem',
                        color: star <= (hovered || rating) ? '#facc15' : '#d1d5db',
                        transition: 'color 0.15s',
                    }}
                    onMouseEnter={() => onChange && setHovered(star)}
                    onMouseLeave={() => onChange && setHovered(0)}
                    onClick={() => onChange && onChange(star)}
                >
                    ★
                </span>
            ))}
        </div>
    );
}

function ReviewSection({ productId }: { productId: string }) {
    const key = `reviews_${productId}`;
    const pendingKey = `reviews_pending_${productId}`;
    const [reviews, setReviews] = React.useState<Review[]>([]);
    const [name, setName] = React.useState('');
    const [rating, setRating] = React.useState(5);
    const [comment, setComment] = React.useState('');
    const [submitted, setSubmitted] = React.useState(false);

    React.useEffect(() => {
        const stored = localStorage.getItem(key);
        if (stored) setReviews(JSON.parse(stored));
    }, [key]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !comment.trim()) return;
        const newReview: Review = {
            id: Date.now().toString(),
            name: name.trim(),
            rating,
            comment: comment.trim(),
            date: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
        };
        // Save to PENDING — admin must approve before it goes public
        const existing = JSON.parse(localStorage.getItem(pendingKey) || '[]');
        localStorage.setItem(pendingKey, JSON.stringify([newReview, ...existing]));

        // Add notification for admin
        const notifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
        const newNotif = {
            id: Date.now(),
            type: 'review',
            message: `Nueva reseña pendiente de ${newReview.name}`,
            date: new Date().toLocaleTimeString(),
            read: false
        };
        localStorage.setItem('admin_notifications', JSON.stringify([newNotif, ...notifications]));

        setName('');
        setComment('');
        setSubmitted(true);
        if (rating === 5) {
            try {
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#facc15', '#ef4444', '#f97316'], zIndex: 99999 });
            } catch (err) {
                console.error("Confetti error:", err);
            }
            toast.success("¡Gracias por tu súper reseña!");
        } else {
            toast.success("Reseña enviada para validación");
        }
        setRating(5);
        setTimeout(() => setSubmitted(false), 3000);
    };

    const avgRating = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>⭐ Opiniones</h2>
                {avgRating && (
                    <span style={{ fontSize: '1rem', color: '#facc15', fontWeight: 700 }}>
                        {avgRating} / 5 &nbsp;<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})</span>
                    </span>
                )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Deja tu opinión</h3>
                <input
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    style={{
                        background: 'var(--background)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: 'var(--foreground)',
                        fontSize: '0.95rem',
                        outline: 'none',
                    }}
                />
                <StarRating rating={rating} onChange={setRating} />
                <textarea
                    placeholder="Cuéntanos tu experiencia con este producto..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    required
                    rows={3}
                    style={{
                        background: 'var(--background)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: 'var(--foreground)',
                        fontSize: '0.95rem',
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'inherit',
                    }}
                />
                <button type="submit" style={{
                    background: 'var(--foreground)',
                    color: 'var(--background)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    alignSelf: 'flex-start',
                }}>
                    {submitted ? '✓ ¡Gracias!' : 'Publicar reseña'}
                </button>
            </form>

            {/* Reviews list */}
            {reviews.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
                    Sé el primero en opinar sobre este producto 🙌
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviews.map(r => (
                        <div key={r.id} style={{
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            padding: '20px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.name}</span>
                                    <StarRating rating={r.rating} />
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.date}</span>
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>{r.comment}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
// ──────────────────────────────────────────────────────────────────────

export default function ProductPage() {
    const params = useParams();
    const router = useRouter();
    const { addItem, items } = useCart();
    
    const id = params.id as string;
    const product = products.find(p => p.id === id);

    if (!product) {
        return (
            <main className={styles.container}>
                <Navbar />
                <div className={styles.notFound}>
                    <h1>Producto no encontrado</h1>
                    <button onClick={() => router.push('/')} className={styles.backButton}>Volver al inicio</button>
                </div>
            </main>
        );
    }

    const [couponInput, setCouponInput] = React.useState('');
    const [appliedDiscount, setAppliedDiscount] = React.useState(0);
    const [couponMessage, setCouponMessage] = React.useState<{type: 'success' | 'error', text: string} | null>(null);
    const [timeLeft, setTimeLeft] = React.useState({ hours: 14, minutes: 28, seconds: 59 });
    const [viewers, setViewers] = useState(0);

    useEffect(() => {
        setViewers(Math.floor(Math.random() * 7) + 2);
    }, []);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { hours, minutes, seconds } = prev;
                if (seconds > 0) {
                    seconds--;
                } else {
                    seconds = 59;
                    if (minutes > 0) {
                        minutes--;
                    } else {
                        minutes = 59;
                        if (hours > 0) {
                            hours--;
                        } else {
                            hours = 23;
                        }
                    }
                }
                return { hours, minutes, seconds };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleApplyCoupon = () => {
        const validCoupons: Record<string, number> = { 
            'PROMO10': 0.10, 
            'DESC20': 0.20, 
            'MITAD50': 0.50,
            'CODEMARKET': 0.15
        };
        const upperCoupon = couponInput.trim().toUpperCase();
        if (validCoupons[upperCoupon]) {
            setAppliedDiscount(validCoupons[upperCoupon]);
            setCouponMessage({ type: 'success', text: `Cupón ${upperCoupon} aplicado (-${validCoupons[upperCoupon] * 100}%)` });
            toast.success(`Cupón ${upperCoupon} aplicado correctamente`);
        } else if (upperCoupon) {
            setAppliedDiscount(0);
            setCouponMessage({ type: 'error', text: 'Cupón no válido o expirado' });
            toast.error('Cupón no válido o expirado');
        } else {
            setAppliedDiscount(0);
            setCouponMessage(null);
        }
    };

    const originalPriceVal = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    const finalPriceVal = originalPriceVal * (1 - appliedDiscount);
    const finalPriceStr = `$${finalPriceVal.toFixed(2)}`;

    const productToCart = {
        ...product,
        price: finalPriceStr,
    };

    const isInCart = items.some(item => item.id === product.id);

    const [cartMessage, setCartMessage] = React.useState<string | null>(null);

    const handleAddToCart = () => {
        if (isInCart) {
            setCartMessage('Este producto digital ya ha sido elegido y está en tu carrito.');
            setTimeout(() => setCartMessage(null), 3500);
            toast.warning('Este producto ya está en tu carrito');
            return;
        }
        addItem(productToCart);
        toast.success(`Añadido al carrito: ${product.title}`);
        try {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 99999 });
        } catch (err) {
            console.error("Confetti error (Add to cart):", err);
        }
    };

    const handleBuyNow = () => {
        if (product.type === 'service') {
            window.location.href = 'mailto:hello@codemarket.dev?subject=Consulta%20Proyecto';
        } else {
            if (!isInCart) {
                addItem(productToCart);
            }
            try {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 99999 });
            } catch (err) {
                console.error("Confetti error (Buy now):", err);
            }
            setTimeout(() => router.push('/checkout'), 800); // 800ms delay to let user see confetti
        }
    };

    return (
        <main className={styles.main}>
            <Navbar />
            
            <div className={`container ${styles.content}`}>
                <nav className={styles.breadcrumb}>
                    <button onClick={() => router.push('/')} className={styles.breadcrumbLink}>Inicio</button>
                    <span className={styles.breadcrumbSeparator}>/</span>
                    <span className={styles.breadcrumbLink}>{product.category}</span>
                    <span className={styles.breadcrumbSeparator}>/</span>
                    <span className={styles.breadcrumbCurrent}>{product.title}</span>
                </nav>

                <div className={styles.grid}>
                    {/* Visual Section */}
                    <div className={styles.visualColumn}>
                        <div 
                            className={styles.imageWrapper}
                            style={{ background: product.color }}
                        >
                            {product.image ? (
                                <img src={product.image} alt={product.title} className={styles.productImg} />
                            ) : (
                                <span className={styles.placeholderLogo}>{product.title.charAt(0)}</span>
                            )}
                        </div>
                        
                        <div className={styles.gallery}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={styles.galleryItem} style={{ background: product.color, opacity: i === 1 ? 1 : 0.4 }}>
                                    {product.image && <img src={product.image} alt="thumbnail" className={styles.galleryImg} />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className={styles.infoColumn}>
                        <div className={styles.vendorBadge}>Vendido por CodeMarket</div>
                        <h1 className={styles.title} style={{ marginBottom: '8px' }}>{product.title}</h1>
                        
                        <style>{`
                            @keyframes liveBlink {
                                0%, 100% { opacity: 1; }
                                50% { opacity: 0.2; }
                            }
                        `}</style>
                        {/* Social Proof */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '0.9rem', color: '#f97316', fontWeight: 600 }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'liveBlink 1.2s ease-in-out infinite' }}></div>
                            🔥 {viewers} personas están viendo este producto
                        </div>
                        
                        <div className={styles.priceContainer}>
                            <span className={styles.price}>{finalPriceStr}</span>
                            {(appliedDiscount > 0 || product.comparePrice) && (() => {
                                const originalStr = appliedDiscount > 0 ? product.price : product.comparePrice!;
                                const original = parseFloat(originalStr.replace(/[^0-9.]/g, ''));
                                const pct = Math.round((1 - finalPriceVal / original) * 100);
                                return (
                                    <>
                                        <span className={styles.comparePrice}>{originalStr}</span>
                                        <span className={styles.saleBadge}>Oferta</span>
                                        <span className={styles.savingsBadge}>−{pct}% OFF</span>
                                    </>
                                );
                            })()}
                        </div>
                        
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '300px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    type="text" 
                                    placeholder="Ingresa tu cupón" 
                                    value={couponInput}
                                    onChange={(e) => setCouponInput(e.target.value)}
                                    style={{
                                        flex: 1,
                                        background: 'var(--background)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        padding: '10px 14px',
                                        color: 'var(--foreground)',
                                        outline: 'none',
                                        textTransform: 'uppercase',
                                        fontSize: '0.95rem'
                                    }}
                                />
                                <button 
                                    onClick={handleApplyCoupon}
                                    style={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'var(--foreground)',
                                        borderRadius: '8px',
                                        padding: '0 16px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    Aplicar
                                </button>
                            </div>
                            {couponMessage && (
                                <span style={{ fontSize: '0.85rem', color: couponMessage.type === 'success' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                                    {couponMessage.text}
                                </span>
                            )}
                        </div>
                        
                        <style>{`
                            @keyframes gradientShift {
                                0% { background-position: 0% 50%; }
                                50% { background-position: 100% 50%; }
                                100% { background-position: 0% 50%; }
                            }
                            @keyframes pulseBlink {
                                0%, 100% { transform: scale(1); }
                                50% { transform: scale(1.02); }
                            }
                        `}</style>
                        <div style={{
                            marginTop: '20px',
                            marginBottom: '16px',
                            background: 'linear-gradient(270deg, #ef4444, #f97316, #ef4444)',
                            backgroundSize: '200% 200%',
                            animation: 'gradientShift 3s ease infinite, pulseBlink 2.5s infinite',
                            color: 'white',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                ¡Por tiempo limitado! Termina en:
                            </span>
                            <span style={{
                                background: 'rgba(0,0,0,0.3)',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '1.05rem',
                                letterSpacing: '1px'
                            }}>
                                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                            </span>
                        </div>
                        
                        <p className={styles.taxInfo}>
                            📨 <strong>Entrega automática.</strong> Al completar tu compra, recibirás de inmediato un correo oficial con todos los detalles y el acceso seguro a tu plataforma.
                        </p>

                        <div className={styles.divider}></div>

                        <div className={styles.actions}>
                            {product.type === 'service' ? (
                                <button className={styles.buyButton} onClick={handleBuyNow}>
                                    Cotizar Proyecto
                                </button>
                            ) : (
                                <>
                                    <button
                                        className={`${styles.buyButton} ${isInCart ? styles.addedBtn : ''}`}
                                        onClick={handleAddToCart}
                                    >
                                        {isInCart ? '✓ Añadido al carrito' : '🛒 Añadir al carrito'}
                                    </button>
                                    <button className={styles.dynamicCheckoutBtn} onClick={handleBuyNow}>
                                        Comprar ahora
                                    </button>
                                </>
                            )}
                        </div>
                        {cartMessage && (
                            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.3s ease' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                {cartMessage}
                            </div>
                        )}

                        <div className={styles.trustBadges}>
                            <div className={styles.trustBadge}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                <span style={{ color: '#FFD700' }}>Pago seguro</span>
                            </div>
                            <div className={styles.trustBadge}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg>
                                <span style={{ color: '#22c55e' }}>Garantía 30 días</span>
                            </div>
                            <div className={styles.trustBadge}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"></rect><path d="M16 8h4l3 5v3h-7V8z"></path><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                                <span style={{ color: '#f97316' }}>Entrega 5 días</span>
                            </div>
                        </div>

                        <div className={styles.accordionContainer}>
                            <div className={styles.description}>
                                <h3 className={styles.accordionTitle}>Descripción</h3>
                                <div className={styles.richTextContainer}>
                                    <RichText text={product.longDescription || product.description} />
                                </div>
                            </div>

                            <div className={styles.features}>
                                <h3 className={styles.accordionTitle}>Características clave</h3>
                                <ul className={styles.featureList}>
                                    {product.features.map((feature, index) => (
                                        <li key={index}>
                                            <span className={styles.bullet}></span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products Cross-Selling */}
                <div style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid var(--glass-border)' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px' }}>
                        También te podría <span className="text-gradient">interesar</span>
                    </h2>
                    <div className={styles.grid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                        {products.filter(p => p.id !== id).slice(0, 4).map(p => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </div>
            </div>

            <ReviewSection productId={id} />

            <footer className={styles.footer}>
                <div className="container">
                   <p>© 2026 CodeMarket. All rights reserved.</p>
                </div>
            </footer>
        </main>
    );
}
