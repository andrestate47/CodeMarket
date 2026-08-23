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
    storeName = 'CODEMARKET',
    storeDescription = 'La plataforma líder en e-commerce y tecnología.',
}: HeroHeroBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
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

    // 5-7 Second Autoplay
    useEffect(() => {
        if (!hasBanners || banners.length <= 1 || isPaused) return;
        const interval = setInterval(() => {
            nextSlide();
        }, 6000);
        return () => clearInterval(interval);
    }, [hasBanners, banners.length, isPaused, nextSlide]);

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

    const priceFormatted = currentBanner.price_amount !== null && currentBanner.price_amount !== undefined
        ? formatMoney(currentBanner.price_amount)
        : null;

    const comparePriceFormatted = currentBanner.compare_at_amount !== null && currentBanner.compare_at_amount !== undefined
        ? formatMoney(currentBanner.compare_at_amount)
        : null;

    return (
        <section
            className={styles.heroSection}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            aria-label="Carrusel de ofertas destacadas"
        >
            {/* HERO SLIDE CONTAINER */}
            <div className={styles.heroViewport}>
                <div className={styles.heroSlide}>
                    {/* BACKGROUND IMAGE WITH NEXT/IMAGE */}
                    <div className={styles.imageWrapper}>
                        <Image
                            src={currentBanner.image_url}
                            alt={currentBanner.title}
                            fill
                            priority={currentIndex === 0}
                            sizes="100vw"
                            unoptimized
                            className={styles.heroImageDesktop}
                            style={{ objectFit: 'cover' }}
                        />
                        {currentBanner.mobile_image_url && (
                            <Image
                                src={currentBanner.mobile_image_url}
                                alt={currentBanner.title}
                                fill
                                priority={currentIndex === 0}
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
                            {currentBanner.badge_text && (
                                <span className={styles.badgeTag}>
                                    {currentBanner.badge_text}
                                </span>
                            )}

                            <h1 className={styles.heroTitle}>{currentBanner.title}</h1>

                            {currentBanner.subtitle && (
                                <p className={styles.heroSubtitle}>{currentBanner.subtitle}</p>
                            )}

                            {/* PRICE ROW */}
                            {(priceFormatted || comparePriceFormatted || currentBanner.discount_tag) && (
                                <div className={styles.priceRow}>
                                    {priceFormatted && (
                                        <span className={styles.mainPrice}>{priceFormatted}</span>
                                    )}
                                    {comparePriceFormatted && (
                                        <span className={styles.comparePrice}>{comparePriceFormatted}</span>
                                    )}
                                    {currentBanner.discount_tag && (
                                        <span className={styles.discountTag}>{currentBanner.discount_tag}</span>
                                    )}
                                </div>
                            )}

                            {/* CTA BUTTON */}
                            <div className={styles.ctaRow}>
                                {currentBanner.is_out_of_stock ? (
                                    <span className={styles.outOfStockBadge}>
                                        PRODUCTO AGOTADO
                                    </span>
                                ) : (
                                    <Link
                                        href={currentBanner.button_url || '/#productos'}
                                        className={styles.primaryCtaBtn}
                                    >
                                        {currentBanner.button_text || 'COMPRAR AHORA'}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
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

            {/* PAGINATION DOTS INDICATORS */}
            {banners.length > 1 && (
                <div className={styles.dotsContainer}>
                    {banners.map((b, idx) => (
                        <button
                            key={b.id || idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`${styles.dotBtn} ${currentIndex === idx ? styles.dotActive : ''}`}
                            aria-label={`Ir al banner ${idx + 1}: ${b.title}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
