'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { toggleCart, items } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = React.useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
       router.push(`/?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className={`${styles.header} glass`}>
      <div className={styles.container}>
        <Link href="/" className={styles.brand}>
          CODEMARKET ///
        </Link>
        
        <nav className={styles.nav}>
          {/* Animated Search Bar */}
          <form 
            onSubmit={handleSearch} 
            className={`${styles.searchForm} ${isSearchOpen ? styles.searchFormOpen : ''}`}
          >
            <button 
              type={isSearchOpen ? "submit" : "button"}
              onClick={() => {
                if (!isSearchOpen) setIsSearchOpen(true);
              }}
              className={styles.searchButton}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
            <input 
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => !searchQuery && setIsSearchOpen(false)}
              className={styles.searchInput}
              style={{
                width: isSearchOpen ? '150px' : '0px',
                opacity: isSearchOpen ? 1 : 0,
              }}
            />
          </form>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {user ? (
            <Link href="/dashboard" className={styles.accountLink}>
              Mi Cuenta
            </Link>
          ) : (
            <Link href="/login" className={styles.accountLink}>
              Acceder
            </Link>
          )}

          <div className={styles.cartWrapper}>
            <span className={styles.cartLabel}>CARRITO</span>
            <button
              onClick={toggleCart}
              className={styles.cartButton}
              aria-label="Cart"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {items.length > 0 && (
                <span className={styles.cartBadge}>{items.length}</span>
              )}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
