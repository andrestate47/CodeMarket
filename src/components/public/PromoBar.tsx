'use client';

import React from 'react';
import Link from 'next/link';
import styles from './PromoBar.module.css';

interface PromoBarProps {
    enabled: boolean;
    text: string;
    link?: string;
    bgColor?: string;
    textColor?: string;
}

export default function PromoBar({
    enabled,
    text,
    link = '/#productos',
    bgColor = '#FF6B00',
    textColor = '#FFFFFF',
}: PromoBarProps) {
    if (!enabled || !text) return null;

    const content = (
        <div 
            className={styles.promoBar}
            style={{ backgroundColor: bgColor, color: textColor }}
            role="region"
            aria-label="Anuncio promocional"
        >
            <div className={styles.container}>
                <span className={styles.text}>{text}</span>
                {link && <span className={styles.arrow}>→</span>}
            </div>
        </div>
    );

    if (link) {
        return (
            <Link href={link} className={styles.linkWrapper}>
                {content}
            </Link>
        );
    }

    return content;
}
