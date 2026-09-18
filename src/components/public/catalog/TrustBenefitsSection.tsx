'use client';

import React from 'react';
import styles from './TrustBenefitsSection.module.css';

interface BenefitItem {
    icon: string;
    title: string;
    subtitle: string;
}

const BENEFITS: BenefitItem[] = [
    { icon: '🚚', title: 'Envíos Rápidos', subtitle: 'A todo el país' },
    { icon: '🔒', title: 'Compra Segura', subtitle: 'Múltiples medios de pago' },
    { icon: '💬', title: 'Atención Directa', subtitle: 'Soporte personalizado' },
    { icon: '📦', title: '100% Original', subtitle: 'Productos garantizados' },
];

export default function TrustBenefitsSection() {
    return (
        <div className={styles.trustBar}>
            <div className={styles.container}>
                {BENEFITS.map((b, idx) => (
                    <div key={idx} className={styles.trustItem}>
                        <span className={styles.icon}>{b.icon}</span>
                        <div className={styles.textGroup}>
                            <span className={styles.title}>{b.title}</span>
                            <span className={styles.subtitle}>{b.subtitle}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
