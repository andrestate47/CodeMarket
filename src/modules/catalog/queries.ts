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
    variants?: any[];
    wholesale_rules?: any[];
}

export function getInstantProducts(): CatalogProduct[] {
    let localSavedProducts: CatalogProduct[] = [];
    if (typeof window !== 'undefined') {
        try {
            localSavedProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
        } catch {
            localSavedProducts = [];
        }
    }

    const staticMapped: CatalogProduct[] = localProducts.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        price_amount: p.price ? Math.round(parseFloat(p.price.replace(/[^0-9.]/g, '')) * 100) : 0,
        features: p.features,
        type: (p.type === 'service' ? 'service' : 'digital') as 'digital' | 'service' | 'physical',
        cta: p.cta,
        highlight: p.highlight,
        color: p.color,
        image: p.image,
        longDescription: p.longDescription,
        stock_quantity: 100,
        track_inventory: false,
        status: 'active',
    }));

    const combined = [...localSavedProducts, ...staticMapped];
    return combined.filter((prod, index, self) =>
        index === self.findIndex(p => p.id === prod.id)
    );
}

export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
    const instantList = getInstantProducts();
    let dbMapped: CatalogProduct[] = [];

    try {
        const supabase = createBrowserClient();

        // 1.2s timeout so slow networks never freeze the page
        const fetchPromise = supabase
            .from('products')
            .select(`
                *,
                categories ( name, slug )
            `);

        const timeoutPromise = new Promise<{ data: null }>((resolve) =>
            setTimeout(() => resolve({ data: null }), 1200)
        );

        const res = await Promise.race([fetchPromise, timeoutPromise]);
        const dbProducts = res.data;

        if (dbProducts && dbProducts.length > 0) {
            dbMapped = dbProducts.map(p => {
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
                    type: (p.product_type || 'digital') as 'digital' | 'service' | 'physical',
                    cta: meta.cta || 'Comprar',
                    highlight: p.featured,
                    color: meta.color || 'linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%)',
                    image: p.image_url || meta.image || '/web-basica-hero.png',
                    longDescription: p.description,
                    stock_quantity: p.stock_quantity || 0,
                    track_inventory: p.track_inventory || false,
                    status: p.status || 'active',
                };
            });
        }
    } catch {
        // Safe fallback if Supabase network is unreachable
    }

    const combined = [...instantList, ...dbMapped];
    return combined.filter((prod, index, self) =>
        index === self.findIndex(p => p.id === prod.id)
    );
}
