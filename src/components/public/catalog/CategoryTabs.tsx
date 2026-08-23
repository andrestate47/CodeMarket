'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CategoryRecord } from '@/modules/categories/actions';
import styles from './CategoryTabs.module.css';

interface CategoryTabsProps {
    categories: CategoryRecord[];
    activeSlug: string;
    onSelectCategory: (slug: string) => void;
    onOpenMobileFilter: () => void;
}

export default function CategoryTabs({
    categories,
    activeSlug,
    onSelectCategory,
    onOpenMobileFilter,
}: CategoryTabsProps) {
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Root categories (parent_id is null/undefined)
    const rootCategories = categories.filter(c => !c.parent_id && c.is_active);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className={styles.wrapper}>
            {/* DESKTOP TABS BAR */}
            <div className={styles.desktopBar} ref={dropdownRef}>
                <button
                    className={`${styles.tabBtn} ${activeSlug === 'all' || activeSlug === 'todos' ? styles.activeTab : ''}`}
                    onClick={() => onSelectCategory('all')}
                >
                    Todos
                </button>

                {rootCategories.map((cat) => {
                    const subcats = categories.filter(sub => sub.parent_id === cat.id && sub.is_active);
                    const hasSubcats = subcats.length > 0;
                    const isActive = activeSlug === cat.slug || subcats.some(s => s.slug === activeSlug);
                    const isOpen = openDropdownId === cat.id;

                    if (!hasSubcats) {
                        return (
                            <button
                                key={cat.id}
                                className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                                onClick={() => onSelectCategory(cat.slug)}
                            >
                                {cat.name}
                            </button>
                        );
                    }

                    return (
                        <div key={cat.id} className={styles.dropdownContainer}>
                            <button
                                className={`${styles.tabBtn} ${styles.dropdownTrigger} ${isActive ? styles.activeTab : ''}`}
                                onClick={() => {
                                    onSelectCategory(cat.slug);
                                    setOpenDropdownId(isOpen ? null : cat.id);
                                }}
                            >
                                {cat.name} <span className={styles.caret}>{isOpen ? '▲' : '▼'}</span>
                            </button>

                            {isOpen && (
                                <div className={styles.dropdownMenu}>
                                    <button
                                        className={`${styles.dropdownItem} ${styles.dropdownHeader}`}
                                        onClick={() => {
                                            onSelectCategory(cat.slug);
                                            setOpenDropdownId(null);
                                        }}
                                    >
                                        Ver todo en {cat.name}
                                    </button>
                                    <div className={styles.divider} />
                                    {subcats.map(sub => (
                                        <button
                                            key={sub.id}
                                            className={`${styles.dropdownItem} ${activeSlug === sub.slug ? styles.activeDropdownItem : ''}`}
                                            onClick={() => {
                                                onSelectCategory(sub.slug);
                                                setOpenDropdownId(null);
                                            }}
                                        >
                                            {sub.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* MOBILE FILTER TRIGGER BUTTON */}
            <div className={styles.mobileTriggerBar}>
                <button onClick={onOpenMobileFilter} className={styles.mobileFilterBtn}>
                    <span>Categorías y Filtros</span>
                    <span className={styles.mobileFilterIcon}>⚙️</span>
                </button>
            </div>
        </div>
    );
}
