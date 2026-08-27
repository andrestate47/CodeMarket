'use client';

import React from 'react';
import Link from 'next/link';
import styles from './SecondaryCommercialBanner.module.css';

interface SecondaryCommercialBannerProps {
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonUrl?: string;
}

export default function SecondaryCommercialBanner({
    title = 'TODO LO QUE NECESITAS EN UN SOLO LUGAR',
    subtitle = 'Descubre nuestra colección completa y encuentra los productos seleccionados con envío rápido y garantía oficial.',
    buttonText = 'VER CATÁLOGO COMPLETO',
    buttonUrl = '/#productos',
}: SecondaryCommercialBannerProps) {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.bannerCard}>
                    <div className={styles.content}>
                        <span className={styles.badge}>COLECCIÓN EXCLUSIVA</span>
                        <h2 className={styles.title}>{title}</h2>
                        <p className={styles.subtitle}>{subtitle}</p>
                    </div>

                    <Link href={buttonUrl} className={styles.ctaBtn}>
                        {buttonText} →
                    </Link>
                </div>
            </div>
        </section>
    );
}
