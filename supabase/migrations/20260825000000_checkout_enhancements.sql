-- ==========================================
-- CODEMARKET - MIGRACIÓN CHECKOUT Y PAGOS (FASE FÍSICA)
-- ==========================================

-- 1. EXTENDER TABLA ORDERS PARA ACCESS TOKEN Y COMPROBANTES
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT uuid_generate_v4() UNIQUE,
    ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
    ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS shipping_method_id TEXT,
    ADD COLUMN IF NOT EXISTS is_age_confirmed BOOLEAN DEFAULT FALSE;

-- Index para búsqueda rápida por access_token
CREATE INDEX IF NOT EXISTS idx_orders_access_token ON public.orders(access_token);

-- 2. CREAR BUCKET DE STORAGE PARA COMPROBANTES DE PAGO
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para Comprobantes
DROP POLICY IF EXISTS "Public payment receipts upload" ON storage.objects;
CREATE POLICY "Public payment receipts upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "Public payment receipts view" ON storage.objects;
CREATE POLICY "Public payment receipts view" ON storage.objects 
FOR SELECT USING (bucket_id = 'payment-receipts');

-- 3. POBLAR METADATA INICIAL DE TIENDA CON MÉTODOS DE PAGO Y ENVÍO SI CORRESPONDE
UPDATE public.stores
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'require_age_confirmation', false,
    'require_email', true,
    'payment_methods', jsonb_build_array(
        jsonb_build_object(
            'id', 'yape',
            'name', 'Yape',
            'is_active', true,
            'type', 'manual',
            'number', '999 999 999',
            'holder', 'CodeMarket Perú',
            'qr_url', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
            'instructions', 'Abre Yape en tu teléfono, yapea al número o escanea el QR. En la nota o concepto indica únicamente tu número de pedido.'
        ),
        jsonb_build_object(
            'id', 'plin',
            'name', 'Plin',
            'is_active', true,
            'type', 'manual',
            'number', '999 999 999',
            'holder', 'CodeMarket Perú',
            'qr_url', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
            'instructions', 'Transfiere por Plin al número indicado usando tu código de pedido como concepto.'
        ),
        jsonb_build_object(
            'id', 'bank_transfer',
            'name', 'Transferencia Bancaria',
            'is_active', true,
            'type', 'manual',
            'banks', jsonb_build_array(
                jsonb_build_object('bank', 'BCP', 'account', '193-0000000-0-00', 'cci', '002-193-000000000000-00', 'holder', 'CodeMarket S.A.C.'),
                jsonb_build_object('bank', 'BBVA', 'account', '0011-0000-00000000-00', 'cci', '011-000-000000000000-00', 'holder', 'CodeMarket S.A.C.')
            ),
            'instructions', 'Transfiere el monto exacto a cualquiera de nuestras cuentas bancarias oficiales e incluye el número de pedido en la glosa.'
        ),
        jsonb_build_object(
            'id', 'cash_on_delivery',
            'name', 'Pago Contra Entrega (Efectivo / POS)',
            'is_active', true,
            'type', 'manual',
            'allowed_shipping_methods', jsonb_build_array('delivery_local'),
            'instructions', 'Disponible únicamente para Delivery Local en Lima Metropolitana. Puedes pagar en efectivo o con tarjeta al recibir tu pedido.'
        )
    ),
    'shipping_methods', jsonb_build_array(
        jsonb_build_object(
            'id', 'delivery_local',
            'name', 'Delivery Local (Lima Metropolitana)',
            'is_active', true,
            'price_amount', 1000,
            'estimated_days', '1 - 2 días hábiles',
            'requires_address', true
        ),
        jsonb_build_object(
            'id', 'shipping_national',
            'name', 'Envío Nacional (Provincias por Shalom / Olva)',
            'is_active', true,
            'price_amount', 2000,
            'estimated_days', '2 - 4 días hábiles',
            'requires_address', true
        ),
        jsonb_build_object(
            'id', 'store_pickup',
            'name', 'Recojo en Tienda / Almacén (Gratis)',
            'is_active', true,
            'price_amount', 0,
            'estimated_days', 'Mismo día',
            'requires_address', false,
            'address_details', 'Av. Javier Prado Este 456, San Isidro, Lima'
        )
    )
)
WHERE slug = 'codemarket';
