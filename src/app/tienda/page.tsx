import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { getHeroBannersAction, getStoreAppearanceAction } from '@/modules/appearance/actions';
import { getCategoriesListAction } from '@/modules/categories/actions';
import { getPublicCatalogProductsAction } from '@/modules/catalog/publicActions';
import { getFullStoreSettingsAction } from '@/modules/config/storeSettingsActions';
import SocialMiniStore from '@/components/public/social/SocialMiniStore';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const [appearanceRes, settingsRes] = await Promise.all([
        getStoreAppearanceAction(),
        getFullStoreSettingsAction(),
    ]);

    const storeName = settingsRes.settings?.storeName || appearanceRes.appearance?.store_name || 'TiendaVirt';
    const logoUrl = appearanceRes.appearance?.logo_url || '/LogoTienda.png';
    const description = `🛍️ Explora el catálogo de ${storeName} en TiendaVirt. Compra rápido con Yape, Plin, Tarjeta o directo por WhatsApp sin salir de tu aplicación.`;

    return {
        title: `${storeName} · Mini-Tienda Oficial | TiendaVirt`,
        description,
        openGraph: {
            title: `🛍️ Ver catálogo de ${storeName} en TiendaVirt`,
            description,
            type: 'website',
            images: [
                {
                    url: logoUrl,
                    width: 800,
                    height: 800,
                    alt: storeName,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `🛍️ ${storeName} · Compra en línea`,
            description,
            images: [logoUrl],
        },
    };
}

export default async function SocialStorePage() {
    const [appearanceRes, bannersRes, categoriesRes, productsRes, settingsRes] = await Promise.all([
        getStoreAppearanceAction(),
        getHeroBannersAction(),
        getCategoriesListAction(),
        getPublicCatalogProductsAction({ pageSize: 100 }),
        getFullStoreSettingsAction(),
    ]);

    const storeName =
        settingsRes.settings?.storeName ||
        appearanceRes.appearance?.store_name ||
        'TiendaVirt';

    const logoUrl = appearanceRes.appearance?.logo_url || '/LogoTienda.png';
    const bannerUrl = bannersRes.banners?.[0]?.image_url || undefined;
    const whatsappPhone = settingsRes.settings?.whatsappPhone || '+51 900 000 000';
    const categories = categoriesRes.categories || [];
    const products = productsRes.products || [];

    return (
        <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>Cargando tienda...</div>}>
            <SocialMiniStore
                storeName={storeName}
                logoUrl={logoUrl}
                bannerUrl={bannerUrl}
                whatsappPhone={whatsappPhone}
                categories={categories}
                initialProducts={products}
            />
        </Suspense>
    );
}

