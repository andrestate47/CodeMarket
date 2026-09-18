import { supabase } from '@/lib/supabase';
import { products as staticProducts, Product } from '@/data/products';

export class CatalogService {
    /**
     * Checks if Supabase credentials are valid
     */
    private static isSupabaseConfigured(): boolean {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        return Boolean(url && !url.includes('your-supabase-project') && !url.includes('placeholder'));
    }

    /**
     * Get all active products
     */
    static async getProducts(): Promise<Product[]> {
        if (!this.isSupabaseConfigured()) {
            return staticProducts;
        }

        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    id,
                    name,
                    slug,
                    description,
                    short_description,
                    price_amount,
                    compare_at_amount,
                    product_type,
                    featured,
                    categories ( name ),
                    product_images ( storage_path, is_primary ),
                    product_variants ( id, name, price_amount, stock_quantity )
                `)
                .eq('status', 'active');

            if (error || !data || data.length === 0) {
                return staticProducts;
            }

            return data.map((item: any) => ({
                id: item.slug || item.id,
                title: item.name,
                category: item.categories?.name || 'General',
                description: item.short_description || item.description || '',
                longDescription: item.description || '',
                price: `S/ ${(item.price_amount / 100).toFixed(2)}`,
                comparePrice: item.compare_at_amount ? `S/ ${(item.compare_at_amount / 100).toFixed(2)}` : undefined,
                features: [],
                type: item.product_type || 'physical',
                cta: 'Agregar al Carrito',
                highlight: Boolean(item.featured),
                color: 'linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%)',
                image: item.product_images?.[0]?.storage_path || '/images/vapes/pod_system_xros.png',
                variants: item.product_variants?.map((v: any) => ({
                    id: v.id,
                    name: v.name,
                    price: `S/ ${(v.price_amount / 100).toFixed(2)}`,
                    stock: v.stock_quantity || 0,
                })),
            }));
        } catch {
            return staticProducts;
        }
    }

    /**
     * Get product by ID or Slug
     */
    static async getProductById(idOrSlug: string): Promise<Product | undefined> {
        const allProducts = await this.getProducts();
        return allProducts.find((p) => p.id === idOrSlug || p.title.toLowerCase().replace(/\s+/g, '-') === idOrSlug);
    }

    /**
     * Get featured products for home page
     */
    static async getFeaturedProducts(): Promise<Product[]> {
        const allProducts = await this.getProducts();
        return allProducts.filter((p) => p.highlight);
    }

    /**
     * Get products with active discounts
     */
    static async getDiscountedProducts(): Promise<Product[]> {
        const allProducts = await this.getProducts();
        return allProducts.filter((p) => Boolean(p.comparePrice));
    }

    /**
     * Get unique categories
     */
    static async getCategories(): Promise<string[]> {
        const allProducts = await this.getProducts();
        const categorySet = new Set<string>();
        allProducts.forEach((p) => categorySet.add(p.category));
        return Array.from(categorySet);
    }
}
