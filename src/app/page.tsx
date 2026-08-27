import React, { Suspense } from 'react';
import styles from "./page.module.css";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Navbar from "@/components/Navbar";
import PromoBar from "@/components/public/PromoBar";
import HeroHeroBanner from "@/components/public/HeroHeroBanner";
import CategoryGridSection from "@/components/public/catalog/CategoryGridSection";
import FeaturedProductsSection from "@/components/public/catalog/FeaturedProductsSection";
import TrustBenefitsSection from "@/components/public/catalog/TrustBenefitsSection";
import HomeOffersSection from "@/components/public/catalog/HomeOffersSection";
import NewArrivalsSection from "@/components/public/catalog/NewArrivalsSection";
import SecondaryCommercialBanner from "@/components/public/catalog/SecondaryCommercialBanner";
import ProductCollectionSection from "@/components/public/catalog/ProductCollectionSection";
import ProductGridSkeleton from "@/components/public/catalog/ProductGridSkeleton";
import { getHeroBannersAction, getStoreAppearanceAction } from "@/modules/appearance/actions";
import { getCategoriesListAction } from "@/modules/categories/actions";

export const revalidate = 60; // Cache page for 60 seconds

export default async function Home() {
    // Fetch store appearance, hero banners, and categories in parallel on the server
    const [appearanceRes, bannersRes, categoriesRes] = await Promise.all([
        getStoreAppearanceAction(),
        getHeroBannersAction(),
        getCategoriesListAction(),
    ]);

    const appearance = appearanceRes.appearance || {
        store_name: 'CODEMARKET',
        logo_url: null,
        promo_bar_enabled: true,
        promo_bar_text: 'Envíos gratis a todo el Perú por compras desde S/150 | Delivery en 24h en Lima',
        promo_bar_link: '/#productos',
        promo_bar_bg_color: '#FF6B00',
        promo_bar_text_color: '#FFFFFF',
        primary_color: '#FF6B00',
        secondary_color: '#FF8A00',
        background_color: '#070707',
        surface_color: '#121212',
        text_color: '#FFFFFF',
    };

    const banners = bannersRes.banners || [];
    const categories = categoriesRes.categories || [];

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

            {/* 1. HERO PRINCIPAL */}
            <HeroHeroBanner
                banners={banners}
                storeName={appearance.store_name}
            />

            {/* 2. EXPLORAR CATEGORÍAS */}
            <CategoryGridSection categories={categories} />

            {/* 3. PRODUCTOS DESTACADOS / MÁS VENDIDOS */}
            <FeaturedProductsSection />

            {/* 4. BENEFICIOS DE COMPRAR EN LA TIENDA */}
            <TrustBenefitsSection />

            {/* 5. OFERTAS ESPECIALES (SE OCULTA AUTOMÁTICAMENTE SI HAY 0 OFERTAS) */}
            <HomeOffersSection />

            {/* 6. NOVEDADES / RECIÉN LLEGADOS */}
            <NewArrivalsSection />

            {/* 7. BANNER COMERCIAL SECUNDARIO */}
            <SecondaryCommercialBanner />

            {/* CATÁLOGO GENERAL INTERACTIVO */}
            <Suspense fallback={<ProductGridSkeleton count={8} />}>
                <ProductCollectionSection initialCategories={categories} />
            </Suspense>

            {/* TESTIMONIALES & FAQ */}
            <Testimonials />
            <FAQ />

            {/* 8. FOOTER */}
            <footer style={{ background: 'var(--card-bg)', color: 'var(--text-muted)', padding: '60px 24px', textAlign: 'center', marginTop: 'auto', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ fontWeight: 900, fontSize: '2rem', marginBottom: '20px', letterSpacing: '-1px', color: 'var(--foreground)' }}>
                    {appearance.store_name} {'///'}
                </div>
                <p style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>© 2026 {appearance.store_name} Inc. Todos los derechos reservados.</p>
            </footer>
        </main>
    );
}
