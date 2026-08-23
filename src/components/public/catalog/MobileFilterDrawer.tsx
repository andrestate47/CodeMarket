'use client';

import React from 'react';
import { CategoryRecord } from '@/modules/categories/actions';
import { SortOptionValue } from './ProductSort';
import styles from './MobileFilterDrawer.module.css';

interface MobileFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    categories: CategoryRecord[];
    activeSlug: string;
    onSelectCategory: (slug: string) => void;
    sortBy: SortOptionValue;
    onSelectSortBy: (val: SortOptionValue) => void;
}

export default function MobileFilterDrawer({
    isOpen,
    onClose,
    categories,
    activeSlug,
    onSelectCategory,
    sortBy,
    onSelectSortBy,
}: MobileFilterDrawerProps) {
    if (!isOpen) return null;

    const rootCategories = categories.filter(c => !c.parent_id && c.is_active);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Filtros y Categorías</h3>
                    <button onClick={onClose} className={styles.closeBtn} aria-label="Cerrar">
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    {/* 1. SORT SECTION */}
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Ordenar por</h4>
                        <div className={styles.optionsGrid}>
                            {[
                                { label: 'Más recientes', val: 'newest' },
                                { label: 'Precio: menor a mayor', val: 'price_asc' },
                                { label: 'Precio: mayor a menor', val: 'price_desc' },
                                { label: 'Nombre: A – Z', val: 'name_asc' },
                                { label: 'Nombre: Z – A', val: 'name_desc' },
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    className={`${styles.optionBtn} ${sortBy === opt.val ? styles.activeOption : ''}`}
                                    onClick={() => {
                                        onSelectSortBy(opt.val as SortOptionValue);
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.divider} />

                    {/* 2. CATEGORIES SECTION */}
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Categorías</h4>
                        <div className={styles.categoriesList}>
                            <button
                                className={`${styles.catBtn} ${activeSlug === 'all' || activeSlug === 'todos' ? styles.activeCatBtn : ''}`}
                                onClick={() => {
                                    onSelectCategory('all');
                                    onClose();
                                }}
                            >
                                Todas las categorías
                            </button>

                            <button
                                className={`${styles.catBtn} ${activeSlug === 'ofertas' || activeSlug === 'ofertas-especiales' ? styles.activeCatBtn : ''}`}
                                onClick={() => {
                                    onSelectCategory('ofertas');
                                    onClose();
                                }}
                                style={{ color: activeSlug === 'ofertas' ? '#ffffff' : 'var(--robotina-orange)', fontWeight: 800 }}
                            >
                                🔥 Ofertas Especiales
                            </button>

                            {rootCategories.map(cat => {
                                const subcats = categories.filter(s => s.parent_id === cat.id && s.is_active);
                                const isCatActive = activeSlug === cat.slug;

                                return (
                                    <div key={cat.id} className={styles.catGroup}>
                                        <button
                                            className={`${styles.catBtn} ${isCatActive ? styles.activeCatBtn : ''}`}
                                            onClick={() => {
                                                onSelectCategory(cat.slug);
                                                onClose();
                                            }}
                                        >
                                            {cat.name}
                                        </button>

                                        {subcats.length > 0 && (
                                            <div className={styles.subCatList}>
                                                {subcats.map(sub => (
                                                    <button
                                                        key={sub.id}
                                                        className={`${styles.subCatBtn} ${activeSlug === sub.slug ? styles.activeSubCatBtn : ''}`}
                                                        onClick={() => {
                                                            onSelectCategory(sub.slug);
                                                            onClose();
                                                        }}
                                                    >
                                                        ↳ {sub.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.applyBtn}>
                        Ver Resultados
                    </button>
                </div>
            </div>
        </div>
    );
}
