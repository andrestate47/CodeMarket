'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { User } from '@supabase/supabase-js';
import { getCategoriesListAction, CategoryRecord } from '@/modules/categories/actions';
import { searchProductsAction, SearchResultItem } from '@/modules/search/actions';
import styles from './Navbar.module.css';

interface NavbarProps {
    storeName?: string;
    logoUrl?: string | null;
}

export default function Navbar({ storeName = 'CODEMARKET', logoUrl }: NavbarProps) {
    const { toggleCart, items, itemCount } = useCart();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const totalCartCount = itemCount || cartItemsCount;

    const [user, setUser] = useState<User | null>(null);
    const [categories, setCategories] = useState<CategoryRecord[]>([]);
    const [openCategoryDropdownId, setOpenCategoryDropdownId] = useState<string | null>(null);
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchOverlay, setShowSearchOverlay] = useState(false);
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

    // User menu dropdown
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Mobile Drawer state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [expandedMobileCategoryId, setExpandedMobileCategoryId] = useState<string | null>(null);

    // Sync Auth user session
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Load public active categories
    useEffect(() => {
        let isCurrent = true;
        getCategoriesListAction().then(res => {
            if (isCurrent && res.success) {
                const activeCats = res.categories.filter(c => c.is_active !== false);
                setCategories(activeCats);
            }
        });
        return () => { isCurrent = false; };
    }, []);

    // Handle outside clicks to close search overlay and user dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const isOutsideDesktop = !searchContainerRef.current || !searchContainerRef.current.contains(e.target as Node);
            const isOutsideMobile = !mobileSearchContainerRef.current || !mobileSearchContainerRef.current.contains(e.target as Node);

            if (isOutsideDesktop && isOutsideMobile) {
                setShowSearchOverlay(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Real-time debounced search
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);

        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        if (!val.trim()) {
            setSearchResults([]);
            setShowSearchOverlay(false);
            return;
        }

        setIsSearching(true);
        setShowSearchOverlay(true);

        searchDebounceRef.current = setTimeout(async () => {
            const res = await searchProductsAction(val);
            if (res.success) {
                setSearchResults(res.products);
            }
            setIsSearching(false);
        }, 300);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setShowSearchOverlay(false);
            router.push(`/#productos?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUserMenuOpen(false);
        router.refresh();
    };

    // Separate Root Categories & Subcategories
    const rootCategories = categories.filter(c => !c.parent_id);
    const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

    return (
        <header className={styles.header}>
            {/* MAIN HEADER CONTAINER */}
            <div className={styles.container}>
                {/* 1. BRAND LOGO */}
                <Link href="/" className={styles.brand}>
                    {logoUrl ? (
                        <Image
                            src={logoUrl}
                            alt={storeName}
                            width={160}
                            height={40}
                            className={styles.logoImg}
                            priority
                        />
                    ) : (
                        <span className={styles.brandText}>
                            {storeName} <span className={styles.brandAccent}>{'///'}</span>
                        </span>
                    )}
                </Link>

                {/* 2. DESKTOP SEARCH BAR (CENTER) */}
                <div className={styles.searchContainer} ref={searchContainerRef}>
                    <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                        <input
                            type="text"
                            placeholder="🔍 Buscar por nombre, categoría o sabor..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => searchQuery.trim() && setShowSearchOverlay(true)}
                            className={styles.searchInput}
                            aria-label="Buscar productos"
                        />
                        <button type="submit" className={styles.searchSubmitBtn} aria-label="Ejecutar búsqueda">
                            🔍
                        </button>
                    </form>

                    {/* SEARCH RESULTS OVERLAY POPOVER */}
                    {showSearchOverlay && (
                        <div className={styles.searchOverlay}>
                            {isSearching ? (
                                <div className={styles.searchLoading}>Buscando productos...</div>
                            ) : searchResults.length === 0 ? (
                                <div className={styles.searchEmpty}>
                                    No se encontraron productos para &quot;{searchQuery}&quot;
                                </div>
                            ) : (
                                <div className={styles.searchResultsList}>
                                    <div className={styles.searchResultsHeader}>Resultados rápidos ({searchResults.length})</div>
                                    {searchResults.map(prod => (
                                        <Link
                                            key={prod.id}
                                            href={`/productos/${prod.id}`}
                                            onClick={() => setShowSearchOverlay(false)}
                                            className={styles.searchItem}
                                        >
                                            <div className={styles.searchItemThumb}>
                                                {prod.image_url ? (
                                                    <Image
                                                        src={prod.image_url}
                                                        alt={prod.title}
                                                        width={44}
                                                        height={44}
                                                        style={{ objectFit: 'cover', borderRadius: '6px' }}
                                                    />
                                                ) : (
                                                    <div className={styles.searchItemPlaceholder}>📦</div>
                                                )}
                                            </div>
                                            <div className={styles.searchItemInfo}>
                                                <div className={styles.searchItemTitle}>{prod.title}</div>
                                                {prod.category_name && (
                                                    <div className={styles.searchItemCategory}>{prod.category_name}</div>
                                                )}
                                                <div className={styles.searchItemPriceRow}>
                                                    <span className={styles.searchItemPrice}>{prod.price}</span>
                                                    {prod.is_out_of_stock && (
                                                        <span className={styles.searchItemBadgeOut}>Agotado</span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                    <button
                                        onClick={handleSearchSubmit}
                                        className={styles.viewAllSearchBtn}
                                    >
                                        Ver todos los resultados para &quot;{searchQuery}&quot; →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. RIGHT ACTIONS (ACCOUNT, CART, THEME) */}
                <div className={styles.actionsGroup}>
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={styles.iconBtn}
                        aria-label="Cambiar tema de color"
                        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    {/* User Account Button */}
                    <div className={styles.userMenuWrapper} ref={userMenuRef}>
                        {user ? (
                            <>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className={styles.userAccountBtn}
                                >
                                    <span className={styles.userIcon}>👤</span>
                                    <span className={styles.userLabel}>Mi Cuenta</span>
                                    <span className={styles.caret}>▾</span>
                                </button>

                                {userMenuOpen && (
                                    <div className={styles.userDropdown}>
                                        <div className={styles.userDropdownHeader}>
                                            <div className={styles.userEmail}>{user.email}</div>
                                        </div>
                                        <Link
                                            href="/admin/pedidos"
                                            onClick={() => setUserMenuOpen(false)}
                                            className={styles.userDropdownLink}
                                        >
                                            📦 Mis Pedidos
                                        </Link>
                                        <Link
                                            href="/admin/perfil"
                                            onClick={() => setUserMenuOpen(false)}
                                            className={styles.userDropdownLink}
                                        >
                                            👤 Mi Perfil & Direcciones
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className={styles.userDropdownLogout}
                                        >
                                            🚪 Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link href="/login" className={styles.loginBtn}>
                                <span className={styles.userIcon}>👤</span>
                                <span className={styles.userLabel}>Acceder</span>
                            </Link>
                        )}
                    </div>

                    {/* Cart Trigger Button */}
                    <button
                        onClick={toggleCart}
                        className={styles.cartButton}
                        aria-label={`Ver carrito (${totalCartCount} productos)`}
                        suppressHydrationWarning
                    >
                        <span className={styles.cartIcon}>🛒</span>
                        <span className={styles.cartText}>CARRITO</span>
                        {totalCartCount > 0 && (
                            <span className={styles.cartBadge} suppressHydrationWarning>{totalCartCount}</span>
                        )}
                    </button>

                    {/* Mobile Hamburger Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={styles.mobileHamburgerBtn}
                        aria-label="Abrir menú de navegación"
                    >
                        ☰
                    </button>
                </div>
            </div>

            {/* MOBILE QUICK SEARCH BAR */}
            <div className={styles.mobileSearchContainer} ref={mobileSearchContainerRef}>
                <form onSubmit={handleSearchSubmit} className={styles.mobileSearchFormInner}>
                    <input
                        type="text"
                        placeholder="Buscar productos o categorías..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => searchQuery.trim() && setShowSearchOverlay(true)}
                        className={styles.mobileSearchInputHeader}
                        aria-label="Buscar productos en móvil"
                    />
                    <button type="submit" className={styles.searchSubmitBtn} aria-label="Ejecutar búsqueda">
                        🔍
                    </button>
                </form>

                {/* SEARCH RESULTS OVERLAY POPOVER FOR MOBILE */}
                {showSearchOverlay && (
                    <div className={styles.searchOverlay}>
                        {isSearching ? (
                            <div className={styles.searchLoading}>⚡ Buscando coincidencias...</div>
                        ) : searchResults.length === 0 ? (
                            <div className={styles.searchEmpty}>
                                No se encontraron productos para &quot;{searchQuery}&quot;
                            </div>
                        ) : (
                            <div className={styles.searchResultsList}>
                                <div className={styles.searchResultsHeader}>Sugerencias predichas ({searchResults.length})</div>
                                {searchResults.map(prod => (
                                    <Link
                                        key={prod.id}
                                        href={`/productos/${prod.id}`}
                                        onClick={() => setShowSearchOverlay(false)}
                                        className={styles.searchItem}
                                    >
                                        <div className={styles.searchItemThumb}>
                                            {prod.image_url ? (
                                                <Image
                                                    src={prod.image_url}
                                                    alt={prod.title}
                                                    width={44}
                                                    height={44}
                                                    style={{ objectFit: 'cover', borderRadius: '6px' }}
                                                />
                                            ) : (
                                                <div className={styles.searchItemPlaceholder}>📦</div>
                                            )}
                                        </div>
                                        <div className={styles.searchItemInfo}>
                                            <div className={styles.searchItemTitle}>{prod.title}</div>
                                            {prod.category_name && (
                                                <div className={styles.searchItemCategory}>{prod.category_name}</div>
                                            )}
                                            <div className={styles.searchItemPriceRow}>
                                                <span className={styles.searchItemPrice}>{prod.price}</span>
                                                {prod.is_out_of_stock && (
                                                    <span className={styles.searchItemBadgeOut}>Agotado</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                <button
                                    onClick={handleSearchSubmit}
                                    className={styles.viewAllSearchBtn}
                                >
                                    Ver todos los resultados para &quot;{searchQuery}&quot; →
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 4. CATEGORIES NAVIGATION BAR (DESKTOP) */}
            <nav className={styles.categoriesBar} aria-label="Navegación de categorías">
                <div className={styles.categoriesContainer}>
                    <Link href="/" className={styles.catLinkActive}>
                        Inicio
                    </Link>

                    {rootCategories.map(cat => {
                        const subs = getSubcategories(cat.id);
                        const hasSubs = subs.length > 0;

                        if (hasSubs) {
                            return (
                                <div
                                    key={cat.id}
                                    className={styles.catDropdownWrapper}
                                    onMouseEnter={() => setOpenCategoryDropdownId(cat.id)}
                                    onMouseLeave={() => setOpenCategoryDropdownId(null)}
                                >
                                    <Link href={`/?categoria=${cat.slug || cat.id}#productos`} className={styles.catLink}>
                                        {cat.name} <span className={styles.catCaret}>▾</span>
                                    </Link>

                                    {openCategoryDropdownId === cat.id && (
                                        <div className={styles.catDropdownMenu}>
                                            <Link
                                                href={`/?categoria=${cat.slug || cat.id}#productos`}
                                                className={styles.catDropdownHeaderLink}
                                            >
                                                Ver todo en {cat.name} →
                                            </Link>
                                            <div className={styles.catDropdownDivider} />
                                            {subs.map(sub => (
                                                <Link
                                                    key={sub.id}
                                                    href={`/?categoria=${sub.slug || sub.id}#productos`}
                                                    className={styles.catDropdownItem}
                                                >
                                                    ↳ {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={cat.id}
                                href={`/?categoria=${cat.slug || cat.id}#productos`}
                                className={styles.catLink}
                            >
                                {cat.name}
                            </Link>
                        );
                    })}

                    <Link href="/ofertas" className={styles.offersTagLink}>
                        🔥 Ofertas
                    </Link>
                </div>
            </nav>

            {/* 5. MOBILE DRAWER MENU */}
            {mobileMenuOpen && (
                <div className={styles.mobileDrawerOverlay} onClick={() => setMobileMenuOpen(false)}>
                    <div className={styles.mobileDrawerContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.mobileDrawerHeader}>
                            <span className={styles.mobileDrawerTitle}>{storeName}</span>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className={styles.mobileDrawerCloseBtn}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Mobile Search */}
                        <form onSubmit={handleSearchSubmit} className={styles.mobileSearchForm}>
                            <input
                                type="text"
                                placeholder="🔍 Buscar productos..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className={styles.mobileSearchInput}
                            />
                        </form>

                        <div className={styles.mobileCategoriesList}>
                            <Link
                                href="/"
                                onClick={() => setMobileMenuOpen(false)}
                                className={styles.mobileCatItem}
                            >
                                🏠 Inicio
                            </Link>

                            {rootCategories.map(cat => {
                                const subs = getSubcategories(cat.id);
                                const isExpanded = expandedMobileCategoryId === cat.id;

                                return (
                                    <div key={cat.id} className={styles.mobileCatGroup}>
                                        <div className={styles.mobileCatHeader}>
                                            <Link
                                                href={`/?categoria=${cat.slug || cat.id}#productos`}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={styles.mobileCatItem}
                                            >
                                                {cat.name}
                                            </Link>
                                            {subs.length > 0 && (
                                                <button
                                                    onClick={() => setExpandedMobileCategoryId(isExpanded ? null : cat.id)}
                                                    className={styles.mobileAccordionBtn}
                                                >
                                                    {isExpanded ? '▲' : '▼'}
                                                </button>
                                            )}
                                        </div>

                                        {subs.length > 0 && isExpanded && (
                                            <div className={styles.mobileSubGroup}>
                                                {subs.map(sub => (
                                                    <Link
                                                        key={sub.id}
                                                        href={`/?categoria=${sub.slug || sub.id}#productos`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className={styles.mobileSubItem}
                                                    >
                                                        ↳ {sub.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.mobileDrawerFooter}>
                            {user ? (
                                <>
                                    <Link
                                        href="/admin/pedidos"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={styles.mobileUserBtn}
                                    >
                                        📦 Mis Pedidos
                                    </Link>
                                    <button onClick={handleLogout} className={styles.mobileLogoutBtn}>
                                        🚪 Cerrar Sesión
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={styles.mobileLoginBtn}
                                >
                                    👤 Acceder a mi cuenta
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
