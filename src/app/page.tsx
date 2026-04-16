'use client';

import React, { useState } from 'react';
import styles from "./page.module.css";
import ProductCard from "@/components/ProductCard";
import Carousel from "@/components/Carousel";
import Testimonials from "@/components/Testimonials";
import TechBanner from "@/components/TechBanner";
import FAQ from "@/components/FAQ";
import { products } from "@/data/products";

import Navbar from "@/components/Navbar";

export default function Home() {
  const [filter, setFilter] = useState('Todos');

  const filteredProducts = filter === 'Todos' 
    ? products 
    : products.filter(p => p.type === (filter === 'Servicios' ? 'service' : 'digital'));

  return (
    <main className={styles.main}>
      <Navbar />

      {/* Hero Carousel */}
      <section style={{ paddingTop: '20px' }}>
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
            {['Todos', 'Digital', 'Servicios'].map((item) => (
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

      {/* Technology Banner */}
      <TechBanner />

      {/* Testimonials Section */}
      <Testimonials />

      {/* FAQ Section */}
      <FAQ />

      <footer style={{ background: 'var(--card-bg)', color: 'var(--text-muted)', padding: '60px 24px', textAlign: 'center', marginTop: 'auto', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ fontWeight: 900, fontSize: '2rem', marginBottom: '20px', letterSpacing: '-1px', color: 'var(--foreground)' }}>CODEMARKET ///</div>
        <p style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>© 2026 CodeMarket Inc.</p>
      </footer>
    </main>
  );
}
