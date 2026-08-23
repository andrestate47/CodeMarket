'use client';

import React, { useState, useEffect } from 'react';
import styles from "./page.module.css";
import ProductCard from "@/components/ProductCard";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import { products } from "@/data/products";
import Navbar from "@/components/Navbar";
import PromoBar from "@/components/public/PromoBar";
import HeroHeroBanner from "@/components/public/HeroHeroBanner";
import { getHeroBannersAction, getStoreAppearanceAction, HeroBannerRecord, StoreAppearanceRecord } from "@/modules/appearance/actions";

export default function Home() {
    const [filter, setFilter] = useState('Todos');
    const [banners, setBanners] = useState<HeroBannerRecord[]>([]);
    const [appearance, setAppearance] = useState<StoreAppearanceRecord>({
        store_name: 'CODEMARKET',
        logo_url: null,
        promo_bar_enabled: true,
        promo_bar_text: '🚀 Envíos gratis a todo el Perú por compras desde S/ 150 | Delivery en 24h en Lima',
        promo_bar_link: '/#productos',
        promo_bar_bg_color: '#FF6B00',
        promo_bar_text_color: '#FFFFFF',
        primary_color: '#FF6B00',
        secondary_color: '#FF8A00',
        background_color: '#070707',
        surface_color: '#121212',
        text_color: '#FFFFFF',
    });

    useEffect(() => {
        getStoreAppearanceAction().then(res => {
            if (res.success && res.appearance) {
                setAppearance(res.appearance);
            }
        });

        getHeroBannersAction().then(res => {
            if (res.success && res.banners) {
                setBanners(res.banners);
            }
        });
    }, []);

    const filteredProducts = filter === 'Todos' 
        ? products 
        : products.filter(p => p.type === (filter === 'Servicios' ? 'service' : 'digital'));

    return (
        <main className={styles.main}>
            {/* TOP PROMOTIONAL ANNOUNCEMENT BAR */}
            <PromoBar
                enabled={appearance.promo_bar_enabled}
                text={appearance.promo_bar_text}
                link={appearance.promo_bar_link}
                bgColor={appearance.promo_bar_bg_color}
                textColor={appearance.promo_bar_text_color}
            />

            {/* PUBLIC HEADER */}
            <Navbar
                storeName={appearance.store_name}
                logoUrl={appearance.logo_url}
            />

            {/* PUBLIC HERO BANNER */}
            <HeroHeroBanner
                banners={banners}
                storeName={appearance.store_name}
            />

            {/* STORE SECTION */}
            <section className={styles.storeSection} id="productos">
                <div className={styles.storeHeader}>
                    <h2 className={styles.storeTitle}>
                        <span className="text-gradient">Colección de Productos</span>
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

            {/* TESTIMONIALS SECTION */}
            <Testimonials />

            {/* FAQ SECTION */}
            <FAQ />

            <footer style={{ background: 'var(--card-bg)', color: 'var(--text-muted)', padding: '60px 24px', textAlign: 'center', marginTop: 'auto', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ fontWeight: 900, fontSize: '2rem', marginBottom: '20px', letterSpacing: '-1px', color: 'var(--foreground)' }}>
                    {appearance.store_name} {'///'}
                </div>
                <p style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>© 2026 {appearance.store_name} Inc. Todos los derechos reservados.</p>
            </footer>
        </main>
    );
}
