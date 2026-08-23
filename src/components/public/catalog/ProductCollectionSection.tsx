'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CategoryRecord } from '@/modules/categories/actions';
import { getPublicCatalogProductsAction, PublicProductItem } from '@/modules/catalog/publicActions';
import CategoryTabs from './CategoryTabs';
import ProductSort, { SortOptionValue } from './ProductSort';
import ProductCount from './ProductCount';
import ProductGrid from './ProductGrid';
import ProductGridSkeleton from './ProductGridSkeleton';
import EmptyProducts from './EmptyProducts';
import MobileFilterDrawer from './MobileFilterDrawer';
import styles from './ProductCollectionSection.module.css';

interface ProductCollectionSectionProps {
    initialCategories?: CategoryRecord[];
}

export default function ProductCollectionSection({
    initialCategories = [],
}: ProductCollectionSectionProps) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const catFromUrl = searchParams.get('categoria') || (searchParams.get('ofertas') === 'true' ? 'ofertas' : 'all');
    const [activeCategorySlug, setActiveCategorySlug] = useState<string>(catFromUrl);
    const [sortBy, setSortBy] = useState<SortOptionValue>('newest');
    const [products, setProducts] = useState<PublicProductItem[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const pageSize = 24;

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

    // Effective category slug prioritized from URL
    const effectiveCategorySlug = searchParams.get('categoria') || (searchParams.get('ofertas') === 'true' ? 'ofertas' : activeCategorySlug) || 'all';

    // Keep activeCategorySlug in sync with searchParams
    useEffect(() => {
        if (catFromUrl && catFromUrl !== activeCategorySlug) {
            setActiveCategorySlug(catFromUrl);
        }
    }, [catFromUrl, activeCategorySlug]);

    // Fetch products
    const loadProducts = useCallback(async (catSlug: string, sort: SortOptionValue, pageNum: number) => {
        setLoading(true);
        setError(null);

        const res = await getPublicCatalogProductsAction({
            categorySlug: catSlug,
            sortBy: sort,
            page: pageNum,
            pageSize,
        });

        if (res.success) {
            setProducts(res.products);
            setTotalCount(res.totalCount);
        } else {
            setError(res.error || 'No pudimos cargar los productos.');
        }

        setLoading(false);
    }, [pageSize]);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (isMounted) {
                await loadProducts(effectiveCategorySlug, sortBy, page);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [effectiveCategorySlug, sortBy, page, loadProducts]);

    const handleSelectCategory = (slug: string) => {
        setActiveCategorySlug(slug);
        setPage(1);

        // Update URL search params gracefully without full page reload
        const params = new URLSearchParams(window.location.search);
        params.delete('ofertas');
        if (slug === 'all' || slug === 'todos') {
            params.delete('categoria');
        } else {
            params.set('categoria', slug);
        }

        const newUrl = params.toString() ? `/?${params.toString()}#productos` : '/#productos';
        router.push(newUrl, { scroll: false });
    };

    const handleSelectSort = (sort: SortOptionValue) => {
        setSortBy(sort);
        setPage(1);
    };

    // Find category display name
    const isOffersMode = effectiveCategorySlug === 'ofertas' || effectiveCategorySlug === 'ofertas-especiales';
    const activeCategoryObj = initialCategories.find(c => c.slug === effectiveCategorySlug);
    const activeCategoryName = isOffersMode
        ? '🔥 Ofertas Especiales'
        : (activeCategoryObj ? activeCategoryObj.name : (effectiveCategorySlug === 'all' ? 'Todos' : effectiveCategorySlug));

    return (
        <section className={styles.section} id="productos">
            <div className={styles.container}>
                {/* 1. SECTION HEADER */}
                <div className={styles.sectionHeader}>
                    <div className={styles.titleGroup}>
                        <span className={styles.sectionBadge}>
                            {isOffersMode ? 'DESCUENTOS Y PROMOCIONES' : 'CATÁLOGO COMPLETO'}
                        </span>
                        <h2 className={styles.sectionTitle}>
                            {isOffersMode ? (
                                <>OFERTAS <span className="text-gradient">ESPECIALES</span></>
                            ) : (
                                <>COLECCIÓN DE <span className="text-gradient">PRODUCTOS</span></>
                            )}
                        </h2>
                    </div>

                    {/* CATEGORY TABS (DESKTOP) */}
                    <CategoryTabs
                        categories={initialCategories}
                        activeSlug={activeCategorySlug}
                        onSelectCategory={handleSelectCategory}
                        onOpenMobileFilter={() => setMobileDrawerOpen(true)}
                    />
                </div>

                {/* 2. TOOLBAR (PRODUCT COUNT + SORT SELECTOR) */}
                <div className={styles.toolbar}>
                    <ProductCount count={totalCount} categoryName={activeCategoryName} />

                    <ProductSort value={sortBy} onChange={handleSelectSort} />
                </div>

                {/* 3. MAIN CATALOG GRID / STATES */}
                {loading ? (
                    <ProductGridSkeleton count={8} />
                ) : error ? (
                    <div className={styles.errorContainer}>
                        <div className={styles.errorIcon}>⚠️</div>
                        <h3 className={styles.errorTitle}>{error}</h3>
                        <button
                            onClick={() => loadProducts(activeCategorySlug, sortBy, page)}
                            className={styles.retryBtn}
                        >
                            Reintentar
                        </button>
                    </div>
                ) : products.length === 0 ? (
                    <EmptyProducts onResetCategory={() => handleSelectCategory('all')} />
                ) : (
                    <>
                        <ProductGrid products={products} />

                        {/* PAGINATION / LOAD MORE IF MORE PRODUCTS EXIST */}
                        {totalCount > pageSize && (
                            <div className={styles.paginationRow}>
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className={styles.pageBtn}
                                >
                                    ← Anterior
                                </button>
                                <span className={styles.pageIndicator}>
                                    Página {page} de {Math.ceil(totalCount / pageSize)}
                                </span>
                                <button
                                    disabled={page * pageSize >= totalCount}
                                    onClick={() => setPage(p => p + 1)}
                                    className={styles.pageBtn}
                                >
                                    Siguiente →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MOBILE FILTER DRAWER */}
            <MobileFilterDrawer
                isOpen={mobileDrawerOpen}
                onClose={() => setMobileDrawerOpen(false)}
                categories={initialCategories}
                activeSlug={activeCategorySlug}
                onSelectCategory={handleSelectCategory}
                sortBy={sortBy}
                onSelectSortBy={handleSelectSort}
            />
        </section>
    );
}
