-- ==========================================
-- CODEMARKET - MIGRACIÓN INICIAL DE BASE DE DATOS
-- PostgreSQL + Supabase (Auth + RLS + Storage)
-- ==========================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STORES (Abstracción de tienda - registro inicial CodeMarket)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'CodeMarket',
    slug TEXT UNIQUE NOT NULL DEFAULT 'codemarket',
    description TEXT,
    logo_url TEXT,
    email TEXT DEFAULT 'contacto@codemarket.com',
    phone TEXT,
    whatsapp_phone TEXT DEFAULT '+51900000000',
    country_code TEXT DEFAULT 'PE',
    currency TEXT DEFAULT 'PEN',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar la tienda inicial única de CodeMarket
INSERT INTO public.stores (name, slug, description, email, whatsapp_phone, currency, status)
VALUES ('CodeMarket', 'codemarket', 'La plataforma líder para comprar plantillas, kits web y servicios de desarrollo.', 'contacto@codemarket.com', '+51900000000', 'PEN', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 2. PROFILES (Perfiles de usuarios integrados con Supabase Auth)
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

-- Trigger automático para crear perfil cuando se registra un usuario en Supabase Auth
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
    product_type TEXT DEFAULT 'digital' CHECK (product_type IN ('digital', 'service', 'physical')),
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
    price_amount BIGINT NOT NULL CHECK (price_amount >= 0), -- En centavos (ej: S/ 49.00 -> 4900)
    compare_at_amount BIGINT CHECK (compare_at_amount >= 0),
    currency TEXT DEFAULT 'PEN',
    sku TEXT,
    track_inventory BOOLEAN DEFAULT FALSE,
    stock_quantity INT DEFAULT 0,
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

-- 7. CUSTOMERS
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

-- 8. CUSTOMER ADDRESSES
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Principal',
    recipient_name TEXT NOT NULL,
    phone TEXT,
    country TEXT DEFAULT 'Perú',
    department TEXT,
    province TEXT,
    district TEXT,
    address_line TEXT NOT NULL,
    reference TEXT,
    postal_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ORDERS
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
    payment_method TEXT NOT NULL CHECK (payment_method IN ('yape', 'plin', 'bank_transfer', 'cash_on_delivery', 'quote_request', 'external_payment_link')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'under_review', 'paid', 'failed', 'refunded')),
    fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    customer_notes TEXT,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ORDER ITEMS
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
    quantity INT NOT NULL CHECK (quantity > 0),
    total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ORDER STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status_type TEXT NOT NULL CHECK (status_type IN ('payment', 'fulfillment')),
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. INVENTORY MOVEMENTS
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('initial', 'manual_adjustment', 'sale', 'cancellation', 'refund', 'restock')),
    quantity INT NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. PAYMENT SETTINGS
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK (method IN ('yape', 'plin', 'bank_transfer', 'cash_on_delivery', 'quote_request', 'external_payment_link')),
    display_name TEXT NOT NULL,
    instructions TEXT,
    account_holder TEXT,
    account_identifier TEXT,
    qr_image_path TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT payment_settings_store_method_key UNIQUE (store_id, method)
);

-- 14. STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID UNIQUE NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    support_email TEXT DEFAULT 'soporte@codemarket.com',
    support_phone TEXT DEFAULT '+51900000000',
    whatsapp_phone TEXT DEFAULT '+51900000000',
    order_prefix TEXT DEFAULT 'CM-',
    low_stock_threshold INT DEFAULT 5,
    allow_guest_checkout BOOLEAN DEFAULT TRUE,
    require_customer_account BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Helper Function para verificar si el usuario actual es Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lectura pública para la tienda activa, categorías activas, productos activos, imágenes y pagos
CREATE POLICY "Public stores select" ON public.stores FOR SELECT USING (status = 'active');
CREATE POLICY "Public categories select" ON public.categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public products select" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Public variants select" ON public.product_variants FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public product images select" ON public.product_images FOR SELECT USING (TRUE);
CREATE POLICY "Public payment settings select" ON public.payment_settings FOR SELECT USING (is_active = TRUE);

-- Permisos del Perfil de Usuario
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.is_admin());

-- Permisos de Pedidos para Clientes
CREATE POLICY "Customers read own orders" ON public.orders FOR SELECT USING (
    customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    OR public.is_admin()
);
CREATE POLICY "Customers read own order items" ON public.order_items FOR SELECT USING (
    order_id IN (
        SELECT id FROM public.orders WHERE customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    ) OR public.is_admin()
);

-- Control total de Administradores en todas las tablas
CREATE POLICY "Admin full stores" ON public.stores FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full variants" ON public.product_variants FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full images" ON public.product_images FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full customers" ON public.customers FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full addresses" ON public.customer_addresses FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full orders" ON public.orders FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full order items" ON public.order_items FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full status history" ON public.order_status_history FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full inventory" ON public.inventory_movements FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full payment settings" ON public.payment_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full store settings" ON public.store_settings FOR ALL USING (public.is_admin());
