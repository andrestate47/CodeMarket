-- ==========================================
-- CODEMARKET - SEED DEMO DE CATEGORÍAS (EJEMPLO VAPES)
-- ==========================================

DO $$
DECLARE
    v_store_id UUID;

    -- Parent Category UUIDs
    v_cat_dispositivos UUID;
    v_cat_pods UUID;
    v_cat_resistencias UUID;
    v_cat_liquidos UUID;
    v_cat_accesorios UUID;
BEGIN
    SELECT id INTO v_store_id FROM public.stores WHERE slug = 'codemarket' LIMIT 1;
    IF v_store_id IS NULL THEN
        RETURN;
    END IF;

    -- 1. CATEGORÍAS PADRE
    INSERT INTO public.categories (store_id, name, slug, description, sort_order, is_active)
    VALUES
        (v_store_id, 'Dispositivos', 'dispositivos', 'Equipos y dispositivos de vapeo.', 1, TRUE),
        (v_store_id, 'Pods y Cartuchos', 'pods-cartuchos', 'Pods, cartuchos y repuestos compatibles con dispositivos.', 2, TRUE),
        (v_store_id, 'Resistencias', 'resistencias', 'Resistencias y repuestos para dispositivos compatibles.', 3, TRUE),
        (v_store_id, 'Líquidos', 'liquidos', 'Líquidos y sabores disponibles para dispositivos compatibles.', 4, TRUE),
        (v_store_id, 'Accesorios', 'accesorios', 'Accesorios y complementos.', 5, TRUE)
    ON CONFLICT (store_id, slug) DO UPDATE SET
        description = EXCLUDED.description,
        sort_order = EXCLUDED.sort_order;

    -- Fetch Parent UUIDs
    SELECT id INTO v_cat_dispositivos FROM public.categories WHERE store_id = v_store_id AND slug = 'dispositivos';
    SELECT id INTO v_cat_pods FROM public.categories WHERE store_id = v_store_id AND slug = 'pods-cartuchos';
    SELECT id INTO v_cat_resistencias FROM public.categories WHERE store_id = v_store_id AND slug = 'resistencias';
    SELECT id INTO v_cat_liquidos FROM public.categories WHERE store_id = v_store_id AND slug = 'liquidos';
    SELECT id INTO v_cat_accesorios FROM public.categories WHERE store_id = v_store_id AND slug = 'accesorios';

    -- 2. SUBCATEGORÍAS - DISPOSITIVOS
    INSERT INTO public.categories (store_id, parent_id, name, slug, description, sort_order, is_active)
    VALUES
        (v_store_id, v_cat_dispositivos, 'Desechables', 'desechables', 'Dispositivos de vapeo desechables listos para usar.', 1, TRUE),
        (v_store_id, v_cat_dispositivos, 'Kits', 'kits', 'Kits completos de inicio y avanzados.', 2, TRUE),
        (v_store_id, v_cat_dispositivos, 'Pod Systems', 'pod-systems', 'Sistemas pod recargables y portátiles.', 3, TRUE),
        (v_store_id, v_cat_dispositivos, 'Mods', 'mods', 'Dispositivos avanzables con control de potencia.', 4, TRUE)
    ON CONFLICT (store_id, slug) DO UPDATE SET parent_id = EXCLUDED.parent_id;

    -- 3. SUBCATEGORÍAS - PODS Y CARTUCHOS
    INSERT INTO public.categories (store_id, parent_id, name, slug, description, sort_order, is_active)
    VALUES
        (v_store_id, v_cat_pods, 'Pods recargables', 'pods-recargables', 'Pods de tanque recargables para e-liquids.', 1, TRUE),
        (v_store_id, v_cat_pods, 'Cartuchos', 'cartuchos', 'Cartuchos de reemplazo estándar.', 2, TRUE),
        (v_store_id, v_cat_pods, 'Pods prellenados', 'pods-prellenados', 'Pods con líquido incluido listos para instalar.', 3, TRUE)
    ON CONFLICT (store_id, slug) DO UPDATE SET parent_id = EXCLUDED.parent_id;

    -- 4. SUBCATEGORÍAS - RESISTENCIAS
    INSERT INTO public.categories (store_id, parent_id, name, slug, description, sort_order, is_active)
    VALUES
        (v_store_id, v_cat_resistencias, 'Mesh', 'mesh', 'Resistencias con tecnología mesh para mejor sabor.', 1, TRUE),
        (v_store_id, v_cat_resistencias, 'Coils', 'coils', 'Coils y bobinas de repuesto tradicionales.', 2, TRUE),
        (v_store_id, v_cat_resistencias, 'Resistencias por marca', 'resistencias-marca', 'Resistencias organizadas según marca del fabricante.', 3, TRUE)
    ON CONFLICT (store_id, slug) DO UPDATE SET parent_id = EXCLUDED.parent_id;

    -- 5. SUBCATEGORÍAS - LÍQUIDOS
    INSERT INTO public.categories (store_id, parent_id, name, slug, description, sort_order, is_active)
    VALUES
        (v_store_id, v_cat_liquidos, 'Frutales', 'frutales', 'Sabores de frutas frescas y combinaciones tropicales.', 1, TRUE),
        (v_store_id, v_cat_liquidos, 'Mentolados', 'mentolados', 'Sabores con toque mentolado y refrescante.', 2, TRUE),
        (v_store_id, v_cat_liquidos, 'Dulces', 'dulces', 'Sabores de postres, golosinas y bebidas.', 3, TRUE),
        (v_store_id, v_cat_liquidos, 'Tabaco', 'tabaco', 'Líquidos con perfiles de sabor a tabaco tradicional.', 4, TRUE),
        (v_store_id, v_cat_liquidos, 'Otros', 'otros-liquidos', 'Otras variedades y combinaciones especiales.', 5, TRUE)
    ON CONFLICT (store_id, slug) DO UPDATE SET parent_id = EXCLUDED.parent_id;

    -- 6. SUBCATEGORÍAS - ACCESORIOS
    INSERT INTO public.categories (store_id, parent_id, name, slug, description, sort_order, is_active)
    VALUES
        (v_store_id, v_cat_accesorios, 'Cargadores', 'cargadores', 'Cargadores y cables USB-C / externos.', 1, TRUE),
        (v_store_id, v_cat_accesorios, 'Baterías', 'baterias', 'Baterías externas recargables para mods.', 2, TRUE),
        (v_store_id, v_cat_accesorios, 'Estuches', 'estuches', 'Estuches de protección y transporte.', 3, TRUE),
        (v_store_id, v_cat_accesorios, 'Drip Tips', 'drip-tips', 'Boquillas y drip tips personalizados.', 4, TRUE),
        (v_store_id, v_cat_accesorios, 'Repuestos', 'repuestos', 'Empaques, vidrios de repuesto y herramientas.', 5, TRUE)
    ON CONFLICT (store_id, slug) DO UPDATE SET parent_id = EXCLUDED.parent_id;
END $$;
