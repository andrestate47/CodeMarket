'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CategoryRecord } from '@/modules/categories/actions';
import { PublicProductItem } from '@/modules/catalog/publicActions';
import { useCart } from '@/context/CartContext';
import { getProductPricing } from '@/lib/pricing';
import ProductQuickSheet from './ProductQuickSheet';
import styles from './SocialMiniStore.module.css';

interface SocialMiniStoreProps {
    storeName: string;
    storeBio?: string;
    logoUrl?: string;
    bannerUrl?: string;
    whatsappPhone?: string;
    categories: CategoryRecord[];
    initialProducts: PublicProductItem[];
}

export default function SocialMiniStore({
    storeName,
    storeBio = 'Tienda oficial en TiendaVirt · Compra directo sin salir de tu chat con envío rápido y seguro.',
    logoUrl = '/LogoTienda.png',
    bannerUrl,
    whatsappPhone = '+51 900 000 000',
    categories,
    initialProducts,
}: SocialMiniStoreProps) {
    const searchParams = useSearchParams();
    const { items, itemCount, toggleCart } = useCart();

    const fromParam = searchParams.get('from'); // 'wa' | 'ig' | null
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedProduct, setSelectedProduct] = useState<PublicProductItem | null>(null);

    const filteredProducts = useMemo(() => {
        return initialProducts.filter(p => {
            // 1. Category filter
            if (activeCategory === 'ofertas') {
                const isOffer = (p.discount_percentage && p.discount_percentage > 0) || p.is_featured;
                if (!isOffer) return false;
            } else if (activeCategory !== 'all') {
                const matchCat =
                    p.category_slug === activeCategory ||
                    p.category_id === activeCategory ||
                    p.category_name?.toLowerCase() === activeCategory.toLowerCase();
                if (!matchCat) return false;
            }

            // 2. Search filter
            if (searchQuery.trim() !== '') {
                const q = searchQuery.trim().toLowerCase();
                const inTitle = p.title.toLowerCase().includes(q);
                const inDesc = (p.description || '').toLowerCase().includes(q);
                const inCat = (p.category_name || '').toLowerCase().includes(q);
                if (!inTitle && !inDesc && !inCat) return false;
            }

            return true;
        });
    }, [initialProducts, activeCategory, searchQuery]);

    const cleanWaPhone = whatsappPhone.replace(/[^0-9]/g, '') || '51900000000';
    const directWaUrl = `https://wa.me/${cleanWaPhone}?text=${encodeURIComponent(`Hola *${storeName}*, estoy viendo su catálogo en TiendaVirt y tengo una consulta.`)}`;

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.mobileViewportContainer}>
                {/* BARRA DE CONTEXTO IN-APP BROWSER (SI VIENE DESDE WHATSAPP O INSTAGRAM) */}
                {(fromParam === 'wa' || fromParam === 'ig') && (
                    <div className={`${styles.inAppBrowserBar} ${fromParam === 'ig' ? styles.inAppBrowserBarIg : ''}`}>
                        <div className={styles.inAppLeft}>
                            <Link href="/" className={styles.inAppClose} title="Ver tienda completa">
                                ✕
                            </Link>
                            <div className={styles.inAppTitleCol}>
                                <span className={styles.inAppStoreTitle}>{storeName} · TiendaVirt</span>
                                <span className={styles.inAppUrl}>
                                    🔒 Compra segura integrada en {fromParam === 'ig' ? 'Instagram' : 'WhatsApp'}
                                </span>
                            </div>
                        </div>
                        <span className={styles.inAppBadge}>
                            {fromParam === 'ig' ? '📸 Instagram Shop' : '💬 WhatsApp Shop'}
                        </span>
                    </div>
                )}

                {/* 1. BANNER COMPACTO DE LA TIENDA */}
                <div className={styles.heroBanner}>
                    {bannerUrl && (
                        <Image
                            src={bannerUrl}
                            alt={storeName}
                            fill
                            className={styles.heroBannerImg}
                            unoptimized
                        />
                    )}
                    <div className={styles.heroOverlay} />
                </div>

                {/* 2. PERFIL DE LA MINI-TIENDA */}
                <div className={styles.storeProfileSection}>
                    <div className={styles.profileTopRow}>
                        <div className={styles.avatarBox}>
                            <Image
                                src={logoUrl || '/LogoTienda.png'}
                                alt={storeName}
                                width={64}
                                height={64}
                                style={{ objectFit: 'cover' }}
                                unoptimized
                            />
                        </div>

                        <div className={styles.profileActions}>
                            <a
                                href={directWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.waHeaderBtn}
                            >
                                <svg width="15" height="15" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="16" cy="16" r="16" fill="#25D366" />
                                    <path d="M23.5 8.5C21.5 6.5 18.8 5.4 16 5.4C10.1 5.4 5.4 10.1 5.4 16C5.4 17.9 5.9 19.7 6.8 21.3L5.4 26.6L10.8 25.2C12.3 26 14.1 26.5 16 26.5C21.9 26.5 26.6 21.8 26.6 15.9C26.6 13.1 25.5 10.5 23.5 8.5ZM16 24.7C14.4 24.7 12.8 24.3 11.5 23.5L11.2 23.3L7.9 24.2L8.8 21L8.5 20.6C7.6 19.2 7.2 17.6 7.2 16C7.2 11.1 11.1 7.2 16 7.2C18.4 7.2 20.6 8.1 22.3 9.8C24 11.5 24.9 13.7 24.9 16.1C24.8 20.9 20.9 24.7 16 24.7ZM20.9 18.7C20.6 18.5 19.3 17.9 19 17.8C18.8 17.7 18.6 17.7 18.5 17.9C18.3 18.2 17.8 18.7 17.7 18.9C17.5 19.1 17.4 19.1 17.1 19C16.8 18.8 15.8 18.5 14.7 17.5C13.8 16.7 13.2 15.7 13 15.4C12.8 15.1 13 15 13.1 14.8C13.2 14.7 13.4 14.5 13.5 14.4C13.6 14.2 13.7 14.1 13.7 14C13.8 13.8 13.8 13.7 13.7 13.6C13.6 13.5 13.1 12.3 12.9 11.8C12.7 11.3 12.5 11.4 12.4 11.4H11.9C11.7 11.4 11.5 11.5 11.3 11.7C11.1 11.9 10.5 12.5 10.5 13.7C10.5 14.9 11.4 16.1 11.5 16.2C11.6 16.4 13.2 18.8 15.7 19.9C17.8 20.8 18.2 20.6 18.7 20.6C19.2 20.5 20.2 20 20.4 19.4C20.6 18.8 20.6 18.3 20.5 18.2C20.5 18.8 21.2 18.8 20.9 18.7Z" fill="white" />
                                </svg>
                                <span>Chat</span>
                            </a>

                            <button
                                type="button"
                                onClick={toggleCart}
                                className={styles.cartHeaderBtn}
                            >
                                <span>🛍️</span>
                                <span>Bolsa ({itemCount})</span>
                            </button>
                        </div>
                    </div>

                    <div className={styles.storeNameRow}>
                        <h1 className={styles.storeName}>{storeName}</h1>
                        <span className={styles.verifiedBadge} title="Tienda Oficial Verificada">✓</span>
                    </div>

                    <p className={styles.storeBio}>{storeBio}</p>

                    <div className={styles.trustPillsRow}>
                        <span className={styles.trustPill}>
                            <span className={styles.liveDot} />
                            Abierto ahora
                        </span>
                        <span className={styles.trustPill}>⚡ Compra en 30 seg</span>
                        <span className={styles.trustPill}>🛵 Delivery & Envíos</span>
                    </div>
                </div>

                {/* 3. BUSCADOR Y CATEGORÍAS DESLIZABLES (STICKY) */}
                <div className={styles.stickyControls}>
                    <div className={styles.searchBox}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={`Buscar en ${storeName}...`}
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className={styles.clearSearchBtn}
                                aria-label="Limpiar búsqueda"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className={styles.categoriesScroll}>
                        <button
                            type="button"
                            onClick={() => setActiveCategory('all')}
                            className={`${styles.categoryChip} ${activeCategory === 'all' ? styles.categoryChipActive : ''}`}
                        >
                            Todos ({initialProducts.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveCategory('ofertas')}
                            className={`${styles.categoryChip} ${activeCategory === 'ofertas' ? styles.categoryChipActive : ''}`}
                        >
                            🔥 Ofertas
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveCategory(cat.slug)}
                                className={`${styles.categoryChip} ${activeCategory === cat.slug ? styles.categoryChipActive : ''}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. GRILLA 2x2 DE PRODUCTOS */}
                <div className={styles.productsSection}>
                    {filteredProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '44px 16px' }}>
                            <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>🔍</div>
                            <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800 }}>
                                No encontramos productos
                            </h3>
                            <p style={{ margin: '0 0 14px 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                                Prueba con otra categoría o término de búsqueda.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveCategory('all');
                                    setSearchQuery('');
                                }}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--robotina-orange)',
                                    background: 'rgba(255, 107, 0, 0.1)',
                                    color: 'var(--robotina-orange)',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Ver todo el catálogo
                            </button>
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {filteredProducts.map(product => {
                                const pricing = getProductPricing(product);
                                const inCart = items.some(i => i.id === product.id);

                                return (
                                    <article
                                        key={product.id}
                                        className={styles.productCard}
                                        onClick={() => setSelectedProduct(product)}
                                    >
                                        <div className={styles.cardImgBox}>
                                            {product.is_out_of_stock ? (
                                                <span className={styles.outBadge}>Agotado</span>
                                            ) : pricing.isOnSale && pricing.discountPercentage > 0 ? (
                                                <span className={styles.saleBadge}>-{pricing.discountPercentage}%</span>
                                            ) : null}

                                            {product.image_url ? (
                                                <Image
                                                    src={product.image_url}
                                                    alt={product.title}
                                                    fill
                                                    sizes="(max-width: 600px) 50vw, 260px"
                                                    className={styles.cardImg}
                                                    unoptimized
                                                />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.8rem' }}>
                                                    {product.title.charAt(0)}
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.cardBody}>
                                            {product.category_name && (
                                                <span className={styles.cardCategory}>{product.category_name}</span>
                                            )}
                                            <h2 className={styles.cardTitle}>{product.title}</h2>

                                            <div className={styles.cardPriceRow}>
                                                <span className={styles.cardPrice}>{pricing.currentPriceFormatted}</span>
                                                {pricing.isOnSale && pricing.compareAtPriceFormatted && (
                                                    <span className={styles.cardComparePrice}>
                                                        {pricing.compareAtPriceFormatted}
                                                    </span>
                                                )}
                                            </div>

                                            <div className={styles.cardBtnRow}>
                                                <button
                                                    type="button"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setSelectedProduct(product);
                                                    }}
                                                    disabled={product.is_out_of_stock}
                                                    className={`${styles.buyBtn} ${inCart ? styles.buyBtnInCart : ''}`}
                                                >
                                                    {product.is_out_of_stock
                                                        ? 'Agotado'
                                                        : inCart
                                                        ? '✓ En tu bolsa · Ver'
                                                        : 'Comprar'}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 5. FRANJA DE MÉTODOS DE PAGO ACEPTADOS */}
                <div className={styles.paymentsStrip}>
                    <div className={styles.paymentsTitle}>Pagos rápidos e integrados</div>
                    <div className={styles.paymentPills}>
                        <span className={styles.payPill}>🟣 Yape</span>
                        <span className={styles.payPill}>🔵 Plin</span>
                        <span className={styles.payPill}>💳 Tarjeta / Mercado Pago</span>
                        <span className={styles.payPill}>🏦 Transferencia</span>
                        <span className={styles.payPill}>🟢 WhatsApp</span>
                    </div>
                </div>
            </div>

            {/* MODAL BOTTOM-SHEET DE PRODUCTO RÁPIDO */}
            <ProductQuickSheet
                product={selectedProduct}
                isOpen={Boolean(selectedProduct)}
                onClose={() => setSelectedProduct(null)}
                whatsappPhone={whatsappPhone}
                storeName={storeName}
            />
        </div>
    );
}

