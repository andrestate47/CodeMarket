'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroBannerRecord } from '@/modules/appearance/actions';
import { formatMoney } from '@/lib/money';
import styles from './HeroHeroBanner.module.css';

interface HeroHeroBannerProps {
    banners: HeroBannerRecord[];
    storeName?: string;
    storeDescription?: string;
}

export default function HeroHeroBanner({
    banners,
    storeName = 'VapeCommerce',
    storeDescription = 'La plataforma líder en e-commerce y tecnología.',
}: HeroHeroBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    const hasBanners = banners && banners.length > 0;
    const currentBanner = hasBanners ? banners[currentIndex] : null;

    const nextSlide = useCallback(() => {
        if (!hasBanners) return;
        setCurrentIndex(prev => (prev + 1) % banners.length);
    }, [hasBanners, banners.length]);

    const prevSlide = useCallback(() => {
        if (!hasBanners) return;
        setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
    }, [hasBanners, banners.length]);

    // Keyboard Left/Right Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [prevSlide, nextSlide]);

    // Mobile Swipe Handling
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 40) {
            if (diff > 0) nextSlide(); // Swipe left
            else prevSlide(); // Swipe right
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    // FALLBACK STATE WHEN 0 BANNERS
    if (!hasBanners || !currentBanner) {
        return (
            <section className={styles.heroFallbackSection}>
                <div className={styles.heroFallbackContent}>
                    <span className={styles.heroFallbackBadge}>BIENVENIDO</span>
                    <h1 className={styles.heroFallbackTitle}>{storeName}</h1>
                    <p className={styles.heroFallbackDesc}>{storeDescription}</p>
                    <Link href="/#productos" className={styles.primaryCtaBtn}>
                        EXPLORAR CATÁLOGO
                    </Link>
                </div>
            </section>
        );
    }

    // PRICE CALCULATIONS FOR FALLBACK
    const priceFormatted = currentBanner?.price_amount !== null && currentBanner?.price_amount !== undefined
        ? formatMoney(currentBanner.price_amount)
        : null;

    const comparePriceFormatted = currentBanner?.compare_at_amount !== null && currentBanner?.compare_at_amount !== undefined
        ? formatMoney(currentBanner.compare_at_amount)
        : null;

    return (
        <section
            className={styles.heroSection}
            style={{ position: 'relative', width: '100%', height: '520px', overflow: 'hidden' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            aria-label="Carrusel de ofertas destacadas"
        >
            {/* HERO SLIDE CONTAINER WITH ALL BANNERS FOR SMOOTH CROSSFADE */}
            <div className={styles.heroViewport} style={{ position: 'relative', width: '100%', height: '100%' }}>
                {banners.map((banner, idx) => {
                    const isActive = idx === currentIndex;
                    const bPrice = banner.price_amount !== null && banner.price_amount !== undefined
                        ? formatMoney(banner.price_amount)
                        : null;
                    const bComparePrice = banner.compare_at_amount !== null && banner.compare_at_amount !== undefined
                        ? formatMoney(banner.compare_at_amount)
                        : null;

                    return (
                        <div
                            key={banner.id || idx}
                            className={`${styles.heroSlide} ${isActive ? styles.heroSlideActive : ''}`}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                            aria-hidden={!isActive}
                        >
                            {/* BACKGROUND IMAGE WITH NEXT/IMAGE */}
                            <div className={styles.imageWrapper} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                                <Image
                                    src={banner.image_url}
                                    alt={banner.title}
                                    fill
                                    priority={true}
                                    sizes="100vw"
                                    unoptimized
                                    className={banner.mobile_image_url ? styles.heroImageDesktop : styles.heroImageAlways}
                                    style={{ objectFit: 'cover' }}
                                />
                                {banner.mobile_image_url && (
                                    <Image
                                        src={banner.mobile_image_url}
                                        alt={banner.title}
                                        fill
                                        priority={true}
                                        sizes="100vw"
                                        unoptimized
                                        className={styles.heroImageMobile}
                                        style={{ objectFit: 'cover' }}
                                    />
                                )}
                                {/* LEGIBILITY OVERLAY GRADIENT */}
                                <div className={styles.heroOverlay} />
                            </div>

                            {/* HERO CONTENT OVERLAY */}
                            <div className={styles.heroContentContainer}>
                                <div className={styles.heroContentBox}>
                                    {banner.badge_text && (
                                        <span className={styles.badgeTag}>
                                            {banner.badge_text}
                                        </span>
                                    )}

                                    <h1 className={styles.heroTitle}>{banner.title}</h1>

                                    {banner.subtitle && (
                                        <p className={styles.heroSubtitle}>{banner.subtitle}</p>
                                    )}

                                    {/* PRICE ROW */}
                                    {(bPrice || bComparePrice || banner.discount_tag) && (
                                        <div className={styles.priceRow}>
                                            {bPrice && (
                                                <span className={styles.mainPrice}>{bPrice}</span>
                                            )}
                                            {bComparePrice && (
                                                <span className={styles.comparePrice}>{bComparePrice}</span>
                                            )}
                                            {banner.discount_tag && (
                                                <span className={styles.discountTag}>{banner.discount_tag}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* CTA BUTTONS */}
                                    <div className={styles.ctaRow}>
                                        {banner.is_out_of_stock ? (
                                            <span className={styles.outOfStockBadge}>
                                                PRODUCTO AGOTADO
                                            </span>
                                        ) : (
                                            <>
                                                <Link
                                                    href={banner.button_url || '/#productos'}
                                                    className={styles.primaryCtaBtn}
                                                    tabIndex={isActive ? 0 : -1}
                                                >
                                                    {banner.button_text || 'COMPRAR AHORA'}
                                                </Link>
                                                <Link
                                                    href="/#categorias"
                                                    className={styles.secondaryCtaBtn}
                                                    tabIndex={isActive ? 0 : -1}
                                                >
                                                    VER CATEGORÍAS
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* PREVIOUS / NEXT ARROWS */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className={`${styles.navArrow} ${styles.prevArrow}`}
                        aria-label="Banner anterior"
                    >
                        ‹
                    </button>
                    <button
                        onClick={nextSlide}
                        className={`${styles.navArrow} ${styles.nextArrow}`}
                        aria-label="Banner siguiente"
                    >
                        ›
                    </button>
                </>
            )}

            {/* PAGINATION DOTS INDICATORS WITH LOADING PROGRESS BAR */}
            {banners.length > 1 && (
                <div className={styles.dotsContainer}>
                    {banners.map((b, idx) => {
                        const isActive = currentIndex === idx;
                        return (
                            <button
                                key={b.id || idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`${styles.dotBtn} ${isActive ? styles.dotActive : ''}`}
                                aria-label={`Ir al banner ${idx + 1}: ${b.title}`}
                            >
                                {isActive && (
                                    <span
                                        key={`progress-${currentIndex}`}
                                        className={styles.dotProgressFill}
                                        onAnimationEnd={() => nextSlide()}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

