-- ==========================================
-- TIENDAVIR - CONFIGURACIÓN DE STORAGE BUCKETS (IDEMPOTENTE)
-- ==========================================

-- 1. Crear bucket público para Imágenes de Productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear bucket público para Comprobantes de Pago Yape/Plin
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Acceso (Limpiar políticas existentes si ya fueron creadas)
DROP POLICY IF EXISTS "Public Read Access for Products" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Access for Products" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access for Products" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access for Payment Receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Access for Payment Receipts" ON storage.objects;

-- 4. Re-crear Políticas de Acceso Público
CREATE POLICY "Public Read Access for Products"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Public Upload Access for Products"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Public Update Access for Products"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Public Read Access for Payment Receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts');

CREATE POLICY "Public Upload Access for Payment Receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts');
