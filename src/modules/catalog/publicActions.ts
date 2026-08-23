'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/money';
import { products as localProducts } from '@/data/products';

export interface PublicProductItem {
    id: string;
    title: string;
    slug: string;
    category_id?: string | null;
    category_name?: string;
    category_slug?: string;
    description: string;
    short_description?: string;
    price: string;
    compare_price?: string;
    price_amount: number;
    compare_at_amount?: number;
    discount_percentage?: number;
    image_url: string;
    type: 'digital' | 'service' | 'physical';
    cta: string;
    stock_quantity: number;
    track_inventory: boolean;
    is_out_of_stock: boolean;
    is_low_stock: boolean;
    low_stock_threshold: number;
    has_variants: boolean;
    variant_count: number;
    variants?: { id: string; name: string; price: string; stock: number }[];
    is_featured: boolean;
    created_at?: string;
}

export interface GetCatalogProductsParams {
    categorySlug?: string;
    sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
    page?: number;
    pageSize?: number;
}

const DEMO_PUBLIC_PRODUCTS: PublicProductItem[] = [
    {
        id: 'vaporesso-xros-4-mini',
        title: 'Vaporesso XROS 4 Mini Pod Kit 1000mAh',
        slug: 'vaporesso-xros-4-mini',
        category_name: 'Dispositivos',
        category_slug: 'dispositivos',
        description: 'Pod system compacto de recarga superior con tecnología COREX 2.0 y flujo de aire ajustable.',
        price: 'S/ 89.90',
        compare_price: 'S/ 110.00',
        price_amount: 89.90,
        compare_at_amount: 110.00,
        discount_percentage: 18,
        image_url: '/images/vapes/pod_system_xros.png',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 15,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: true,
        variant_count: 4,
        is_featured: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'uwell-caliburn-g3-kit',
        title: 'Uwell Caliburn G3 Pod Kit 900mAh 25W',
        slug: 'uwell-caliburn-g3-kit',
        category_name: 'Dispositivos',
        category_slug: 'dispositivos',
        description: 'Pantalla OLED con ajuste de potencia de hasta 25W y cartuchos antiderrames G3.',
        price: 'S/ 95.00',
        compare_price: 'S/ 115.00',
        price_amount: 95.00,
        compare_at_amount: 115.00,
        discount_percentage: 17,
        image_url: '/images/vapes/pod_system_caliburn.png',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 10,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: true,
        variant_count: 3,
        is_featured: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'voopoo-argus-pod-se',
        title: 'VOOPOO Argus Pod SE Kit 800mAh',
        slug: 'voopoo-argus-pod-se',
        category_name: 'Dispositivos',
        category_slug: 'dispositivos',
        description: 'Diseño elegante en aleación de zinc y cuero con regulación de aire de precisión de 4 orificios.',
        price: 'S/ 79.90',
        compare_price: 'S/ 99.90',
        price_amount: 79.90,
        compare_at_amount: 99.90,
        discount_percentage: 20,
        image_url: '/images/vapes/pod_system_argus.png',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 12,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: true,
        variant_count: 3,
        is_featured: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cartuchos-vaporesso-xros-pack',
        title: 'Pack 4x Cartuchos Vaporesso XROS Mesh',
        slug: 'cartuchos-vaporesso-xros-pack',
        category_name: 'Resistencias',
        category_slug: 'resistencias',
        description: 'Cartuchos de repuesto con tecnología de malla anti-fugas de 3ml de capacidad.',
        price: 'S/ 55.00',
        compare_price: 'S/ 65.00',
        price_amount: 55.00,
        compare_at_amount: 65.00,
        discount_percentage: 15,
        image_url: '/images/vapes/vape_coils_pack.png',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 25,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: true,
        variant_count: 3,
        is_featured: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cartuchos-uwell-caliburn-g3-pack',
        title: 'Pack 4x Cartuchos Uwell Caliburn G3 Pod',
        slug: 'cartuchos-uwell-caliburn-g3-pack',
        category_name: 'Resistencias',
        category_slug: 'resistencias',
        description: 'Pods de repuesto sellados por ultrasonido con boquilla ergonómica pro-FOCS.',
        price: 'S/ 58.00',
        price_amount: 58.00,
        image_url: '/images/vapes/vape_coils_pack.png',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 20,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: true,
        variant_count: 2,
        is_featured: false,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cartuchos-voopoo-argus-pack',
        title: 'Pack 3x Cartuchos VOOPOO Argus Pod',
        slug: 'cartuchos-voopoo-argus-pack',
        category_name: 'Resistencias',
        category_slug: 'resistencias',
        description: 'Cartuchos transparentes multicapa anti-condensación para Argus Pod.',
        price: 'S/ 45.00',
        price_amount: 45.00,
        image_url: '/images/vapes/vape_coils_pack.png',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 15,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: true,
        variant_count: 2,
        is_featured: false,
        created_at: new Date().toISOString(),
    },
    {
        id: 'liquido-nasty-slow-blow-salt',
        title: 'Líquido SaltNic Nasty Juice Slow Blow 30ml',
        slug: 'liquido-nasty-slow-blow-salt',
        category_name: 'Líquidos',
        category_slug: 'liquidos',
        description: 'Exquisita combinación de piña con limonada helada en sales de nicotina.',
        price: 'S/ 52.00',
        compare_price: 'S/ 60.00',
        price_amount: 52.00,
        compare_at_amount: 60.00,
        discount_percentage: 13,
        image_url: '/images/vapes/saltnic_mango_ice.png',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 20,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: true,
        variant_count: 2,
        is_featured: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'liquido-blvk-pink-frozen-apple',
        title: 'Líquido SaltNic BLVK Pink Frozen Apple 30ml',
        slug: 'liquido-blvk-pink-frozen-apple',
        category_name: 'Líquidos',
        category_slug: 'liquidos',
        description: 'Manzana crujiente roja y verde con un toque mentolado glacial ultra refrescante.',
        price: 'S/ 49.90',
        price_amount: 49.90,
        image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 15,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: true,
        variant_count: 2,
        is_featured: false,
        created_at: new Date().toISOString(),
    },
    {
        id: 'liquido-pod-juice-jewel-mint',
        title: 'Líquido SaltNic Pod Juice Jewel Mint Ice 30ml',
        slug: 'liquido-pod-juice-jewel-mint',
        category_name: 'Líquidos',
        category_slug: 'liquidos',
        description: 'La menta helada más pura, limpia y refrescante con notas dulces de eucalipto.',
        price: 'S/ 50.00',
        compare_price: 'S/ 58.00',
        price_amount: 50.00,
        compare_at_amount: 58.00,
        discount_percentage: 14,
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 22,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: true,
        variant_count: 2,
        is_featured: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'liquido-dinner-lady-lemon-tart',
        title: 'Líquido SaltNic Dinner Lady Lemon Tart 30ml',
        slug: 'liquido-dinner-lady-lemon-tart',
        category_name: 'Líquidos',
        category_slug: 'liquidos',
        description: 'Tarta de crema de limón artesanal con fondo de hojaldre crujiente y merengue.',
        price: 'S/ 55.00',
        price_amount: 55.00,
        image_url: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800&auto=format&fit=crop&q=80',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 12,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: true,
        variant_count: 2,
        is_featured: false,
        created_at: new Date().toISOString(),
    },
    {
        id: 'liquido-naked-100-hawaiian-pog',
        title: 'Líquido SaltNic Naked 100 Hawaiian POG Ice 30ml',
        slug: 'liquido-naked-100-hawaiian-pog',
        category_name: 'Líquidos',
        category_slug: 'liquidos',
        description: 'Exótica mezcla tropical de maracuyá, naranja fresca y guayaba jugosa con mentol.',
        price: 'S/ 52.00',
        compare_price: 'S/ 62.00',
        price_amount: 52.00,
        compare_at_amount: 62.00,
        discount_percentage: 16,
        image_url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 14,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: true,
        variant_count: 2,
        is_featured: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'descartable-lost-mary-blue-razz',
        title: 'Vape Descartable Lost Mary OS5000 - Blue Razz Ice',
        slug: 'descartable-lost-mary-blue-razz',
        category_name: 'Desechables',
        category_slug: 'desechables',
        description: '5000 caladas de frambuesa azul helada con indicador de batería LED de 3 colores.',
        price: 'S/ 55.00',
        compare_price: 'S/ 68.00',
        price_amount: 55.00,
        compare_at_amount: 68.00,
        discount_percentage: 19,
        image_url: '/images/vapes/disposable_berry_blast.png',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 18,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: false,
        variant_count: 0,
        is_featured: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'descartable-elfbar-bc5000-watermelon',
        title: 'Vape Descartable Elfbar BC5000 - Watermelon Ice',
        slug: 'descartable-elfbar-bc5000-watermelon',
        category_name: 'Desechables',
        category_slug: 'desechables',
        description: '5000 caladas de dulce sandía jugosa con toque frío glacial en formato estuche compacto.',
        price: 'S/ 52.00',
        compare_price: 'S/ 65.00',
        price_amount: 52.00,
        compare_at_amount: 65.00,
        discount_percentage: 20,
        image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 15,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: false,
        variant_count: 0,
        is_featured: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'descartable-geekbar-pulse-mango',
        title: 'Vape Descartable Geek Bar Pulse 15000 - Tropical Mango',
        slug: 'descartable-geekbar-pulse-mango',
        category_name: 'Desechables',
        category_slug: 'desechables',
        description: '15000 caladas en modo Regular o 7500 en modo Pulse con pantalla a color dinámico.',
        price: 'S/ 75.00',
        compare_price: 'S/ 90.00',
        price_amount: 75.00,
        compare_at_amount: 90.00,
        discount_percentage: 17,
        image_url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 12,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: false,
        variant_count: 0,
        is_featured: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'descartable-ignite-v80-grape',
        title: 'Vape Descartable IGNITE V80 - Grape Ice',
        slug: 'descartable-ignite-v80-grape',
        category_name: 'Desechables',
        category_slug: 'desechables',
        description: '8000 caladas en elegante cuerpo metálico matte con uva dulce e intensa sabor frío.',
        price: 'S/ 62.00',
        price_amount: 62.00,
        image_url: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=800&auto=format&fit=crop&q=80',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 10,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: false,
        variant_count: 0,
        is_featured: false,
        created_at: new Date().toISOString(),
    },
    {
        id: 'descartable-oxbar-magic-maze-kiwi',
        title: 'Vape Descartable Oxbar Magic Maze 10000 - Strawberry Kiwi',
        slug: 'descartable-oxbar-magic-maze-kiwi',
        category_name: 'Desechables',
        category_slug: 'desechables',
        description: '10000 caladas con pantalla inteligente y regulación de vatiaje de 11W a 15W.',
        price: 'S/ 68.00',
        compare_price: 'S/ 82.00',
        price_amount: 68.00,
        compare_at_amount: 82.00,
        discount_percentage: 17,
        image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 14,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: false,
        variant_count: 0,
        is_featured: false,
        created_at: new Date().toISOString(),
    },
    {
        id: 'bateria-molicel-18650-3000',
        title: 'Batería Molicel 18650 P28A 2800mAh 35A (Original)',
        slug: 'bateria-molicel-18650-3000',
        category_name: 'Accesorios',
        category_slug: 'accesorios',
        description: 'Batería recargable de alto amperaje para Mods electrónicos y mecánicos de vapeo.',
        price: 'S/ 42.00',
        compare_price: 'S/ 50.00',
        price_amount: 42.00,
        compare_at_amount: 50.00,
        discount_percentage: 16,
        image_url: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=800&auto=format&fit=crop&q=80',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 8,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: false,
        variant_count: 0,
        is_featured: false,
        created_at: new Date().toISOString(),
    },
    {
        id: 'estuche-funda-silicona-pod',
        title: 'Estuche Funda de Silicona Anti-Impacto con Lanyard',
        slug: 'estuche-funda-silicona-pod',
        category_name: 'Accesorios',
        category_slug: 'accesorios',
        description: 'Funda protectora de silicona suave con cordón colgante para Pod Systems.',
        price: 'S/ 25.00',
        price_amount: 25.00,
        image_url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 20,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: false,
        variant_count: 0,
        is_featured: false,
        created_at: new Date().toISOString(),
    },
];

export async function getPublicCatalogProductsAction(params: GetCatalogProductsParams = {}): Promise<{
    success: boolean;
    products: PublicProductItem[];
    totalCount: number;
    error?: string;
}> {
    const { categorySlug = 'all', sortBy = 'newest', page = 1, pageSize = 24 } = params;

    try {
        const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project');
        if (isPlaceholder) {
            return processLocalDemoProducts(categorySlug, sortBy, page, pageSize);
        }

        const adminClient = createAdminClient();

        let query = adminClient
            .from('products')
            .select(`
                id, title, category, category_id, description, short_description, price_cents, compare_at_price_cents,
                images, image_url, stock_quantity, track_inventory, low_stock_threshold, status, metadata, featured, created_at,
                categories ( id, name, slug )
            `, { count: 'exact' })
            .eq('status', 'active');

        // Apply sorting query
        if (sortBy === 'price_asc') {
            query = query.order('price_cents', { ascending: true });
        } else if (sortBy === 'price_desc') {
            query = query.order('price_cents', { ascending: false });
        } else if (sortBy === 'name_asc') {
            query = query.order('title', { ascending: true });
        } else if (sortBy === 'name_desc') {
            query = query.order('title', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error || !data || data.length === 0) {
            return processLocalDemoProducts(categorySlug, sortBy, page, pageSize);
        }

        let mapped: PublicProductItem[] = (data as unknown as Record<string, unknown>[]).map(p => {
            const priceCents = Number(p.price_cents || 0);
            const priceAmount = priceCents / 100;
            const compareCents = p.compare_at_price_cents ? Number(p.compare_at_price_cents) : null;
            const compareAmount = compareCents ? compareCents / 100 : undefined;

            let discountPct: number | undefined = undefined;
            if (compareAmount && compareAmount > priceAmount) {
                discountPct = Math.round(((compareAmount - priceAmount) / compareAmount) * 100);
            }

            const stockQty = Number(p.stock_quantity ?? 0);
            const trackInv = Boolean(p.track_inventory);
            const lowStockThreshold = Number(p.low_stock_threshold ?? 5);

            const isOutOfStock = trackInv && stockQty <= 0;
            const isLowStock = trackInv && stockQty > 0 && stockQty <= lowStockThreshold;

            const imagesArr = Array.isArray(p.images) ? p.images : [];
            const primaryImg = p.image_url ? String(p.image_url) : (imagesArr[0] ? String(imagesArr[0]) : '/web-basica-hero.png');

            const categoryObj = p.categories as { id?: string; name?: string; slug?: string } | undefined;
            const catName = categoryObj?.name || (p.category ? String(p.category) : 'General');
            const catSlug = categoryObj?.slug || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            const meta = (p.metadata as Record<string, unknown>) || {};
            const variantsArr = Array.isArray(meta.variants) ? meta.variants : [];

            return {
                id: String(p.id),
                title: String(p.title),
                slug: String(p.id),
                category_id: p.category_id ? String(p.category_id) : undefined,
                category_name: catName,
                category_slug: catSlug,
                description: String(p.description || p.short_description || ''),
                short_description: p.short_description ? String(p.short_description) : undefined,
                price: formatMoney(priceAmount),
                compare_price: compareAmount ? formatMoney(compareAmount) : undefined,
                price_amount: priceAmount,
                compare_at_amount: compareAmount,
                discount_percentage: discountPct,
                image_url: primaryImg,
                type: (meta.type || 'physical') as 'digital' | 'service' | 'physical',
                cta: 'Agregar al Carrito',
                stock_quantity: stockQty,
                track_inventory: trackInv,
                is_out_of_stock: isOutOfStock,
                is_low_stock: isLowStock,
                low_stock_threshold: lowStockThreshold,
                has_variants: variantsArr.length > 0,
                variant_count: variantsArr.length,
                variants: variantsArr as { id: string; name: string; price: string; stock: number }[],
                is_featured: Boolean(p.featured),
                created_at: p.created_at ? String(p.created_at) : undefined,
            };
        });

        // Filter by category slug or special offer filter
        const isOfferFilter = categorySlug === 'ofertas' || categorySlug === 'ofertas-especiales' || categorySlug === 'descuentos';
        if (isOfferFilter) {
            mapped = mapped.filter(p => (p.discount_percentage && p.discount_percentage > 0) || (p.compare_at_amount && p.compare_at_amount > p.price_amount) || p.is_featured);
            if (mapped.length === 0) {
                mapped = (data as unknown as Record<string, unknown>[]).map(p => {
                    const priceAmount = Number(p.price_cents || p.price_amount || 0);
                    const compareAmount = Number(p.compare_at_price_cents || p.compare_at_amount || 0);
                    return {
                        id: String(p.id),
                        title: String(p.name || p.title || 'Producto'),
                        slug: String(p.slug || ''),
                        category_id: p.category_id ? String(p.category_id) : undefined,
                        category_name: p.categories && typeof p.categories === 'object' && 'name' in p.categories ? String((p.categories as { name: unknown }).name) : undefined,
                        category_slug: p.categories && typeof p.categories === 'object' && 'slug' in p.categories ? String((p.categories as { slug: unknown }).slug) : undefined,
                        description: String(p.short_description || p.description || ''),
                        price: `S/ ${(priceAmount / 100).toFixed(2)}`,
                        compare_price: compareAmount > 0 ? `S/ ${(compareAmount / 100).toFixed(2)}` : undefined,
                        price_amount: priceAmount,
                        compare_at_amount: compareAmount > 0 ? compareAmount : undefined,
                        currency: 'PEN',
                        discount_percentage: compareAmount > priceAmount ? Math.round(((compareAmount - priceAmount) / compareAmount) * 100) : 0,
                        type: (p.product_type as 'digital' | 'service' | 'physical') || 'digital',
                        cta: p.product_type === 'service' ? 'Cotizar Proyecto' : 'Comprar',
                        image_url: p.image_url ? String(p.image_url) : '',
                        track_inventory: Boolean(p.track_inventory),
                        low_stock_threshold: Number(p.low_stock_threshold || 5),
                        stock_quantity: Number(p.stock_quantity || 0),
                        is_out_of_stock: Boolean(p.track_inventory && Number(p.stock_quantity || 0) <= 0),
                        is_low_stock: Boolean(p.track_inventory && Number(p.stock_quantity || 0) > 0 && Number(p.stock_quantity || 0) <= 5),
                        is_featured: Boolean(p.featured || p.is_featured),
                        has_variants: false,
                        variant_count: 0,
                        created_at: p.created_at ? String(p.created_at) : undefined,
                    };
                }).filter(p => p.is_featured || (p.compare_at_amount && p.compare_at_amount > p.price_amount));
            }
        } else if (categorySlug && categorySlug !== 'all' && categorySlug !== 'todos') {
            mapped = mapped.filter(p => p.category_slug === categorySlug || p.category_name?.toLowerCase() === categorySlug.toLowerCase() || p.category_id === categorySlug);
        }

        // Paginate results
        const start = (page - 1) * pageSize;
        const paginated = mapped.slice(start, start + pageSize);

        return {
            success: true,
            products: paginated,
            totalCount: mapped.length,
        };
    } catch {
        return processLocalDemoProducts(categorySlug, sortBy, page, pageSize);
    }
}

function processLocalDemoProducts(
    categorySlug: string,
    sortBy: string,
    page: number,
    pageSize: number
) {
    // Map data/products.ts demo products into PublicProductItem interface
    const mappedLocal: PublicProductItem[] = localProducts.map(p => {
        const priceNum = p.price ? parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0 : 0;
        const compareNum = p.comparePrice ? parseFloat(p.comparePrice.replace(/[^0-9.]/g, '')) || 0 : undefined;
        let discountPct: number | undefined = undefined;
        if (compareNum && compareNum > priceNum) {
            discountPct = Math.round(((compareNum - priceNum) / compareNum) * 100);
        }

        const catSlug = p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const isOutOfStock = p.id === 'audifonos-pro';
        const isLowStock = p.id === 'smartband-v8';

        return {
            id: p.id,
            title: p.title,
            slug: p.id,
            category_name: p.category,
            category_slug: catSlug,
            description: p.description,
            price: p.price,
            compare_price: p.comparePrice,
            price_amount: priceNum,
            compare_at_amount: compareNum,
            discount_percentage: discountPct,
            image_url: p.image || '/web-basica-hero.png',
            type: p.type,
            cta: p.cta || 'Agregar al Carrito',
            stock_quantity: isOutOfStock ? 0 : (isLowStock ? 3 : 20),
            track_inventory: true,
            is_out_of_stock: isOutOfStock,
            is_low_stock: isLowStock,
            low_stock_threshold: 5,
            has_variants: Boolean(p.variants && p.variants.length > 0),
            variant_count: p.variants?.length || 0,
            variants: p.variants,
            is_featured: Boolean(p.highlight),
            created_at: new Date().toISOString(),
        };
    });

    const combined = [...DEMO_PUBLIC_PRODUCTS, ...mappedLocal];
    // Deduplicate by ID
    let unique = combined.filter((p, index, self) => index === self.findIndex(t => t.id === p.id));

    // Category or offer filter
    const isOfferFilter = categorySlug === 'ofertas' || categorySlug === 'ofertas-especiales' || categorySlug === 'descuentos';
    if (isOfferFilter) {
        unique = unique.filter(p => (p.discount_percentage && p.discount_percentage > 0) || (p.compare_at_amount && p.compare_at_amount > p.price_amount) || p.is_featured);
    } else if (categorySlug && categorySlug !== 'all' && categorySlug !== 'todos') {
        unique = unique.filter(p => p.category_slug === categorySlug || p.category_name?.toLowerCase() === categorySlug.toLowerCase() || p.category_id === categorySlug);
    }

    // Sort
    if (sortBy === 'price_asc') {
        unique.sort((a, b) => a.price_amount - b.price_amount);
    } else if (sortBy === 'price_desc') {
        unique.sort((a, b) => b.price_amount - a.price_amount);
    } else if (sortBy === 'name_asc') {
        unique.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'name_desc') {
        unique.sort((a, b) => b.title.localeCompare(a.title));
    }

    const start = (page - 1) * pageSize;
    const paginated = unique.slice(start, start + pageSize);

    return {
        success: true,
        products: paginated,
        totalCount: unique.length,
    };
}
