'use client';

import React from 'react';
import Link from 'next/link';
import styles from './TiendaVirLogo.module.css';

interface TiendaVirLogoProps {
    size?: 'small' | 'medium' | 'large';
    showTagline?: boolean;
    href?: string;
    className?: string;
}

export default function TiendaVirLogo({
    size = 'medium',
    showTagline = false,
    href = '/',
    className = '',
}: TiendaVirLogoProps) {
    const sizeClass = size === 'small' ? styles.sizeSmall : size === 'large' ? styles.sizeLarge : styles.sizeMedium;

    const content = (
        <div className={`${styles.logoWrapper} ${sizeClass} ${className}`}>
            {/* VECTOR SHOPPING CART ICON (EXACT 1:1 CHUBBY BOLD FOLDED SHELL) */}
            <div className={styles.iconContainer}>
                <svg
                    className={styles.cartSvg}
                    viewBox="0 0 96 90"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="tiendaVirCartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF4A00" />
                            <stop offset="40%" stopColor="#FF6E00" />
                            <stop offset="80%" stopColor="#FF8A00" />
                            <stop offset="100%" stopColor="#FF2200" />
                        </linearGradient>
                    </defs>

                    {/* Tilted cart group (-14 deg speed angle) */}
                    <g transform="rotate(-14 48 45)">
                        {/* 1. Outer Folded Shell (Top Bar + Right Back Spine + Bottom Bar) */}
                        <path
                            d="M 12 16 H 64 C 80 16 86 24 81 38 L 73 52 C 68 60 58 61 44 61 H 32"
                            stroke="url(#tiendaVirCartGrad)"
                            strokeWidth="17.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* 2. Middle Shelf Bar (Inner Wing) */}
                        <path
                            d="M 21 38.5 H 61"
                            stroke="url(#tiendaVirCartGrad)"
                            strokeWidth="15.5"
                            strokeLinecap="round"
                        />

                        {/* 3. Left Wheel Dot */}
                        <circle cx="39" cy="80" r="8" fill="url(#tiendaVirCartGrad)" />

                        {/* 4. Right Wheel Dot */}
                        <circle cx="64" cy="74" r="8" fill="url(#tiendaVirCartGrad)" />
                    </g>
                </svg>
            </div>

            {/* TYPOGRAPHY BRAND NAME & TAGLINE */}
            <div className={styles.textGroup}>
                <div className={styles.mainTitle}>
                    <span className={styles.wordTienda}>Tienda</span>
                    <span className={styles.wordVir}>Vir</span>
                    <span className={styles.trademark}>™</span>
                </div>
                {showTagline && (
                    <div className={styles.tagline}>
                        Todo lo que querés, en un solo lugar
                    </div>
                )}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} style={{ textDecoration: 'none' }}>
                {content}
            </Link>
        );
    }

    return content;
}
