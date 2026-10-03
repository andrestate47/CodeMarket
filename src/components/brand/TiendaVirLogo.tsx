'use client';

import React from 'react';
import Link from 'next/link';
import styles from './TiendaVirLogo.module.css';

interface TiendaVirLogoProps {
    size?: 'small' | 'medium' | 'large';
    showTagline?: boolean;
    href?: string;
    className?: string;
    variant?: 'image' | 'svg';
    storeName?: string;
    logoImage?: string;
}

export default function TiendaVirLogo({
    size = 'medium',
    showTagline = false,
    href = '/',
    className = '',
    variant = 'image',
    storeName = 'VapeCommerce',
    logoImage,
}: TiendaVirLogoProps) {
    const sizeClass = size === 'small' ? styles.sizeSmall : size === 'large' ? styles.sizeLarge : styles.sizeMedium;

    const isTiendaVir = storeName.toLowerCase().includes('tienda');
    const word1 = isTiendaVir ? 'Tienda' : 'Vape';
    const word2 = isTiendaVir ? 'Vir' : 'Commerce';
    const imgSrc = logoImage || (isTiendaVir ? '/logo-TiendaVir.png' : '/LogoTienda.png');

    const content = (
        <div className={`${styles.logoWrapper} ${sizeClass} ${className}`}>
            {/* EXACT OFFICIAL LOGO ICON */}
            <div className={styles.iconContainer}>
                {variant === 'image' ? (
                    <img
                        src={imgSrc}
                        alt={`${storeName} Logo`}
                        className={styles.cartImage}
                    />
                ) : (
                    <svg
                        className={styles.cartSvg}
                        viewBox="0 0 120 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <linearGradient id="tiendaVirCartGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#FF2800" />
                                <stop offset="40%" stopColor="#FF6000" />
                                <stop offset="75%" stopColor="#FF8800" />
                                <stop offset="100%" stopColor="#FFA600" />
                            </linearGradient>
                        </defs>

                        <g transform="rotate(-12 60 50)">
                            {/* Top Wing / Spine / Bottom Frame */}
                            <path
                                d="M 22 20 H 74 C 92 20 98 28 92 44 C 86 60 74 66 54 70 H 32"
                                stroke="url(#tiendaVirCartGrad)"
                                strokeWidth="16"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {/* Middle Wing Bar */}
                            <path
                                d="M 30 45 H 78"
                                stroke="url(#tiendaVirCartGrad)"
                                strokeWidth="15"
                                strokeLinecap="round"
                            />
                            {/* Front Wheel Dot */}
                            <circle cx="42" cy="86" r="8.5" fill="url(#tiendaVirCartGrad)" />
                            {/* Rear Wheel Dot */}
                            <circle cx="70" cy="80" r="8.5" fill="url(#tiendaVirCartGrad)" />
                        </g>
                    </svg>
                )}
            </div>

            {/* TYPOGRAPHY BRAND NAME & TAGLINE */}
            <div className={styles.textGroup}>
                <div className={styles.mainTitle}>
                    <span className={styles.wordTienda}>{word1}</span>
                    <span className={styles.wordVir}>{word2}</span>
                    <span className={styles.trademark}>™</span>
                </div>
                {showTagline && (
                    <div className={styles.tagline}>
                        {isTiendaVir ? 'Todo lo que querés, en un solo lugar' : 'La tienda oficial de vapeo'}
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
