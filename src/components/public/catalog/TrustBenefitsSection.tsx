'use client';

import React from 'react';
import styles from './TrustBenefitsSection.module.css';

interface BenefitItem {
    icon: string;
    title: string;
    description: string;
}

const BENEFITS: BenefitItem[] = [
    {
        icon: '🚚',
        title: 'Envíos rápidos',
        description: 'Despachos garantizados a todo el país y delivery prioritario en Lima.',
    },
    {
        icon: '🔒',
        title: 'Compra segura',
        description: 'Múltiples métodos de pago confiables con encriptación y protección total.',
    },
    {
        icon: '💬',
        title: 'Atención personalizada',
        description: 'Equipo de soporte disponible para asesorarte antes y después de tu compra.',
    },
    {
        icon: '📦',
        title: 'Productos seleccionados',
        description: 'Catálogo de alta calidad verificado directamente con los fabricantes oficiales.',
    },
];

export default function TrustBenefitsSection() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.badge}>GARANTÍA Y CONFIANZA</span>
                    <h2 className={styles.title}>Compra con confianza</h2>
                </div>

                <div className={styles.grid}>
                    {BENEFITS.map((b, idx) => (
                        <div key={idx} className={styles.benefitCard}>
                            <div className={styles.iconWrapper}>{b.icon}</div>
                            <div>
                                <h3 className={styles.benefitTitle}>{b.title}</h3>
                                <p className={styles.benefitDesc}>{b.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
