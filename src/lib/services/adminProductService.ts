import { supabase } from '@/lib/supabase';

export interface AdminProductPayload {
    name: string;
    slug: string;
    description: string;
    short_description?: string;
    category_id?: string;
    price_amount: number; // Centavos o soles * 100
    compare_at_amount?: number;
    stock_quantity: number;
    featured: boolean;
    status: 'draft' | 'active' | 'archived';
}

export class AdminProductService {
    /**
     * Create product in Supabase
     */
    static async createProduct(payload: AdminProductPayload) {
        const { data: store } = await supabase.from('stores').select('id').single();
        const storeId = store?.id;

        const { data, error } = await supabase.from('products').insert([
            {
                store_id: storeId,
                name: payload.name,
                slug: payload.slug,
                description: payload.description,
                short_description: payload.short_description || payload.description.substring(0, 150),
                category_id: payload.category_id || null,
                price_amount: payload.price_amount,
                compare_at_amount: payload.compare_at_amount || null,
                stock_quantity: payload.stock_quantity,
                featured: payload.featured,
                status: payload.status,
            }
        ]).select().single();

        if (error) throw error;
        return data;
    }

    /**
     * Update product
     */
    static async updateProduct(id: string, payload: Partial<AdminProductPayload>) {
        const { data, error } = await supabase
            .from('products')
            .update({
                name: payload.name,
                description: payload.description,
                price_amount: payload.price_amount,
                compare_at_amount: payload.compare_at_amount,
                stock_quantity: payload.stock_quantity,
                featured: payload.featured,
                status: payload.status,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete product
     */
    static async deleteProduct(id: string) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        return true;
    }

    /**
     * Update product stock quantity and log inventory movement
     */
    static async updateStock(productId: string, newStock: number, quantityChange: number, reason?: string) {
        const { data: store } = await supabase.from('stores').select('id').single();
        const storeId = store?.id;

        const { error } = await supabase
            .from('products')
            .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
            .eq('id', productId);

        if (error) throw error;

        if (storeId) {
            try {
                await supabase.from('inventory_movements').insert({
                    store_id: storeId,
                    product_id: productId,
                    movement_type: quantityChange >= 0 ? 'reposicion' : 'ajuste_manual',
                    quantity: quantityChange,
                    notes: reason || 'Ajuste manual de stock',
                });
            } catch {
                // Ignore if inventory_movements is optional
            }
        }

        return true;
    }

    /**
     * Seed initial products and categories into Supabase database
     */
    static async seedInitialDatabase(): Promise<{ success: boolean; insertedCount: number; error?: string }> {
        try {
            const { data: store } = await supabase.from('stores').select('id').single();
            if (!store?.id) {
                return { success: false, insertedCount: 0, error: 'No se encontró la tienda principal.' };
            }

            const storeId = store.id;

            // 1. Create Default Categories
            const categoriesToInsert = [
                { store_id: storeId, name: 'Dispositivos & Pods', slug: 'dispositivos-pods', description: 'Kits y vapeadores de alta potencia', sort_order: 1 },
                { store_id: storeId, name: 'Líquidos Premium', slug: 'liquidos-premium', description: 'Sales de nicotina y sabores frutales', sort_order: 2 },
                { store_id: storeId, name: 'Accesorios & Repuestos', slug: 'accesorios-repuestos', description: 'Cartuchos, resistencias y cargadores', sort_order: 3 },
            ];

            const { data: createdCategories } = await supabase
                .from('categories')
                .upsert(categoriesToInsert, { onConflict: 'store_id,slug' })
                .select('id, slug');

            const categoryMap: Record<string, string> = {};
            if (createdCategories) {
                createdCategories.forEach(c => { categoryMap[c.slug] = c.id; });
            }

            // 2. Initial Catalog Products
            const sampleProducts: AdminProductPayload[] = [
                {
                    name: 'Vaporesso XROS 3 Pod Kit',
                    slug: 'vaporesso-xros-3-pod-kit',
                    description: 'Sistema Pod avanzado con batería de 1000mAh, flujo de aire ajustable y tecnología COREX para un sabor 50% más duradero.',
                    short_description: 'Kit de inicio con batería de 1000mAh y sabor superior.',
                    category_id: categoryMap['dispositivos-pods'],
                    price_amount: 14900,
                    compare_at_amount: 17900,
                    stock_quantity: 25,
                    featured: true,
                    status: 'active',
                },
                {
                    name: 'Voopoo Drag S Pro 80W',
                    slug: 'voopoo-drag-s-pro-80w',
                    description: 'Potencia regulable hasta 80W, chip Gene.TT 2.0 y tanque TPP X de 5.5ml para grandes nubes de vapor.',
                    short_description: 'Mod pod de 80W con pantalla a color y carga rápida Type-C.',
                    category_id: categoryMap['dispositivos-pods'],
                    price_amount: 22900,
                    compare_at_amount: 25900,
                    stock_quantity: 12,
                    featured: true,
                    status: 'active',
                },
                {
                    name: 'Nasty Juice Salt Mango Mosa 30ml',
                    slug: 'nasty-juice-salt-mango-mosa-30ml',
                    description: 'Líquido con sales de nicotina sabor a mango maduro combinado con toque refrescante de mentol.',
                    short_description: 'Sal de nicotina sabor mango mentolado 30ml.',
                    category_id: categoryMap['liquidos-premium'],
                    price_amount: 6500,
                    compare_at_amount: 7500,
                    stock_quantity: 40,
                    featured: true,
                    status: 'active',
                },
                {
                    name: 'BLVK Unicorn FrznMint 30ml',
                    slug: 'blvk-unicorn-frznmint-30ml',
                    description: 'Intenso sabor a menta fresca helada para vapear todo el día con golpe de garganta suave y limpio.',
                    short_description: 'Sabor menta helada premium 30ml.',
                    category_id: categoryMap['liquidos-premium'],
                    price_amount: 6000,
                    compare_at_amount: 7000,
                    stock_quantity: 30,
                    featured: false,
                    status: 'active',
                },
                {
                    name: 'Pack Cartuchos Vaporesso XROS 0.6ohm (4 uds)',
                    slug: 'pack-cartuchos-vaporesso-xros-06ohm',
                    description: 'Pack de 4 cartuchos de repuesto compatibles con la serie XROS de Vaporesso.',
                    short_description: 'Pack 4 cartuchos de repuesto 0.6ohm.',
                    category_id: categoryMap['accesorios-repuestos'],
                    price_amount: 5500,
                    compare_at_amount: 6500,
                    stock_quantity: 18,
                    featured: false,
                    status: 'active',
                }
            ];

            let count = 0;
            for (const prod of sampleProducts) {
                const { error: prodErr } = await supabase.from('products').upsert({
                    store_id: storeId,
                    name: prod.name,
                    slug: prod.slug,
                    description: prod.description,
                    short_description: prod.short_description,
                    category_id: prod.category_id || null,
                    price_amount: prod.price_amount,
                    compare_at_amount: prod.compare_at_amount,
                    stock_quantity: prod.stock_quantity,
                    featured: prod.featured,
                    status: prod.status,
                }, { onConflict: 'store_id,slug' });

                if (!prodErr) count++;
            }

            return { success: true, insertedCount: count };
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Error al poblar productos iniciales.';
            return { success: false, insertedCount: 0, error: errorMsg };
        }
    }
}
