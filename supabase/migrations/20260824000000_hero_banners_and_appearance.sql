-- ==========================================
-- MIGRACIÓN DE TABLAS DE HÉROE Y APARIENCIA
-- ==========================================

-- 1. HERO BANNERS (Carrusel / Banners del Hero)
CREATE TABLE IF NOT EXISTS public.hero_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    badge_text TEXT,
    price_amount NUMERIC(10,2),
    compare_at_amount NUMERIC(10,2),
    discount_tag TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    button_text TEXT DEFAULT 'COMPRAR AHORA',
    button_url TEXT DEFAULT '/#productos',
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hero_banners_active_order ON public.hero_banners(is_active, sort_order);

-- 2. STORE APPEARANCE (Configuración visual y barra de promociones)
CREATE TABLE IF NOT EXISTS public.store_appearance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
    promo_bar_enabled BOOLEAN DEFAULT true,
    promo_bar_text TEXT DEFAULT '🚀 Envíos gratis a todo el Perú por compras desde S/ 150',
    promo_bar_link TEXT DEFAULT '/#productos',
    promo_bar_bg_color TEXT DEFAULT '#FF6B00',
    promo_bar_text_color TEXT DEFAULT '#FFFFFF',
    primary_color TEXT DEFAULT '#FF6B00',
    secondary_color TEXT DEFAULT '#FF8A00',
    background_color TEXT DEFAULT '#070707',
    surface_color TEXT DEFAULT '#121212',
    text_color TEXT DEFAULT '#FFFFFF',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserción inicial de la apariencia por defecto para CodeMarket
INSERT INTO public.store_appearance (
    store_id,
    promo_bar_enabled,
    promo_bar_text,
    promo_bar_link,
    promo_bar_bg_color,
    promo_bar_text_color
)
SELECT 
    id,
    true,
    '🚀 Envíos gratis a todo el Perú por compras desde S/ 150 | ¡Aprovecha nuestras ofertas!',
    '/#productos',
    '#FF6B00',
    '#FFFFFF'
FROM public.stores 
WHERE slug = 'codemarket'
ON CONFLICT (store_id) DO NOTHING;

-- Inserción inicial de banners demo del Hero
INSERT INTO public.hero_banners (
    title,
    subtitle,
    badge_text,
    price_amount,
    compare_at_amount,
    discount_tag,
    image_url,
    button_text,
    button_url,
    sort_order,
    is_active
) VALUES 
(
    'NUEVA COLECCIÓN VAPES 2026',
    'Descubre los dispositivos más avanzados con sabor intenso, batería de larga duración y diseño ergonómico.',
    'LO MÁS VENDIDO',
    79.90,
    99.90,
    '20% OFF',
    'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=1200&auto=format&fit=crop',
    'COMPRAR AHORA',
    '/#productos',
    1,
    true
),
(
    'PODS RECARGABLES & KITS',
    'Rendimiento superior con tecnología mesh coil para mayor vaporización y sabor puro.',
    'OFERTA ESPECIAL',
    49.90,
    65.00,
    '23% OFF',
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1200&auto=format&fit=crop',
    'VER DISPOSITIVOS',
    '/#productos',
    2,
    true
),
(
    'LÍQUIDOS PREMIUM & ACCESORIOS',
    'Sabores frutales, mentolados y postres formulados con sales de nicotina de la más alta pureza.',
    'LANZAMIENTO',
    35.00,
    NULL,
    NULL,
    'https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=1200&auto=format&fit=crop',
    'EXPLORAR SABORES',
    '/#productos',
    3,
    true
);
