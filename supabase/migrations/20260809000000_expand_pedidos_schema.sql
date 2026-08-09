-- ==========================================
-- CODEMARKET - MIGRACIÓN EXPANSION MÓDULO PEDIDOS (FASES A y B)
-- ==========================================

-- 1. EXTENDER TABLA ORDERS
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'online_store',
    ADD COLUMN IF NOT EXISTS source_reference TEXT,
    ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'new',
    ADD COLUMN IF NOT EXISTS paid_amount BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS balance_amount BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'pickup',
    ADD COLUMN IF NOT EXISTS shipping_method_name TEXT,
    ADD COLUMN IF NOT EXISTS recipient_name TEXT,
    ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
    ADD COLUMN IF NOT EXISTS shipping_department TEXT,
    ADD COLUMN IF NOT EXISTS shipping_province TEXT,
    ADD COLUMN IF NOT EXISTS shipping_district TEXT,
    ADD COLUMN IF NOT EXISTS shipping_address_line TEXT,
    ADD COLUMN IF NOT EXISTS shipping_reference TEXT,
    ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
    ADD COLUMN IF NOT EXISTS discount_type TEXT,
    ADD COLUMN IF NOT EXISTS discount_value BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. EXTENDER TABLA ORDER_ITEMS
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS original_unit_price BIGINT,
    ADD COLUMN IF NOT EXISTS final_unit_price BIGINT,
    ADD COLUMN IF NOT EXISTS price_adjustment_reason TEXT,
    ADD COLUMN IF NOT EXISTS adjusted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. EXTENDER TABLAS DE INVENTARIO PARA STOCK RESERVADO
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS stock_reserved INT DEFAULT 0;

ALTER TABLE public.product_variants
    ADD COLUMN IF NOT EXISTS stock_reserved INT DEFAULT 0;

-- 4. NUEVA TABLA ORDER_EVENTS (Historial de Auditoría / Timeline)
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

-- 5. NUEVA TABLA ORDER_NOTES (Notas Internas Administrativas)
CREATE TABLE IF NOT EXISTS public.order_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. NUEVA TABLA ORDER_PAYMENTS (Pagos Registrados)
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

-- 7. NUEVAS TABLAS ORDER_TAGS Y ORDER_TAG_ASSIGNMENTS (Etiquetas)
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

-- HABILITAR RLS EN NUEVAS TABLAS
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tag_assignments ENABLE ROW LEVEL SECURITY;

-- POLITICAS DE ACCESO PARA ADMIN EN NUEVAS TABLAS
CREATE POLICY "Admin full order_events" ON public.order_events FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full order_notes" ON public.order_notes FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full order_payments" ON public.order_payments FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full order_tags" ON public.order_tags FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full order_tag_assignments" ON public.order_tag_assignments FOR ALL USING (public.is_admin());

-- INSERTAR ETIQUETAS INICIALES POR DEFECTO PARA CODEMARKET
DO $$
DECLARE
    v_store_id UUID;
BEGIN
    SELECT id INTO v_store_id FROM public.stores WHERE slug = 'codemarket' LIMIT 1;
    IF v_store_id IS NOT NULL THEN
        INSERT INTO public.order_tags (store_id, name, color) VALUES
            (v_store_id, 'VIP', '#8b5cf6'),
            (v_store_id, 'Urgente', '#ef4444'),
            (v_store_id, 'Mayorista', '#10b981'),
            (v_store_id, 'Recurrente', '#06b6d4'),
            (v_store_id, 'Problema', '#f59e0b'),
            (v_store_id, 'Recojo tienda', '#3b82f6')
        ON CONFLICT (store_id, name) DO NOTHING;
    END IF;
END $$;
