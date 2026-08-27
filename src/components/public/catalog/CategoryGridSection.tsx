'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CategoryRecord } from '@/modules/categories/actions';
import styles from './CategoryGridSection.module.css';

interface CategoryGridSectionProps {
    categories: CategoryRecord[];
}

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
    dispositivos: '/images/vapes/pod_system_xros.png',
    pods: '/images/vapes/pod_system_caliburn.png',
    liquidos: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800&auto=format&fit=crop&q=80',
    desechables: '/images/vapes/disposable_berry_blast.png',
    accesorios: '/images/vapes/pod_system_caliburn.png',
};

export default function CategoryGridSection({ categories }: CategoryGridSectionProps) {
    const rootCategories = categories.filter(c => !c.parent_id && c.is_active !== false).slice(0, 6);

    if (rootCategories.length === 0) return null;

    return (
        <section className={styles.section} id="categorias">
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.sectionBadge}>EXPLORA EL CATÁLOGO</span>
                    <h2 className={styles.title}>Explora por categoría</h2>
                    <p className={styles.subtitle}>
                        Encuentra rápidamente los productos que buscas seleccionando tu categoría de interés.
                    </p>
                </div>

                <div className={styles.grid}>
                    {rootCategories.map(cat => {
                        const slugKey = (cat.slug || cat.id).toLowerCase();
                        const fallbackImg = DEFAULT_CATEGORY_IMAGES[slugKey] || '/images/vapes/pod_system_xros.png';
                        const imageUrl = cat.image_url || fallbackImg;

                        return (
                            <Link
                                key={cat.id}
                                href={`/?categoria=${cat.slug || cat.id}#productos`}
                                className={styles.categoryCard}
                            >
                                <div className={styles.imageWrapper}>
                                    <Image
                                        src={imageUrl}
                                        alt={cat.name}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                        className={styles.categoryImg}
                                        unoptimized
                                    />
                                    <div className={styles.overlay} />
                                </div>

                                <div className={styles.cardContent}>
                                    <h3 className={styles.categoryName}>{cat.name}</h3>
                                    <span className={styles.exploreLink}>
                                        Explorar →
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
