'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export interface CategoryRecord {
    id: string;
    store_id?: string;
    parent_id?: string | null;
    name: string;
    slug: string;
    description?: string | null;
    image_url?: string | null;
    is_active: boolean;
    sort_order: number;
    seo_title?: string | null;
    seo_description?: string | null;
    created_at?: string;
    updated_at?: string;

    // Optional calculated fields
    product_count?: number;
    parent_name?: string;
}

export interface CategoryPayload {
    name: string;
    description?: string;
    parent_id?: string | null;
    image_url?: string;
    is_active?: boolean;
    slug?: string;
    sort_order?: number;
    seo_title?: string;
    seo_description?: string;
}

// In-Memory fallback store initialized with the Vapes demo categories
const MEMORY_DEMO_CATEGORIES: CategoryRecord[] = [
    // 1. DISPOSITIVOS
    {
        id: 'cat-dispositivos',
        parent_id: null,
        name: 'Dispositivos',
        slug: 'dispositivos',
        description: 'Equipos y dispositivos de vapeo.',
        image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&auto=format&fit=crop&q=80',
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-desechables',
        parent_id: 'cat-dispositivos',
        name: 'Desechables',
        slug: 'desechables',
        description: 'Dispositivos de vapeo desechables listos para usar.',
        image_url: null,
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-kits',
        parent_id: 'cat-dispositivos',
        name: 'Kits',
        slug: 'kits',
        description: 'Kits completos de inicio y avanzados.',
        image_url: null,
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-pod-systems',
        parent_id: 'cat-dispositivos',
        name: 'Pod Systems',
        slug: 'pod-systems',
        description: 'Sistemas pod recargables y portátiles.',
        image_url: null,
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-mods',
        parent_id: 'cat-dispositivos',
        name: 'Mods',
        slug: 'mods',
        description: 'Dispositivos avanzados con control de potencia.',
        image_url: null,
        is_active: false,
        sort_order: 4,
        created_at: new Date().toISOString(),
    },

    // 2. PODS Y CARTUCHOS
    {
        id: 'cat-pods',
        parent_id: null,
        name: 'Pods y Cartuchos',
        slug: 'pods-cartuchos',
        description: 'Pods, cartuchos y repuestos compatibles con dispositivos.',
        image_url: 'https://images.unsplash.com/photo-1527016016007-44c1064560cd?w=400&auto=format&fit=crop&q=80',
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-pods-recargables',
        parent_id: 'cat-pods',
        name: 'Pods recargables',
        slug: 'pods-recargables',
        description: 'Pods de tanque recargables para e-liquids.',
        image_url: null,
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-cartuchos',
        parent_id: 'cat-pods',
        name: 'Cartuchos',
        slug: 'cartuchos',
        description: 'Cartuchos de reemplazo estándar.',
        image_url: null,
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-pods-prellenados',
        parent_id: 'cat-pods',
        name: 'Pods prellenados',
        slug: 'pods-prellenados',
        description: 'Pods con líquido incluido listos para instalar.',
        image_url: null,
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
    },

    // 3. RESISTENCIAS
    {
        id: 'cat-resistencias',
        parent_id: null,
        name: 'Resistencias',
        slug: 'resistencias',
        description: 'Resistencias y repuestos para dispositivos compatibles.',
        image_url: null,
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-mesh',
        parent_id: 'cat-resistencias',
        name: 'Mesh',
        slug: 'mesh',
        description: 'Resistencias con tecnología mesh para mejor sabor.',
        image_url: null,
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-coils',
        parent_id: 'cat-resistencias',
        name: 'Coils',
        slug: 'coils',
        description: 'Coils y bobinas de repuesto tradicionales.',
        image_url: null,
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-resistencias-marca',
        parent_id: 'cat-resistencias',
        name: 'Resistencias por marca',
        slug: 'resistencias-marca',
        description: 'Resistencias organizadas según marca del fabricante.',
        image_url: null,
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
    },

    // 4. LÍQUIDOS
    {
        id: 'cat-liquidos',
        parent_id: null,
        name: 'Líquidos',
        slug: 'liquidos',
        description: 'Líquidos y sabores disponibles para dispositivos compatibles.',
        image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&auto=format&fit=crop&q=80',
        is_active: true,
        sort_order: 4,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-frutales',
        parent_id: 'cat-liquidos',
        name: 'Frutales',
        slug: 'frutales',
        description: 'Sabores de frutas frescas y combinaciones tropicales.',
        image_url: null,
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-mentolados',
        parent_id: 'cat-liquidos',
        name: 'Mentolados',
        slug: 'mentolados',
        description: 'Sabores con toque mentolado y refrescante.',
        image_url: null,
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-dulces',
        parent_id: 'cat-liquidos',
        name: 'Dulces',
        slug: 'dulces',
        description: 'Sabores de postres, golosinas y bebidas.',
        image_url: null,
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-tabaco',
        parent_id: 'cat-liquidos',
        name: 'Tabaco',
        slug: 'tabaco',
        description: 'Líquidos con perfiles de sabor a tabaco tradicional.',
        image_url: null,
        is_active: true,
        sort_order: 4,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-otros-liquidos',
        parent_id: 'cat-liquidos',
        name: 'Otros',
        slug: 'otros-liquidos',
        description: 'Otras variedades y combinaciones especiales.',
        image_url: null,
        is_active: true,
        sort_order: 5,
        created_at: new Date().toISOString(),
    },

    // 5. ACCESORIOS
    {
        id: 'cat-accesorios',
        parent_id: null,
        name: 'Accesorios',
        slug: 'accesorios',
        description: 'Accesorios y complementos.',
        image_url: null,
        is_active: true,
        sort_order: 5,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-cargadores',
        parent_id: 'cat-accesorios',
        name: 'Cargadores',
        slug: 'cargadores',
        description: 'Cargadores y cables USB-C / externos.',
        image_url: null,
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-baterias',
        parent_id: 'cat-accesorios',
        name: 'Baterías',
        slug: 'baterias',
        description: 'Baterías externas recargables para mods.',
        image_url: null,
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-estuches',
        parent_id: 'cat-accesorios',
        name: 'Estuches',
        slug: 'estuches',
        description: 'Estuches de protección y transporte.',
        image_url: null,
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-drip-tips',
        parent_id: 'cat-accesorios',
        name: 'Drip Tips',
        slug: 'drip-tips',
        description: 'Boquillas y drip tips personalizados.',
        image_url: null,
        is_active: true,
        sort_order: 4,
        created_at: new Date().toISOString(),
    },
    {
        id: 'cat-repuestos',
        parent_id: 'cat-accesorios',
        name: 'Repuestos',
        slug: 'repuestos',
        description: 'Empaques, vidrios de repuesto y herramientas.',
        image_url: null,
        is_active: true,
        sort_order: 5,
        created_at: new Date().toISOString(),
    },
];

import { generateSlug, isDescendant } from './utils';

let categoriesCache: { data: CategoryRecord[]; timestamp: number } | null = null;
const CATEGORIES_CACHE_TTL = 30000; // 30 seconds

/**
 * Fetch all categories with product counts and parent names
 */
export async function getCategoriesListAction(): Promise<{
    success: boolean;
    categories: CategoryRecord[];
    error?: string;
}> {
    if (categoriesCache && (Date.now() - categoriesCache.timestamp < CATEGORIES_CACHE_TTL)) {
        return { success: true, categories: categoriesCache.data };
    }

    try {
        let dbCategories: CategoryRecord[] = [];
        try {
            const adminClient = createAdminClient();

            const isPlaceholderUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project');
            if (!isPlaceholderUrl) {
                const { data, error } = await adminClient
                    .from('categories')
                    .select('*')
                    .order('sort_order', { ascending: true })
                    .order('name', { ascending: true });

                if (!error && data && data.length > 0) {
                    dbCategories = (data as unknown as CategoryRecord[]).map(item => ({
                        id: String(item.id),
                        store_id: item.store_id ? String(item.store_id) : undefined,
                        parent_id: item.parent_id ? String(item.parent_id) : null,
                        name: String(item.name),
                        slug: String(item.slug),
                        description: item.description ? String(item.description) : null,
                        image_url: item.image_url ? String(item.image_url) : null,
                        is_active: item.is_active ?? true,
                        sort_order: item.sort_order ?? 0,
                        seo_title: item.seo_title ? String(item.seo_title) : null,
                        seo_description: item.seo_description ? String(item.seo_description) : null,
                        created_at: item.created_at ? String(item.created_at) : undefined,
                        updated_at: item.updated_at ? String(item.updated_at) : undefined,
                    }));
                }
            }
        } catch {
            // Fallback to memory
        }

        // Combine DB categories with in-memory categories ensuring all unique IDs are preserved
        const categoriesMap = new Map<string, CategoryRecord>();

        // Load memory demo categories first
        MEMORY_DEMO_CATEGORIES.forEach(cat => {
            categoriesMap.set(cat.id, { ...cat });
        });

        // Override or append DB categories
        if (dbCategories.length > 0) {
            dbCategories.forEach(cat => {
                categoriesMap.set(cat.id, { ...cat });
            });
        }

        const allCategories = Array.from(categoriesMap.values());

        // Attach parent names and sort hierarchically (parents first, then indented children)
        const parentMap = new Map<string, string>();
        allCategories.forEach(c => parentMap.set(c.id, c.name));

        allCategories.forEach(c => {
            if (c.parent_id) {
                c.parent_name = parentMap.get(c.parent_id);
            }
        });

        categoriesCache = { data: allCategories, timestamp: Date.now() };
        return {
            success: true,
            categories: allCategories,
        };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al obtener la lista de categorías.';
        return {
            success: false,
            categories: [...MEMORY_DEMO_CATEGORIES],
            error: errorMsg,
        };
    }
}

/**
 * Create a new category
 */
export async function createCategoryAction(payload: CategoryPayload): Promise<{
    success: boolean;
    category?: CategoryRecord;
    error?: string;
}> {
    try {
        if (!payload.name || !payload.name.trim()) {
            return { success: false, error: 'El nombre de la categoría es obligatorio.' };
        }

        const cleanName = payload.name.trim();
        const slug = payload.slug && payload.slug.trim()
            ? generateSlug(payload.slug)
            : generateSlug(cleanName);

        if (!slug) {
            return { success: false, error: 'El slug generado no es válido.' };
        }

        // Check unique slug in memory demo list
        const slugExists = MEMORY_DEMO_CATEGORIES.some(c => c.slug === slug);
        if (slugExists) {
            return { success: false, error: `Ya existe una categoría con el slug "${slug}". Elige un nombre o slug diferente.` };
        }

        const newId = `cat-${Date.now()}`;
        const newCategory: CategoryRecord = {
            id: newId,
            parent_id: payload.parent_id || null,
            name: cleanName,
            slug,
            description: payload.description?.trim() || null,
            image_url: payload.image_url?.trim() || null,
            is_active: payload.is_active ?? true,
            sort_order: payload.sort_order ?? (MEMORY_DEMO_CATEGORIES.length + 1),
            seo_title: payload.seo_title?.trim() || null,
            seo_description: payload.seo_description?.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Save to DB if connection available
        try {
            const adminClient = createAdminClient();
            const isPlaceholderUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project');
            if (!isPlaceholderUrl) {
                const { data: store } = await adminClient.from('stores').select('id').single();
                if (store?.id) {
                    const { data, error } = await adminClient
                        .from('categories')
                        .insert({
                            store_id: store.id,
                            parent_id: payload.parent_id || null,
                            name: cleanName,
                            slug,
                            description: payload.description?.trim() || null,
                            image_url: payload.image_url?.trim() || null,
                            is_active: payload.is_active ?? true,
                            sort_order: payload.sort_order ?? 0,
                            seo_title: payload.seo_title?.trim() || null,
                            seo_description: payload.seo_description?.trim() || null,
                        })
                        .select('*')
                        .single();

                    if (!error && data) {
                        newCategory.id = data.id;
                        newCategory.store_id = data.store_id;
                    }
                }
            }
        } catch {
            console.warn('DB category insert skipped.');
        }

        // Add to memory list
        MEMORY_DEMO_CATEGORIES.unshift(newCategory);

        return {
            success: true,
            category: newCategory,
        };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al crear la categoría.';
        return { success: false, error: errorMsg };
    }
}

/**
 * Update an existing category with cycle prevention
 */
export async function updateCategoryAction(
    id: string,
    payload: CategoryPayload
): Promise<{
    success: boolean;
    category?: CategoryRecord;
    error?: string;
}> {
    try {
        const targetIndex = MEMORY_DEMO_CATEGORIES.findIndex(c => c.id === id);
        if (targetIndex === -1 && !id.startsWith('cat-')) {
            // Might be DB-only id
        }

        if (!payload.name || !payload.name.trim()) {
            return { success: false, error: 'El nombre de la categoría es obligatorio.' };
        }

        // Cycle Prevention
        if (payload.parent_id && isDescendant(MEMORY_DEMO_CATEGORIES, id, payload.parent_id)) {
            return {
                success: false,
                error: 'Acción no permitida: Una categoría no puede ser asignada como hija de una de sus propias subcategorías.',
            };
        }

        const cleanName = payload.name.trim();
        const slug = payload.slug && payload.slug.trim()
            ? generateSlug(payload.slug)
            : generateSlug(cleanName);

        // Check unique slug among other categories
        const duplicateSlug = MEMORY_DEMO_CATEGORIES.some(c => c.id !== id && c.slug === slug);
        if (duplicateSlug) {
            return { success: false, error: `Ya existe otra categoría con el slug "${slug}".` };
        }

        const updatedFields = {
            name: cleanName,
            slug,
            description: payload.description?.trim() || null,
            parent_id: payload.parent_id || null,
            image_url: payload.image_url !== undefined ? (payload.image_url?.trim() || null) : undefined,
            is_active: payload.is_active !== undefined ? payload.is_active : true,
            sort_order: payload.sort_order !== undefined ? payload.sort_order : 0,
            seo_title: payload.seo_title?.trim() || null,
            seo_description: payload.seo_description?.trim() || null,
            updated_at: new Date().toISOString(),
        };

        if (targetIndex !== -1) {
            MEMORY_DEMO_CATEGORIES[targetIndex] = {
                ...MEMORY_DEMO_CATEGORIES[targetIndex],
                ...updatedFields,
            };
        }

        // Update DB
        try {
            const adminClient = createAdminClient();
            const isPlaceholderUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project');
            if (!isPlaceholderUrl) {
                await adminClient
                    .from('categories')
                    .update({
                        name: cleanName,
                        slug,
                        description: payload.description?.trim() || null,
                        parent_id: payload.parent_id || null,
                        image_url: payload.image_url !== undefined ? payload.image_url : null,
                        is_active: payload.is_active,
                        sort_order: payload.sort_order,
                        seo_title: payload.seo_title?.trim() || null,
                        seo_description: payload.seo_description?.trim() || null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id);
            }
        } catch {
            console.warn('DB category update skipped.');
        }

        return {
            success: true,
            category: MEMORY_DEMO_CATEGORIES[targetIndex] || { id, ...updatedFields },
        };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al actualizar la categoría.';
        return { success: false, error: errorMsg };
    }
}

/**
 * Reorder categories by updating sort_order
 */
export async function reorderCategoriesAction(
    orderedItems: { id: string; sort_order: number }[]
): Promise<{ success: boolean; error?: string }> {
    try {
        orderedItems.forEach(item => {
            const cat = MEMORY_DEMO_CATEGORIES.find(c => c.id === item.id);
            if (cat) {
                cat.sort_order = item.sort_order;
                cat.updated_at = new Date().toISOString();
            }
        });

        // DB update
        try {
            const adminClient = createAdminClient();
            const isPlaceholderUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project');
            if (!isPlaceholderUrl) {
                for (const item of orderedItems) {
                    await adminClient
                        .from('categories')
                        .update({ sort_order: item.sort_order })
                        .eq('id', item.id);
                }
            }
        } catch {
            console.warn('DB category reorder skipped.');
        }

        return { success: true };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al reordenar categorías.';
        return { success: false, error: errorMsg };
    }
}

/**
 * Duplicate an existing category
 */
export async function duplicateCategoryAction(id: string): Promise<{
    success: boolean;
    category?: CategoryRecord;
    error?: string;
}> {
    try {
        const original = MEMORY_DEMO_CATEGORIES.find(c => c.id === id);
        if (!original) {
            return { success: false, error: 'Categoría original no encontrada.' };
        }

        const newName = `Copia de ${original.name}`;
        const newSlug = `${original.slug}-copia-${Date.now()}`;

        return await createCategoryAction({
            name: newName,
            slug: newSlug,
            description: original.description || undefined,
            parent_id: original.parent_id,
            image_url: original.image_url || undefined,
            is_active: original.is_active,
            sort_order: original.sort_order + 1,
            seo_title: original.seo_title || undefined,
            seo_description: original.seo_description || undefined,
        });
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al duplicar la categoría.';
        return { success: false, error: errorMsg };
    }
}

/**
 * Delete category safely with options for associated products and subcategories
 */
export async function deleteCategoryAction(
    id: string,
    resolution?: {
        productOption?: 'orphan' | 'reassign';
        targetCategoryId?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const index = MEMORY_DEMO_CATEGORIES.findIndex(c => c.id === id);

        // Check if has subcategories
        const children = MEMORY_DEMO_CATEGORIES.filter(c => c.parent_id === id);
        if (children.length > 0) {
            // Reassign children parent_id to null or deleted category's parent
            const deletedParentId = MEMORY_DEMO_CATEGORIES[index]?.parent_id || null;
            children.forEach(child => {
                child.parent_id = deletedParentId;
            });
        }

        if (index !== -1) {
            MEMORY_DEMO_CATEGORIES.splice(index, 1);
        }

        // DB deletion
        try {
            const adminClient = createAdminClient();
            const isPlaceholderUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project');
            if (!isPlaceholderUrl) {
                // Reassign products if requested
                if (resolution?.productOption === 'reassign' && resolution.targetCategoryId) {
                    await adminClient
                        .from('products')
                        .update({ category_id: resolution.targetCategoryId })
                        .eq('category_id', id);
                } else if (resolution?.productOption === 'orphan') {
                    await adminClient
                        .from('products')
                        .update({ category_id: null })
                        .eq('category_id', id);
                }

                await adminClient.from('categories').delete().eq('id', id);
            }
        } catch {
            console.warn('DB category delete skipped.');
        }

        return { success: true };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al eliminar la categoría.';
        return { success: false, error: errorMsg };
    }
}
