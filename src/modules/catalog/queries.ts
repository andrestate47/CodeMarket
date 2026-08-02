import { createBrowserClient } from '@/lib/supabase/client';
import { formatMoney } from '@/lib/money';
import { products as localProducts } from '@/data/products';

export interface CatalogCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
}

export interface CatalogProduct {
    id: string;
    title: string;
    category: string;
    description: string;
    short_description?: string;
    price: string;
    comparePrice?: string;
    price_amount: number;
    compare_at_amount?: number;
    features: string[];
    type: 'digital' | 'service' | 'physical';
    cta: string;
    highlight?: boolean;
    color: string;
    image?: string;
    longDescription?: string;
    stock_quantity: number;
    track_inventory: boolean;
    status?: string;
}

export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
    try {
        const supabase = createBrowserClient();
        const { data: dbProducts, error } = await supabase
            .from('products')
            .select(`
                *,
                categories ( name, slug )
            `)
            .eq('status', 'active');

        if (error || !dbProducts || dbProducts.length === 0) {
            // Fallback to local products if database hasn't been seeded yet
            return localProducts.map(p => ({
                id: p.id,
                title: p.title,
                category: p.category,
                description: p.description,
                price: p.price,
                comparePrice: p.comparePrice,
                price_amount: p.price ? Math.round(parseFloat(p.price.replace(/[^0-9.]/g, '')) * 100) : 0,
                features: p.features,
                type: p.type === 'service' ? 'service' : 'digital',
                cta: p.cta,
                highlight: p.highlight,
                color: p.color,
                image: p.image,
                longDescription: p.longDescription,
                stock_quantity: 100,
                track_inventory: false,
            }));
        }

        return dbProducts.map(p => {
            const meta = p.metadata || {};
            return {
                id: p.id,
                title: p.name,
                category: p.categories?.name || 'General',
                description: p.short_description || p.description || '',
                price: formatMoney(p.price_amount, p.currency),
                comparePrice: p.compare_at_amount ? formatMoney(p.compare_at_amount, p.currency) : undefined,
                price_amount: p.price_amount,
                compare_at_amount: p.compare_at_amount,
                features: meta.features || [],
                type: p.product_type || 'digital',
                cta: meta.cta || 'Comprar',
                highlight: p.featured,
                color: meta.color || 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                image: meta.image || '/web-basica-hero.png',
                longDescription: p.description,
                stock_quantity: p.stock_quantity || 0,
                track_inventory: p.track_inventory || false,
            };
        });
    } catch {
        // Safe fallback
        return localProducts.map(p => ({
            id: p.id,
            title: p.title,
            category: p.category,
            description: p.description,
            price: p.price,
            comparePrice: p.comparePrice,
            price_amount: p.price ? Math.round(parseFloat(p.price.replace(/[^0-9.]/g, '')) * 100) : 0,
            features: p.features,
            type: p.type === 'service' ? 'service' : 'digital',
            cta: p.cta,
            highlight: p.highlight,
            color: p.color,
            image: p.image,
            longDescription: p.longDescription,
            stock_quantity: 100,
            track_inventory: false,
        }));
    }
}
