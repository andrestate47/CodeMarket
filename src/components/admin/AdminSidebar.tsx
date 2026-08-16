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
}

export default function AdminSidebar({ onLogout, pendingOrdersCount, className, onNavItemClick }: AdminSidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('admin_sidebar_collapsed');
            if (saved !== null) return saved === 'true';
        }
        return false;
    });

    const toggleCollapse = () => {
        const next = !collapsed;
        setCollapsed(next);
        if (typeof window !== 'undefined') {
            localStorage.setItem('admin_sidebar_collapsed', String(next));
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
                { label: 'Descuentos', href: '/admin/descuentos', icon: '🎟️' },
                { label: 'Reportes', href: '/admin/reportes', icon: '📈' },
            ],
        },
        {
            title: 'TIENDA',
            items: [
                { label: 'Apariencia', href: '/admin/apariencia', icon: '🎨' },
                { label: 'Usuarios y Permisos', href: '/admin/configuracion/usuarios', icon: '🔐' },
                { label: 'Métodos de pago', href: '/admin/configuracion/pagos', icon: '💳' },
                { label: 'Envíos', href: '/admin/configuracion/envios', icon: '🚚' },
                { label: 'Dominio y SEO', href: '/admin/configuracion/dominio-seo', icon: '🌐' },
                { label: 'Integraciones', href: '/admin/configuracion/integraciones', icon: '🔌' },
                { label: 'Configuración', href: '/admin/configuracion', exact: true, icon: '⚙️' },
            ],
        },
        {
            title: 'CUENTA',
            items: [
                { label: 'Mi perfil', href: '/admin/perfil', icon: '👤' },
                { label: 'Ver tienda', href: '/', icon: '🛍️' },
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

    return (
        <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''} ${className || ''}`}>
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
}
