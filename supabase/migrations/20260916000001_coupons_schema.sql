-- ==========================================
-- TIENDAVIR - MIGRACIÓN DE CUPONES Y DESCUENTOS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value BIGINT NOT NULL CHECK (discount_value > 0), -- En centavos (fixed) o % entero (percentage: 10 = 10%)
    min_purchase_amount BIGINT DEFAULT 0 CHECK (min_purchase_amount >= 0),
    max_uses INT,
    uses_count INT DEFAULT 0 CHECK (uses_count >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT coupons_store_code_key UNIQUE (store_id, code)
);

-- RLS POLICIES FOR COUPONS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Lectura pública para validación de cupones
CREATE POLICY "Public coupons select" ON public.coupons FOR SELECT USING (is_active = TRUE);

-- Control total de administradores
CREATE POLICY "Admin full coupons" ON public.coupons FOR ALL USING (public.is_admin());
