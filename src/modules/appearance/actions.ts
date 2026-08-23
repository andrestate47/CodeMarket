'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export interface HeroBannerRecord {
    id: string;
    store_id?: string;
    title: string;
    subtitle?: string | null;
    badge_text?: string | null;
    price_amount?: number | null;
    compare_at_amount?: number | null;
    discount_tag?: string | null;
    image_url: string;
    mobile_image_url?: string | null;
    button_text: string;
    button_url: string;
    product_id?: string | null;
    is_active: boolean;
    sort_order: number;
    is_out_of_stock?: boolean;
}

export interface StoreAppearanceRecord {
    id?: string;
    store_id?: string;
    store_name: string;
    logo_url?: string | null;
    promo_bar_enabled: boolean;
    promo_bar_text: string;
    promo_bar_link: string;
    promo_bar_bg_color: string;
    promo_bar_text_color: string;
    primary_color: string;
    secondary_color: string;
    background_color: string;
    surface_color: string;
    text_color: string;
}

const DEFAULT_DEMO_BANNERS: HeroBannerRecord[] = [
    {
        id: 'banner-demo-1',
        title: 'NUEVA COLECCIÓN VAPES 2026',
        subtitle: 'Descubre los dispositivos más avanzados con sabor intenso, batería de larga duración y diseño ergonómico.',
        badge_text: 'LO MÁS VENDIDO',
        price_amount: 79.90,
        compare_at_amount: 99.90,
        discount_tag: '20% OFF',
        image_url: '/images/vapes/pod_system_xros.png',
        mobile_image_url: '/images/vapes/pod_system_xros.png',
        button_text: 'COMPRAR AHORA',
        button_url: '/#productos',
        is_active: true,
        sort_order: 1,
        is_out_of_stock: false,
    },
    {
        id: 'banner-demo-2',
        title: 'PODS RECARGABLES & KITS',
        subtitle: 'Rendimiento superior con tecnología mesh coil para mayor vaporización y sabor puro.',
        badge_text: 'OFERTA ESPECIAL',
        price_amount: 49.90,
        compare_at_amount: 65.00,
        discount_tag: '23% OFF',
        image_url: '/images/vapes/saltnic_mango_ice.png',
        button_text: 'VER DISPOSITIVOS',
        button_url: '/#productos',
        is_active: true,
        sort_order: 2,
        is_out_of_stock: false,
    },
    {
        id: 'banner-demo-3',
        title: 'LÍQUIDOS PREMIUM & ACCESORIOS',
        subtitle: 'Sabores frutales, mentolados y postres formulados con sales de nicotina de la más alta pureza.',
        badge_text: 'LANZAMIENTO',
        price_amount: 35.00,
        compare_at_amount: null,
        discount_tag: null,
        image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=1200&auto=format&fit=crop',
        button_text: 'EXPLORAR SABORES',
        button_url: '/#productos',
        is_active: true,
        sort_order: 3,
        is_out_of_stock: false,
    },
];

const DEFAULT_STORE_APPEARANCE: StoreAppearanceRecord = {
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
};

let appearanceCache: { data: StoreAppearanceRecord; timestamp: number } | null = null;
let heroBannersCache: { data: HeroBannerRecord[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 30000; // 30 seconds cache

/**
 * Fetch active Hero Banners for public homepage
 */
export async function getHeroBannersAction(): Promise<{
    success: boolean;
    banners: HeroBannerRecord[];
}> {
    if (heroBannersCache && (Date.now() - heroBannersCache.timestamp < CACHE_TTL_MS)) {
        return { success: true, banners: heroBannersCache.data };
    }

    try {
        const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project');
        if (isPlaceholder) {
            return { success: true, banners: DEFAULT_DEMO_BANNERS };
        }

        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from('hero_banners')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
            return { success: true, banners: DEFAULT_DEMO_BANNERS };
        }

        const banners: HeroBannerRecord[] = (data as unknown as Record<string, unknown>[]).map(b => ({
            id: String(b.id),
            store_id: b.store_id ? String(b.store_id) : undefined,
            title: String(b.title),
            subtitle: b.subtitle ? String(b.subtitle) : null,
            badge_text: b.badge_text ? String(b.badge_text) : null,
            price_amount: b.price_amount !== null && b.price_amount !== undefined ? Number(b.price_amount) : null,
            compare_at_amount: b.compare_at_amount !== null && b.compare_at_amount !== undefined ? Number(b.compare_at_amount) : null,
            discount_tag: b.discount_tag ? String(b.discount_tag) : null,
            image_url: String(b.image_url),
            mobile_image_url: b.mobile_image_url ? String(b.mobile_image_url) : null,
            button_text: b.button_text ? String(b.button_text) : 'COMPRAR AHORA',
            button_url: b.button_url ? String(b.button_url) : '/#productos',
            product_id: b.product_id ? String(b.product_id) : null,
            is_active: (b.is_active as boolean) ?? true,
            sort_order: (b.sort_order as number) ?? 0,
            is_out_of_stock: false,
        }));

        heroBannersCache = { data: banners, timestamp: Date.now() };
        return { success: true, banners };
    } catch {
        return { success: true, banners: DEFAULT_DEMO_BANNERS };
    }
}

/**
 * Fetch Store Appearance settings (Promo Bar, Logo, Colors)
 */
export async function getStoreAppearanceAction(): Promise<{
    success: boolean;
    appearance: StoreAppearanceRecord;
}> {
    if (appearanceCache && (Date.now() - appearanceCache.timestamp < CACHE_TTL_MS)) {
        return { success: true, appearance: appearanceCache.data };
    }
    try {
        const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project');
        if (isPlaceholder) {
            return { success: true, appearance: DEFAULT_STORE_APPEARANCE };
        }

        const adminClient = createAdminClient();
        
        // Fetch store name & logo
        const { data: storeData } = await adminClient
            .from('stores')
            .select('name, logo_url')
            .limit(1)
            .single();

        const { data: appData } = await adminClient
            .from('store_appearance')
            .select('*')
            .limit(1)
            .single();

        if (!appData) {
            return {
                success: true,
                appearance: {
                    ...DEFAULT_STORE_APPEARANCE,
                    store_name: storeData?.name || 'CODEMARKET',
                    logo_url: storeData?.logo_url || null,
                },
            };
        }

        const resultAppearance: StoreAppearanceRecord = {
            id: String(appData.id),
            store_id: appData.store_id ? String(appData.store_id) : undefined,
            store_name: storeData?.name || 'CODEMARKET',
            logo_url: storeData?.logo_url || appData.logo_url || null,
            promo_bar_enabled: appData.promo_bar_enabled ?? true,
            promo_bar_text: appData.promo_bar_text || DEFAULT_STORE_APPEARANCE.promo_bar_text,
            promo_bar_link: appData.promo_bar_link || DEFAULT_STORE_APPEARANCE.promo_bar_link,
            promo_bar_bg_color: appData.promo_bar_bg_color || DEFAULT_STORE_APPEARANCE.promo_bar_bg_color,
            promo_bar_text_color: appData.promo_bar_text_color || DEFAULT_STORE_APPEARANCE.promo_bar_text_color,
            primary_color: appData.primary_color || DEFAULT_STORE_APPEARANCE.primary_color,
            secondary_color: appData.secondary_color || DEFAULT_STORE_APPEARANCE.secondary_color,
            background_color: appData.background_color || DEFAULT_STORE_APPEARANCE.background_color,
            surface_color: appData.surface_color || DEFAULT_STORE_APPEARANCE.surface_color,
            text_color: appData.text_color || DEFAULT_STORE_APPEARANCE.text_color,
        };

        appearanceCache = { data: resultAppearance, timestamp: Date.now() };
        return { success: true, appearance: resultAppearance };
    } catch {
        return { success: true, appearance: DEFAULT_STORE_APPEARANCE };
    }
}
