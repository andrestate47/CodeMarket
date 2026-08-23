'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getInstantProducts } from '@/modules/catalog/queries';

export interface SearchResultItem {
    id: string;
    title: string;
    category_name?: string;
    sku?: string;
    price: string;
    price_amount: number;
    compare_at_amount?: number;
    image_url?: string;
    is_out_of_stock: boolean;
}

export async function searchProductsAction(query: string): Promise<{
    success: boolean;
    products: SearchResultItem[];
    totalCount: number;
}> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
        return { success: true, products: [], totalCount: 0 };
    }

    try {
        const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project');
        if (!isPlaceholder) {
            const adminClient = createAdminClient();

            const { data, error } = await adminClient
                .from('products')
                .select('id, title, category, price_cents, compare_at_price_cents, images, stock_quantity, track_inventory, sku, status')
                .or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%,category.ilike.%${trimmed}%,sku.ilike.%${trimmed}%`)
                .eq('status', 'active')
                .limit(6);

            if (!error && data && data.length > 0) {
                const results: SearchResultItem[] = (data as unknown as Record<string, unknown>[]).map(p => {
                    const priceCents = Number(p.price_cents || 0);
                    const priceAmount = priceCents / 100;
                    const isOutOfStock = Boolean(p.track_inventory) && (Number(p.stock_quantity ?? 0)) <= 0;
                    const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : undefined;

                    return {
                        id: String(p.id),
                        title: String(p.title),
                        category_name: p.category ? String(p.category) : undefined,
                        sku: p.sku ? String(p.sku) : undefined,
                        price: `S/ ${priceAmount.toFixed(2)}`,
                        price_amount: priceAmount,
                        compare_at_amount: p.compare_at_price_cents ? Number(p.compare_at_price_cents) / 100 : undefined,
                        image_url: typeof img === 'string' ? img : undefined,
                        is_out_of_stock: isOutOfStock,
                    };
                });

                return {
                    success: true,
                    products: results,
                    totalCount: results.length,
                };
            }
        }
    } catch {
        // Fallback to local catalog products
    }

    // Fallback in-memory search
    const instantProducts = getInstantProducts();
    const filtered = instantProducts.filter(p => {
        const titleMatch = p.title.toLowerCase().includes(trimmed);
        const catMatch = p.category?.toLowerCase().includes(trimmed);
        const descMatch = p.description?.toLowerCase().includes(trimmed);
        return titleMatch || catMatch || descMatch;
    });

    const results: SearchResultItem[] = filtered.slice(0, 6).map(p => ({
        id: p.id,
        title: p.title,
        category_name: p.category,
        price: p.price,
        price_amount: p.price_amount,
        compare_at_amount: p.compare_at_amount,
        image_url: p.image,
        is_out_of_stock: p.track_inventory && p.stock_quantity <= 0,
    }));

    return {
        success: true,
        products: results,
        totalCount: filtered.length,
    };
}
