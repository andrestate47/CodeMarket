'use client';

import React, { useState } from 'react';
import styles from "./page.module.css";
import ProductCard from "@/components/ProductCard";
import Carousel from "@/components/Carousel";
import Testimonials from "@/components/Testimonials";
import { products } from "@/data/products";

import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";

export default function Home() {
  const [filter, setFilter] = useState('Digital');
  const { toggleCart, items } = useCart();
  const { theme, toggleTheme } = useTheme();

  const filteredProducts = products.filter(p => p.type === (filter === 'Servicios' ? 'service' : 'digital'));

  return (
    <main className={styles.main}>
      {/* Header (Simplified) */}
      <header className="glass" style={{ padding: '20px 0', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-1px' }}>CODEMARKET ///</div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', padding: '8px', display: 'flex' }}
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

            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>CARRITO ({items.length})</span>
            <button
              onClick={toggleCart}
              style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', padding: '8px' }}
              aria-label="Cart"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Carousel */}
      <section style={{ paddingTop: '20px', marginBottom: '60px' }}>
        <Carousel />
      </section>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            El próximo nivel de tu negocio <br /> <span className="text-gradient">empieza online.</span>
          </h1>
          <p className={styles.subtitle}>
            Soluciones digitales para el crecimiento de tu negocio.
            <br className="hidden md:block" />
            Tecnología, diseño y estrategia combinados en productos digitales que impulsan tu marca y te ayudan a escalar de forma inteligente.
          </p>
        </div>
      </section>

      {/* Store Section */}
      <section className={styles.storeSection}>
        <div className={styles.storeHeader}>
          <h2 className={styles.storeTitle}>
            <span className="text-gradient">Colección</span>
          </h2>
          <div className={styles.filterBar}>
            {['Digital', 'Servicios'].map((item) => (
              <span
                key={item}
                className={`${styles.filterItem} ${filter === item ? styles.active : ''}`}
                onClick={() => setFilter(item)}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      <footer style={{ background: 'var(--card-bg)', color: 'var(--text-muted)', padding: '60px 24px', textAlign: 'center', marginTop: 'auto', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ fontWeight: 900, fontSize: '2rem', marginBottom: '20px', letterSpacing: '-1px', color: 'var(--foreground)' }}>CODEMARKET ///</div>
        <p style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>© 2026 CodeMarket Inc.</p>
      </footer>
    </main>
  );
}
