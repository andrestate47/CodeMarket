'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import styles from './AdminSidebar.module.css';
import TiendaVirLogo from '../brand/TiendaVirLogo';

interface NavItem {
    label: string;
    href?: string;
    icon: React.ReactNode;
    exact?: boolean;
    badge?: number | string;
    subItems?: { label: string; href: string; exact?: boolean }[];
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

// Componente principal envuelto para evitar problemas con useSearchParams
export default function AdminSidebar(props: AdminSidebarProps) {
    return (
        <React.Suspense fallback={<aside className={`${styles.sidebar} ${props.isMobileDrawer ? styles.mobileSidebar : ''}`} />}>
            <AdminSidebarContent {...props} />
        </React.Suspense>
    );
}

function AdminSidebarContent({ onLogout, pendingOrdersCount, className, onNavItemClick, isMobileDrawer }: AdminSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('admin_sidebar_collapsed');
            return saved === 'true';
        }
        return false;
    });

    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
        if (typeof window !== 'undefined') {
            try {
                return JSON.parse(localStorage.getItem('admin_sidebar_expanded') || '{"Configuración": true}');
            } catch (e) { }
        }
        return { "Configuración": true };
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

    const toggleMenu = (label: string) => {
        const next = { ...expandedMenus, [label]: !expandedMenus[label] };
        setExpandedMenus(next);
        try {
            localStorage.setItem('admin_sidebar_expanded', JSON.stringify(next));
        } catch (e) { }
    };

    const iconProps = {
        width: 19,
        height: 19,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.9,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    };

    const sections: NavSection[] = [
        {
            title: 'PRINCIPAL',
            items: [
                {
                    label: 'Inicio',
                    href: '/admin',
                    exact: true,
                    icon: (
                        <svg {...iconProps}>
                            <rect x="3" y="3" width="7" height="9" rx="1.5" />
                            <rect x="14" y="3" width="7" height="5" rx="1.5" />
                            <rect x="14" y="12" width="7" height="9" rx="1.5" />
                            <rect x="3" y="16" width="7" height="5" rx="1.5" />
                        </svg>
                    ),
                },
                {
                    label: 'Pedidos',
                    href: '/admin/pedidos',
                    badge: pendingOrdersCount && pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
                    icon: (
                        <svg {...iconProps}>
                            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                            <path d="m3.3 7 8.7 5 8.7-5" />
                            <path d="M12 22V12" />
                        </svg>
                    ),
                },
            ],
        },
        {
            title: 'CATÁLOGO',
            items: [
                {
                    label: 'Productos',
                    href: '/admin/productos',
                    icon: (
                        <svg {...iconProps}>
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                            <line x1="7" y1="7" x2="7.01" y2="7" />
                        </svg>
                    ),
                },
                {
                    label: 'Categorías',
                    href: '/admin/categorias',
                    icon: (
                        <svg {...iconProps}>
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                        </svg>
                    ),
                },
                {
                    label: 'Inventario',
                    href: '/admin/inventario',
                    icon: (
                        <svg {...iconProps}>
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                            <path d="M9 12h6" />
                            <path d="M9 16h6" />
                        </svg>
                    ),
                },
            ],
        },
        {
            title: 'VENTAS',
            items: [
                {
                    label: 'Clientes',
                    href: '/admin/clientes',
                    icon: (
                        <svg {...iconProps}>
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    ),
                },
                {
                    label: 'Descuentos',
                    href: '/admin/descuentos',
                    icon: (
                        <svg {...iconProps}>
                            <line x1="19" y1="5" x2="5" y2="19" />
                            <circle cx="6.5" cy="6.5" r="2.5" />
                            <circle cx="17.5" cy="17.5" r="2.5" />
                        </svg>
                    ),
                },
            ],
        },
        {
            title: 'ANÁLISIS',
            items: [
                {
                    label: 'Reportes',
                    href: '/admin/reportes',
                    icon: (
                        <svg {...iconProps}>
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                    ),
                },
                {
                    label: 'Valoraciones',
                    href: '/admin/reviews',
                    icon: (
                        <svg {...iconProps}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    ),
                },
            ],
        },
        {
            title: 'TIENDA',
            items: [
                {
                    label: 'Configuración',
                    icon: (
                        <svg {...iconProps}>
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    ),
                    subItems: [
                        { label: 'Info. General', href: '/admin/configuracion?tab=general' },
                        { label: 'Logo y Diseño', href: '/admin/apariencia' },
                        { label: 'Métodos de pago', href: '/admin/configuracion?tab=payments' },
                        { label: 'Envíos y recogidas', href: '/admin/configuracion?tab=shipping' },
                        { label: 'Ventas', href: '/admin/configuracion?tab=checkout' },
                        { label: 'Usuarios', href: '/admin/configuracion/usuarios' },
                    ]
                },
                {
                    label: 'Mini-Tienda Social',
                    href: '/admin/social',
                    icon: (
                        <svg {...iconProps}>
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                            <line x1="12" y1="18" x2="12.01" y2="18" />
                        </svg>
                    ),
                },
                {
                    label: 'Ver Tienda',
                    href: '/',
                    icon: (
                        <svg {...iconProps}>
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    ),
                },
                {
                    label: 'Integraciones',
                    href: '/admin/integraciones',
                    icon: (
                        <svg {...iconProps}>
                            <path d="M12 22v-5" />
                            <path d="M9 8V2" />
                            <path d="M15 8V2" />
                            <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
                        </svg>
                    ),
                },
            ],
        },
    ];

    const isLinkActive = (href: string, exact?: boolean) => {
        try {
            const url = new URL(href, 'http://localhost');
            const pathMatches = exact ? pathname === url.pathname : (pathname === url.pathname || pathname.startsWith(url.pathname + '/'));
            
            if (!pathMatches) return false;

            // If the href has search params, ensure they match exactly
            if (url.searchParams.toString()) {
                let paramsMatch = true;
                url.searchParams.forEach((value, key) => {
                    if (searchParams.get(key) !== value) {
                        paramsMatch = false;
                    }
                });
                
                // Particular case: /admin/configuracion without tab param defaults to general
                if (!paramsMatch && url.pathname === '/admin/configuracion' && url.searchParams.get('tab') === 'general' && !searchParams.get('tab')) {
                    return true; 
                }

                return paramsMatch;
            }

            // Particular case: if we are matching exactly a pathname, but the current URL has a tab param, it's not a strict match unless it's the exact same query
            if (exact && searchParams.toString() && !url.searchParams.toString()) {
                // Ignore query params for 'exact' if they don't matter, but in our case they do for tabs.
                // Wait, if it's /admin/configuracion and they have a tab, it might falsely highlight another tab if it doesn't check.
            }

            return true;
        } catch (e) {
            return false;
        }
    };

    const asideContent = (
        <aside className={`${styles.sidebar} ${isMobileDrawer ? styles.mobileSidebar : ''} ${collapsed ? styles.sidebarCollapsed : ''} ${className || ''}`}>
            {/* Header */}
            <div className={styles.header}>
                <div onClick={onNavItemClick} style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                    <TiendaVirLogo href="/admin" size="small" showTagline={false} storeName="TiendaVir" iconOnly={collapsed} />
                </div>

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

                            const hasSubItems = item.subItems && item.subItems.length > 0;
                            
                            if (hasSubItems) {
                                const isExpanded = expandedMenus[item.label];
                                const isActiveGroup = item.subItems!.some(sub => isLinkActive(sub.href, sub.exact));

                                return (
                                    <div key={iIdx}>
                                        <div
                                            onClick={() => {
                                                if (collapsed) toggleCollapse();
                                                toggleMenu(item.label);
                                            }}
                                            className={`${styles.navItem} ${isActiveGroup && !isExpanded ? styles.navItemActive : ''}`}
                                            title={collapsed ? item.label : undefined}
                                            style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span className={styles.itemIcon}>{item.icon}</span>
                                                {!collapsed && <span className={styles.itemLabel}>{item.label}</span>}
                                            </div>
                                            {!collapsed && (
                                                <span style={{ fontSize: '0.7rem', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', opacity: 0.6 }}>
                                                    ▼
                                                </span>
                                            )}
                                        </div>
                                        
                                        {!collapsed && isExpanded && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '34px', marginTop: '2px', marginBottom: '8px' }}>
                                                {item.subItems!.map((sub, sIdx) => {
                                                    const subActive = isLinkActive(sub.href, sub.exact);
                                                    return (
                                                        <Link
                                                            key={sIdx}
                                                            href={sub.href}
                                                            onClick={onNavItemClick}
                                                            className={`${styles.navItem} ${subActive ? styles.navItemActive : ''}`}
                                                            style={{ 
                                                                padding: '6px 10px', 
                                                                minHeight: 'auto', 
                                                                fontSize: '0.85rem',
                                                                background: subActive ? 'var(--robotina-orange-10)' : 'transparent',
                                                                color: subActive ? 'var(--robotina-orange)' : 'var(--text-muted)'
                                                            }}
                                                        >
                                                            {sub.label}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            const active = isLinkActive(item.href!, item.exact);

                            return (
                                <Link
                                    key={iIdx}
                                    href={item.href!}
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
                        style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
                        title={collapsed ? 'Cerrar sesión' : undefined}
                    >
                        <span className={styles.itemIcon}>
                            <svg {...iconProps}>
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </span>
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
