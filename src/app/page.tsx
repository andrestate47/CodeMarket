import React, { Suspense } from 'react';
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import PromoBar from "@/components/public/PromoBar";
import HeroHeroBanner from "@/components/public/HeroHeroBanner";
import CategoryGridSection from "@/components/public/catalog/CategoryGridSection";
import TrustBenefitsSection from "@/components/public/catalog/TrustBenefitsSection";
import ProductCollectionSection from "@/components/public/catalog/ProductCollectionSection";
import ProductGridSkeleton from "@/components/public/catalog/ProductGridSkeleton";
import { getHeroBannersAction, getStoreAppearanceAction } from "@/modules/appearance/actions";
import { getCategoriesListAction } from "@/modules/categories/actions";

import Footer from "@/components/public/Footer";

export const revalidate = 60; // Cache page for 60 seconds

export default async function Home() {
    // Fetch store appearance, hero banners, and categories in parallel on the server
    const [appearanceRes, bannersRes, categoriesRes] = await Promise.all([
        getStoreAppearanceAction(),
        getHeroBannersAction(),
        getCategoriesListAction(),
    ]);

    const appearance = appearanceRes.appearance || {
        store_name: 'Tienda-Vir',
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

            {/* 3. CATÁLOGO GENERAL INTERACTIVO (CON BUSCADOR Y FILTROS) */}
            <Suspense fallback={<ProductGridSkeleton count={8} />}>
                <ProductCollectionSection initialCategories={categories} />
            </Suspense>

            {/* 4. BENEFICIOS Y GARANTÍAS DE COMPRAR EN LA TIENDA */}
            <TrustBenefitsSection />

            {/* 5. FOOTER */}
            <Footer storeName={appearance.store_name} />
        </main>
    );
}
