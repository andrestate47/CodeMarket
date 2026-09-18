-- ==========================================
-- TIENDAVIR - MIGRACIÓN CONSOLIDADA DE BASE DE DATOS (IDEMPOTENTE)
-- PostgreSQL + Supabase (Auth + RLS + Storage)
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STORES
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'TiendaVir',
    slug TEXT UNIQUE NOT NULL DEFAULT 'tiendavir',
    description TEXT,
    logo_url TEXT,
    email TEXT DEFAULT 'contacto@tiendavir.com',
    phone TEXT,
    whatsapp_phone TEXT DEFAULT '+51900000000',
    country_code TEXT DEFAULT 'PE',
    currency TEXT DEFAULT 'PEN',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar la tienda principal TiendaVir y CodeMarket
INSERT INTO public.stores (name, slug, description, email, whatsapp_phone, currency, status)
VALUES 
    ('TiendaVir', 'tiendavir', 'Tu tienda virtual de confianza con entrega rápida y productos destacados.', 'contacto@tiendavir.com', '+51900000000', 'PEN', 'active'),
    ('TiendaVir', 'codemarket', 'Tu tienda virtual de confianza con entrega rápida y productos destacados.', 'contacto@tiendavir.com', '+51900000000', 'PEN', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 2. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT categories_store_slug_key UNIQUE (store_id, slug)
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    short_description TEXT,
    description TEXT,
    product_type TEXT DEFAULT 'physical' CHECK (product_type IN ('digital', 'service', 'physical')),
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
    price_amount BIGINT NOT NULL CHECK (price_amount >= 0),
    compare_at_amount BIGINT CHECK (compare_at_amount >= 0),
    currency TEXT DEFAULT 'PEN',
    sku TEXT,
    track_inventory BOOLEAN DEFAULT FALSE,
    stock_quantity INT DEFAULT 0,
    stock_reserved INT DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT products_store_slug_key UNIQUE (store_id, slug)
);

-- 5. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    price_amount BIGINT NOT NULL CHECK (price_amount >= 0),
    stock_quantity INT DEFAULT 0,
    stock_reserved INT DEFAULT 0,
    attributes JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    alt_text TEXT,
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CUSTOMERS & ORDERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    document_type TEXT,
    document_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    currency TEXT DEFAULT 'PEN',
    subtotal_amount BIGINT NOT NULL CHECK (subtotal_amount >= 0),
    discount_amount BIGINT DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_amount BIGINT DEFAULT 0 CHECK (shipping_amount >= 0),
    total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
    paid_amount BIGINT DEFAULT 0,
    balance_amount BIGINT DEFAULT 0,
    source TEXT DEFAULT 'online_store',
    source_reference TEXT,
    order_status TEXT DEFAULT 'new',
    payment_method TEXT NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    fulfillment_status TEXT DEFAULT 'unfulfilled',
    delivery_type TEXT DEFAULT 'pickup',
    shipping_method_name TEXT,
    recipient_name TEXT,
    recipient_phone TEXT,
    shipping_department TEXT,
    shipping_province TEXT,
    shipping_district TEXT,
    shipping_address_line TEXT,
    shipping_reference TEXT,
    shipping_postal_code TEXT,
    discount_type TEXT,
    discount_value BIGINT DEFAULT 0,
    customer_notes TEXT,
    internal_notes TEXT,
    cancel_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    access_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    sku TEXT,
    unit_price_amount BIGINT NOT NULL CHECK (unit_price_amount >= 0),
    original_unit_price BIGINT,
    final_unit_price BIGINT,
    price_adjustment_reason TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDER EVENTS (Timeline / Audit log)
CREATE TABLE IF NOT EXISTS public.order_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ORDER NOTES (Internal administrative notes)
CREATE TABLE IF NOT EXISTS public.order_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ORDER PAYMENTS (Recorded payments)
CREATE TABLE IF NOT EXISTS public.order_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'PEN',
    status TEXT DEFAULT 'completed',
    reference TEXT,
    notes TEXT,
    recorded_by TEXT,
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ORDER TAGS
CREATE TABLE IF NOT EXISTS public.order_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT order_tags_store_name_key UNIQUE (store_id, name)
);

CREATE TABLE IF NOT EXISTS public.order_tag_assignments (
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.order_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (order_id, tag_id)
);

-- 12. HERO BANNERS
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

-- 13. STORE APPEARANCE
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

-- RLS POLICIES (DROP BEFORE CREATE FOR IDEMPOTENCY)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_appearance ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they already exist
DROP POLICY IF EXISTS "Public stores select" ON public.stores;
DROP POLICY IF EXISTS "Public categories select" ON public.categories;
DROP POLICY IF EXISTS "Public products select" ON public.products;
DROP POLICY IF EXISTS "Public variants select" ON public.product_variants;
DROP POLICY IF EXISTS "Public product images select" ON public.product_images;
DROP POLICY IF EXISTS "Public hero banners select" ON public.hero_banners;
DROP POLICY IF EXISTS "Public store appearance select" ON public.store_appearance;

DROP POLICY IF EXISTS "Admin full products" ON public.products;
DROP POLICY IF EXISTS "Admin full categories" ON public.categories;
DROP POLICY IF EXISTS "Admin full orders" ON public.orders;
DROP POLICY IF EXISTS "Admin full order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin full order_events" ON public.order_events;
DROP POLICY IF EXISTS "Admin full order_notes" ON public.order_notes;
DROP POLICY IF EXISTS "Admin full order_payments" ON public.order_payments;
DROP POLICY IF EXISTS "Admin full hero_banners" ON public.hero_banners;
DROP POLICY IF EXISTS "Admin full store_appearance" ON public.store_appearance;

-- Create Policies
CREATE POLICY "Public stores select" ON public.stores FOR SELECT USING (status = 'active');
CREATE POLICY "Public categories select" ON public.categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public products select" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Public variants select" ON public.product_variants FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public product images select" ON public.product_images FOR SELECT USING (TRUE);
CREATE POLICY "Public hero banners select" ON public.hero_banners FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public store appearance select" ON public.store_appearance FOR SELECT USING (TRUE);

CREATE POLICY "Admin full products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full orders" ON public.orders FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full order items" ON public.order_items FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full order_events" ON public.order_events FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full order_notes" ON public.order_notes FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full order_payments" ON public.order_payments FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full hero_banners" ON public.hero_banners FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full store_appearance" ON public.store_appearance FOR ALL USING (public.is_admin());
