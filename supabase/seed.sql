-- ==========================================
-- CODEMARKET - SEED INICIAL DE DATOS
-- ==========================================

-- Obtener ID de la tienda por defecto 'CodeMarket'
DO $$
DECLARE
    v_store_id UUID;
    v_cat_sitio_web UUID;
    v_cat_landing UUID;
    v_cat_negocios UUID;
    v_cat_admin UUID;
    v_cat_herramientas UUID;
    v_cat_servicios UUID;
BEGIN
    SELECT id INTO v_store_id FROM public.stores WHERE slug = 'codemarket' LIMIT 1;

    -- Insertar Categorías
    INSERT INTO public.categories (store_id, name, slug, description, sort_order)
    VALUES
        (v_store_id, 'Sitio Web', 'sitio-web', 'Sitios web completos e interactivos', 1),
        (v_store_id, 'Landing Page', 'landing-page', 'Páginas de alta conversión para ventas y captura de leads', 2),
        (v_store_id, 'Negocios', 'negocios', 'Soluciones integrales de comercio electrónico y ventas', 3),
        (v_store_id, 'Administración', 'administracion', 'Paneles de control y dashboards de gestión', 4),
        (v_store_id, 'Herramientas', 'herramientas', 'Automatizaciones y herramientas comerciales', 5),
        (v_store_id, 'Servicios', 'servicios', 'Desarrollo a medida y consultoría técnica', 6)
    ON CONFLICT (store_id, slug) DO NOTHING;

    -- Obtener UUIDs de Categorías
    SELECT id INTO v_cat_sitio_web FROM public.categories WHERE store_id = v_store_id AND slug = 'sitio-web';
    SELECT id INTO v_cat_landing FROM public.categories WHERE store_id = v_store_id AND slug = 'landing-page';
    SELECT id INTO v_cat_negocios FROM public.categories WHERE store_id = v_store_id AND slug = 'negocios';
    SELECT id INTO v_cat_admin FROM public.categories WHERE store_id = v_store_id AND slug = 'administracion';
    SELECT id INTO v_cat_herramientas FROM public.categories WHERE store_id = v_store_id AND slug = 'herramientas';
    SELECT id INTO v_cat_servicios FROM public.categories WHERE store_id = v_store_id AND slug = 'servicios';

    -- Insertar Productos
    INSERT INTO public.products (
        store_id, category_id, name, slug, short_description, description,
        product_type, status, price_amount, compare_at_amount, currency, sku,
        featured, metadata
    ) VALUES
    (
        v_store_id, v_cat_sitio_web,
        'Kit Web Básica Premium', 'web-basica',
        'Todo lo que necesitas para lanzar tu negocio: Dominio + Hosting Gratis y Correos Corporativos.',
        '🚀 ¿Estás perdiendo clientes por no tener presencia digital? Nuestro Kit Web Básica Premium es la solución "Llave en Mano" que tu negocio necesita para empezar a vender por internet desde el día uno.',
        'digital', 'active', 9999, 14999, 'PEN', 'CM-WEB-001',
        FALSE,
        '{"features": ["Dominio y Hosting GRATIS (1er Año)", "Botón de WhatsApp Flotante", "Correos Corporativos Profesionales", "Diseño 100% Responsivo y Rápido", "Secciones: Inicio, Nosotros, Servicios, Contacto"], "cta": "Comprar", "color": "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", "image": "/web-basica-hero.png"}'::jsonb
    ),
    (
        v_store_id, v_cat_landing,
        'Kit Landing Básica Pro', 'landing-basica',
        'Una página diseñada para vender: alta conversión, carga rápida y CTAs que funcionan.',
        '🎯 Una Landing Page no es un sitio web común — es una máquina de conversión diseñada con un único propósito: convertir visitas en clientes, registros o contactos reales.',
        'digital', 'active', 5900, 8999, 'PEN', 'CM-LND-001',
        FALSE,
        '{"features": ["Sección Hero con CTA Impactante", "Sección de Beneficios y Prueba Social", "Formulario de Captura de Leads", "Carga en menos de 2 segundos", "Optimizada para Google Ads y Facebook Ads"], "cta": "Comprar", "color": "linear-gradient(135deg, #FF6B6B 0%, #556270 100%)", "image": "/landing-hero.jpg"}'::jsonb
    ),
    (
        v_store_id, v_cat_negocios,
        'Kit Web Pro Business', 'web-pro',
        'La solución web más completa del mercado: E-commerce, Blog, SEO Avanzado y Panel de Administración.',
        '🏆 El Kit Web Pro Business no es un simple sitio web — es la herramienta de negocio más completa que puedes tener en internet.',
        'digital', 'active', 29900, 45000, 'PEN', 'CM-PRO-001',
        TRUE,
        '{"features": ["🛒 Tienda Online con carrito y pedidos", "✍️ Blog integrado para posicionamiento", "🔍 SEO On-Page avanzado", "⚙️ Panel admin propio"], "cta": "Comprar", "highlight": true, "color": "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", "image": "/web-pro-v2.png"}'::jsonb
    ),
    (
        v_store_id, v_cat_admin,
        'Dashboard Pro Panel', 'dashboard',
        'Toma decisiones inteligentes con datos reales: panel de control visual, métricas en tiempo real y gestión total.',
        '📊 El Dashboard Pro Panel transforma la información compleja de tu empresa en visualizaciones claras, métricas accionables y reportes al instante.',
        'digital', 'active', 8900, 15000, 'PEN', 'CM-DSH-001',
        FALSE,
        '{"features": ["📊 Gráficos interactivos en tiempo real", "📋 Tablas dinámicas con exportación Excel/PDF", "🌙 Modo oscuro y claro", "🔐 Control por roles"], "cta": "Comprar", "color": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", "image": "/dashboard-v2.png"}'::jsonb
    ),
    (
        v_store_id, v_cat_herramientas,
        'Automatización WhatsApp Pro', 'whatsapp-automation',
        'Vende y atiende clientes 24/7 sin contratar personal: bots inteligentes, flujos de venta y mensajes masivos.',
        '💬 ¿Cuántos clientes pierdes cada día porque no respondiste a tiempo en WhatsApp? Con la Automatización WhatsApp Pro tu negocio atiende y vende 24/7.',
        'digital', 'active', 8900, 13900, 'PEN', 'CM-WSP-001',
        FALSE,
        '{"features": ["🤖 Bot inteligente 24/7", "🔀 Flujos de venta guiados", "📣 Mensajes masivos segmentados", "🔗 Integración con CRM"], "cta": "Comprar", "color": "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", "image": "/whatsapp-automation-v2.png"}'::jsonb
    ),
    (
        v_store_id, v_cat_servicios,
        'Desarrollo a Medida Elite', 'custom-dev',
        'Software exclusivo diseñado para resolver los desafíos únicos de tu negocio.',
        '🚀 El Desarrollo a Medida Elite no es una plantilla — es la construcción de software exclusivo diseñado para ajustarse a tu flujo de trabajo.',
        'service', 'active', 49900, 75000, 'PEN', 'CM-DEV-001',
        FALSE,
        '{"features": ["🤝 Consultoría técnica profunda", "🏗️ Arquitectura de software moderna", "💻 Código limpio y optimizado", "🔌 Integración experta con APIs"], "cta": "Cotizar Proyecto", "color": "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)", "image": "/custom-dev-hero.png"}'::jsonb
    )
    ON CONFLICT (store_id, slug) DO UPDATE SET
        price_amount = EXCLUDED.price_amount,
        compare_at_amount = EXCLUDED.compare_at_amount,
        short_description = EXCLUDED.short_description,
        description = EXCLUDED.description,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

    -- Configurar métodos de pago iniciales manuales
    INSERT INTO public.payment_settings (store_id, method, display_name, instructions, account_holder, account_identifier, is_active)
    VALUES
        (v_store_id, 'yape', 'Yape', 'Realiza la transferencia al número Yape indicado y envía el comprobante por WhatsApp con tu número de pedido.', 'CodeMarket Perú', '900 000 000', TRUE),
        (v_store_id, 'plin', 'Plin', 'Transfiere vía Plin al número de contacto e indica tu número de pedido.', 'CodeMarket Perú', '900 000 000', TRUE),
        (v_store_id, 'bank_transfer', 'Transferencia Bancaria', 'Transfiere al número de cuenta BCP / Interbank indicado. El pedido se confirmará tras la validación.', 'CodeMarket S.A.C.', 'BCP: 193-0000000-0-00', TRUE),
        (v_store_id, 'quote_request', 'Solicitud de Cotización', 'Pide una cotización personalizada para tu proyecto sin compromiso.', 'CodeMarket Soporte', 'contacto@codemarket.com', TRUE)
    ON CONFLICT (store_id, method) DO NOTHING;

    -- Configuración de la tienda por defecto
    INSERT INTO public.store_settings (store_id, support_email, support_phone, whatsapp_phone, order_prefix)
    VALUES (v_store_id, 'soporte@codemarket.com', '+51900000000', '+51900000000', 'CM-')
    ON CONFLICT (store_id) DO NOTHING;

END $$;
