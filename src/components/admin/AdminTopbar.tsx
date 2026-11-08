'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import styles from './AdminTopbar.module.css';
import AdminNotifications from './AdminNotifications';

interface AdminTopbarProps {
    title?: string;
    adminName?: string;
    adminEmail?: string;
    onToggleMobileMenu: () => void;
    onLogout: () => void;
}

function getDynamicSectionTitle(pathname: string): string {
    if (!pathname || pathname === '/admin') return 'Inicio';
    if (pathname.startsWith('/admin/pedidos/nuevo')) return 'Pedidos · Nuevo Pedido';
    if (pathname.includes('/generado')) return 'Pedidos · Pedido Generado';
    if (pathname.startsWith('/admin/pedidos/')) return 'Pedidos · Detalle del Pedido';
    if (pathname.startsWith('/admin/pedidos')) return 'Pedidos';
    if (pathname.startsWith('/admin/productos/nuevo')) return 'Productos · Nuevo Producto';
    if (pathname.startsWith('/admin/productos/')) return 'Productos · Editar Producto';
    if (pathname.startsWith('/admin/productos')) return 'Productos';
    if (pathname.startsWith('/admin/categorias')) return 'Categorías';
    if (pathname.startsWith('/admin/inventario')) return 'Inventario';
    if (pathname.startsWith('/admin/clientes')) return 'Clientes';
    if (pathname.startsWith('/admin/descuentos')) return 'Descuentos';
    if (pathname.startsWith('/admin/reportes')) return 'Reportes';
    if (pathname.startsWith('/admin/reviews')) return 'Valoraciones';
    if (pathname.startsWith('/admin/apariencia')) return 'Logo y Diseño';
    if (pathname.startsWith('/admin/configuracion')) return 'Configuración';
    if (pathname.startsWith('/admin/perfil')) return 'Mi Perfil';
    return 'Panel Administrativo';
}

export default function AdminTopbar({
    title,
    adminName = 'Administrador',
    adminEmail = 'admin@codemarket.com',
    onToggleMobileMenu,
    onLogout,
}: AdminTopbarProps) {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const dynamicTitle = title || getDynamicSectionTitle(pathname || '/admin');

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initials = adminName
        ? adminName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'AD';

    return (
        <header className={styles.topbar}>
            <div className={styles.leftSection}>
                <button
                    onClick={onToggleMobileMenu}
                    className={styles.mobileMenuBtn}
                    aria-label="Abrir menú de navegación"
                >
                    ☰
                </button>
                <h1 className={styles.title}>{dynamicTitle}</h1>
            </div>

            <div className={styles.searchContainer}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    type="search"
                    name="topbar_global_search"
                    autoComplete="off"
                    placeholder="Buscar pedidos, productos..."
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.rightSection}>
                <button
                    onClick={toggleTheme}
                    className={styles.themeToggleBtn}
                    aria-label="Cambiar tema"
                    title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                    {!mounted || theme === 'dark' ? '☀️' : '🌙'}
                </button>

                <Link href="/" className={styles.storeLink} target="_blank" rel="noopener noreferrer">
                    <span>🌐</span>
                    <span>Ver tienda</span>
                </Link>

                {/* Campana de Notificaciones con sonido para nuevos pedidos */}
                <AdminNotifications />

                {/* Menú de Perfil (Solo círculo con avatar) */}
                <div className={styles.profileMenu} ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className={styles.avatarBtn}
                        aria-expanded={dropdownOpen}
                        aria-label={`Perfil de ${adminName}`}
                        title={adminName}
                    >
                        <div className={styles.avatar}>{initials}</div>
                    </button>

                    {dropdownOpen && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownUserHeader}>
                                <div className={styles.dropdownAvatarMini}>{initials}</div>
                                <div className={styles.dropdownUserInfo}>
                                    <span className={styles.dropdownUserName}>{adminName}</span>
                                    <span className={styles.dropdownUserEmail} title={adminEmail}>
                                        {adminEmail}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.dropdownDivider} />

                            <Link
                                href="/admin/perfil"
                                className={styles.dropdownItem}
                                onClick={() => setDropdownOpen(false)}
                            >
                                👤 Mi perfil
                            </Link>
                            <Link
                                href="/admin/configuracion"
                                className={styles.dropdownItem}
                                onClick={() => setDropdownOpen(false)}
                            >
                                ⚙️ Configuración
                            </Link>
                            <button
                                onClick={() => {
                                    setDropdownOpen(false);
                                    onLogout();
                                }}
                                className={styles.dropdownItem}
                                style={{ color: '#f87171' }}
                            >
                                🚪 Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
