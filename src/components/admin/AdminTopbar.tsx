'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import styles from './AdminTopbar.module.css';

interface AdminTopbarProps {
    title?: string;
    adminName?: string;
    adminEmail?: string;
    onToggleMobileMenu: () => void;
    onLogout: () => void;
}

export default function AdminTopbar({
    title = 'Panel Administrativo',
    adminName = 'Administrador',
    adminEmail = 'admin@codemarket.com',
    onToggleMobileMenu,
    onLogout,
}: AdminTopbarProps) {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(() => typeof window !== 'undefined');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
                <h1 className={styles.title}>{title}</h1>
            </div>

            <div className={styles.searchContainer}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    type="text"
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

                <div className={styles.profileMenu} ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className={styles.avatarBtn}
                        aria-expanded={dropdownOpen}
                        aria-label="Menú de perfil"
                    >
                        <div className={styles.avatar}>{initials}</div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{adminName}</span>
                            <span className={styles.userRole}>{adminEmail}</span>
                        </div>
                    </button>

                    {dropdownOpen && (
                        <div className={styles.dropdown}>
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
