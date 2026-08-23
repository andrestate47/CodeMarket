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
        id: 'pod-x-pro',
        title: 'Pod System X Pro Max 30W',
        slug: 'pod-x-pro',
        category_name: 'Dispositivos',
        category_slug: 'dispositivos',
        description: 'Batería de 1500mAh con pantalla OLED y ajuste de potencia variable.',
        price: 'S/ 79.90',
        compare_price: 'S/ 99.90',
        price_amount: 79.90,
        compare_at_amount: 99.90,
        discount_percentage: 20,
        image_url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80',
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
        id: 'liquido-mentol-ice',
        title: 'E-Liquid Menta Helada 60ml',
        slug: 'liquido-mentol-ice',
        category_name: 'Líquidos',
        category_slug: 'liquidos',
        description: 'Sabor mentolado ultra fresco con notas heladas.',
        price: 'S/ 45.00',
        compare_price: 'S/ 55.00',
        price_amount: 45.00,
        compare_at_amount: 55.00,
        discount_percentage: 18,
        image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 3,
        track_inventory: true,
        is_out_of_stock: false,
        is_low_stock: true,
        low_stock_threshold: 5,
        has_variants: true,
        variant_count: 3,
        is_featured: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cartuchos-mesh-06',
        title: 'Pack 3x Cartuchos Mesh 0.6 ohm',
        slug: 'cartuchos-mesh-06',
        category_name: 'Pods y Cartuchos',
        category_slug: 'pods-y-cartuchos',
        description: 'Resistencias de malla de larga duración para pod systems.',
        price: 'S/ 38.00',
        price_amount: 38.00,
        image_url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 25,
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
        id: 'resistencia-gtx-mesh',
        title: 'Resistencia Vaporesso GTX 0.3 ohm',
        slug: 'resistencia-gtx-mesh',
        category_name: 'Resistencias',
        category_slug: 'resistencias',
        description: 'Coil de repuesto original para tanques GTX.',
        price: 'S/ 18.00',
        price_amount: 18.00,
        image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
        type: 'physical',
        cta: 'Agregar al Carrito',
        stock_quantity: 0,
        track_inventory: true,
        is_out_of_stock: true,
        is_low_stock: false,
        low_stock_threshold: 5,
        has_variants: false,
        variant_count: 0,
        is_featured: false,
        created_at: new Date().toISOString(),
    },
    {
        id: 'bateria-18650-3000',
        title: 'Batería Molicel 18650 3000mAh 35A',
        slug: 'bateria-18650-3000',
        category_name: 'Accesorios',
        category_slug: 'accesorios',
        description: 'Batería de alto amperaje para mod mecánico o electrónico.',
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
        id: 'liquido-frutas-tropicales',
        title: 'E-Liquid Mango Maracuyá 100ml',
        slug: 'liquido-frutas-tropicales',
        category_name: 'Líquidos',
        category_slug: 'liquidos',
        description: 'Mezcla frutal tropical intensa con sal de nicotina.',
        price: 'S/ 65.00',
        price_amount: 65.00,
        image_url: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800&auto=format&fit=crop&q=80',
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
