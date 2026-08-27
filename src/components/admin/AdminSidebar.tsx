'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminSidebar.module.css';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    exact?: boolean;
    badge?: number | string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

interface AdminSidebarProps {
    onLogout?: () => void;
    pendingOrdersCount?: number;
    className?: string;
    onNavItemClick?: () => void;
    isMobileDrawer?: boolean;
}

export default function AdminSidebar({ onLogout, pendingOrdersCount, className, onNavItemClick, isMobileDrawer }: AdminSidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('admin_sidebar_collapsed');
            return saved === 'true';
        }
        return false;
    });

    const toggleCollapse = () => {
        const next = !collapsed;
        setCollapsed(next);
        try {
            localStorage.setItem('admin_sidebar_collapsed', String(next));
        } catch (e) {
            console.error('Failed to save sidebar collapsed state', e);
        }
    };

    const sections: NavSection[] = [
        {
            title: 'PRINCIPAL',
            items: [
                { label: 'Inicio', href: '/admin', exact: true, icon: '📊' },
                { label: 'Pedidos', href: '/admin/pedidos', icon: '📦', badge: pendingOrdersCount && pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
            ],
        },
        {
            title: 'CATÁLOGO',
            items: [
                { label: 'Productos', href: '/admin/productos', icon: '🏷️' },
                { label: 'Categorías', href: '/admin/categorias', icon: '🔖' },
                { label: 'Inventario', href: '/admin/inventario', icon: '🏬' },
            ],
        },
        {
            title: 'VENTAS',
            items: [
                { label: 'Clientes', href: '/admin/clientes', icon: '👥' },
                { label: 'Descuentos', href: '/admin/descuentos', icon: '🏷️' },
            ],
        },
        {
            title: 'ANÁLISIS',
            items: [
                { label: 'Reportes', href: '/admin/reportes', icon: '📈' },
                { label: 'Valoraciones', href: '/admin/reviews', icon: '⭐' },
            ],
        },
        {
            title: 'TIENDA',
            items: [
                { label: 'Apariencia', href: '/admin/apariencia', icon: '🎨' },
                { label: 'Configuración', href: '/admin/configuracion', icon: '⚙️' },
                { label: 'Ver Tienda', href: '/', icon: '👁️' },
            ],
        },
    ];

    const isLinkActive = (href: string, exact?: boolean) => {
        if (href === '/admin') {
            return pathname === '/admin';
        }
        if (href === '/admin/configuracion') {
            return pathname === '/admin/configuracion';
        }
        if (exact) {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(href + '/');
    };

    const asideContent = (
        <aside className={`${styles.sidebar} ${isMobileDrawer ? styles.mobileSidebar : ''} ${collapsed ? styles.sidebarCollapsed : ''} ${className || ''}`}>
            {/* Header */}
            <div className={styles.header}>
                <Link href="/admin" className={styles.brand} onClick={onNavItemClick}>
                    <div className={styles.logoIcon}>CM</div>
                    {!collapsed && <span className={styles.brandText}>CodeMarket</span>}
                </Link>

                <button
                    onClick={toggleCollapse}
                    className={styles.collapseBtn}
                    aria-label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
                    title={collapsed ? 'Expandir' : 'Contraer'}
                >
                    {collapsed ? '❯' : '❮'}
                </button>
            </div>

            {/* Nav List */}
            <div className={styles.navContainer}>
                {sections.map((section, sIdx) => (
                    <div key={sIdx} className={styles.section}>
                        {!collapsed && <div className={styles.sectionTitle}>{section.title}</div>}
                        {section.items.map((item, iIdx) => {
                            const active = isLinkActive(item.href, item.exact);
                            const isExternal = item.href === '/';

                            if (isExternal) {
                                return (
                                    <a
                                        key={iIdx}
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={onNavItemClick}
                                        className={styles.navItem}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <span className={styles.itemIcon}>{item.icon}</span>
                                        {!collapsed && <span className={styles.itemLabel}>{item.label} ↗</span>}
                                    </a>
                                );
                            }

                            return (
                                <Link
                                    key={iIdx}
                                    href={item.href}
                                    onClick={onNavItemClick}
                                    className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <span className={styles.itemIcon}>{item.icon}</span>
                                    {!collapsed && <span className={styles.itemLabel}>{item.label}</span>}
                                    {!collapsed && item.badge !== undefined && (
                                        <span className={styles.badge}>{item.badge}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Footer / Logout */}
            <div className={styles.footer}>
                {onLogout && (
                    <button
                        onClick={onLogout}
                        className={styles.navItem}
                        style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', color: 'var(--foreground)' }}
                        title={collapsed ? 'Cerrar sesión' : undefined}
                    >
                        <span className={styles.itemIcon}>🚪</span>
                        {!collapsed && <span className={styles.itemLabel}>Cerrar sesión</span>}
                    </button>
                )}
            </div>
        </aside>
    );

    if (isMobileDrawer) {
        return asideContent;
    }

    return (
        <>
            <div className={`${styles.sidebarSpacer} ${collapsed ? styles.sidebarSpacerCollapsed : ''}`} aria-hidden="true" />
            {asideContent}
        </>
    );
}
