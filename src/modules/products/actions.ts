'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, verifyAdminToken } from '@/lib/auth/admin';
import type { CatalogProduct } from '@/modules/catalog/queries';
import { mapDbProduct, PRODUCT_SELECT } from './mapper';

const STORE_SLUG = 'codemarket';
const BUCKET = 'products';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

type Result<T = undefined> = { success: true; data: T } | { success: false; error: string };

function fail(err: unknown): { success: false; error: string } {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' };
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

async function getStoreId(): Promise<string> {
    const db = createAdminClient();
    const { data } = await db.from('stores').select('id').eq('slug', STORE_SLUG).maybeSingle();
    if (data?.id) return data.id;
    const { data: first } = await db.from('stores').select('id').limit(1).maybeSingle();
    if (!first?.id) throw new Error('No hay ninguna tienda creada en la base de datos.');
    return first.id;
}

function revalidateStore() {
    revalidatePath('/');
    revalidatePath('/ofertas');
    revalidatePath('/productos/[id]', 'page');
}

/* ------------------------------------------------------------------ */
/* Acceso                                                              */
/* ------------------------------------------------------------------ */

export async function checkAdminAccessAction(accessToken: string): Promise<{ isAdmin: boolean; email?: string; name?: string }> {
    const admin = await verifyAdminToken(accessToken);
    return admin ? { isAdmin: true, email: admin.email, name: admin.name } : { isAdmin: false };
}

/* ------------------------------------------------------------------ */
/* Lectura (panel)                                                     */
/* ------------------------------------------------------------------ */

export async function getAdminProductsAction(accessToken: string): Promise<Result<CatalogProduct[]>> {
    try {
        await requireAdmin(accessToken);
        const { data, error } = await createAdminClient()
            .from('products')
            .select(PRODUCT_SELECT)
            .neq('status', 'archived')
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return { success: true, data: (data || []).map(mapDbProduct) };
    } catch (err) {
        return fail(err);
    }
}

export async function getAdminProductAction(accessToken: string, id: string): Promise<Result<CatalogProduct>> {
    try {
        await requireAdmin(accessToken);
        const { data, error } = await createAdminClient()
            .from('products')
            .select(PRODUCT_SELECT)
            .eq('id', id)
            .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) throw new Error('No se encontró el producto.');
        return { success: true, data: mapDbProduct(data) };
    } catch (err) {
        return fail(err);
    }
}

/* ------------------------------------------------------------------ */
/* Escritura                                                           */
/* ------------------------------------------------------------------ */

export interface ProductInput {
    name: string;
    short_description?: string;
    description?: string;
    image?: string;
    price_amount: number;
    compare_at_amount?: number | null;
    product_type?: 'digital' | 'service' | 'physical';
    category_id?: string | null;
    status?: 'active' | 'draft';
    track_inventory?: boolean;
    stock_quantity?: number;
    featured?: boolean;
    variants?: { id: string; name: string; price: string; stock: number }[];
    wholesale_rules?: { minQuantity: number; price: string }[];
}

function validateInput(input: ProductInput) {
    if (!input.name?.trim()) throw new Error('El nombre del producto es obligatorio.');
    if (!Number.isFinite(input.price_amount) || input.price_amount < 0) throw new Error('El precio no es válido.');
    if (input.compare_at_amount != null && (!Number.isFinite(input.compare_at_amount) || input.compare_at_amount < 0)) {
        throw new Error('El precio de comparación no es válido.');
    }
    if (input.image && input.image.startsWith('data:')) {
        throw new Error('La imagen debe subirse a Storage antes de guardar el producto.');
    }
}

function buildRow(input: ProductInput, previousMeta: Record<string, unknown> = {}) {
    return {
        name: input.name.trim(),
        short_description: input.short_description?.trim() || null,
        description: input.description?.trim() || null,
        product_type: input.product_type || 'physical',
        status: input.status || 'active',
        price_amount: Math.round(input.price_amount),
        compare_at_amount: input.compare_at_amount ? Math.round(input.compare_at_amount) : null,
        category_id: input.category_id || null,
        track_inventory: Boolean(input.track_inventory),
        stock_quantity: Math.max(0, Math.round(input.stock_quantity ?? 0)),
        featured: Boolean(input.featured),
        metadata: {
            ...previousMeta,
            image: input.image || previousMeta.image || null,
            features: input.short_description ? [input.short_description.trim()] : (previousMeta.features || []),
            variants: input.variants ?? previousMeta.variants ?? [],
            wholesale_rules: input.wholesale_rules ?? previousMeta.wholesale_rules ?? [],
            cta: input.product_type === 'service' ? 'Cotizar Proyecto' : 'Agregar al Carrito',
        },
    };
}

export async function createProductAction(accessToken: string, input: ProductInput): Promise<Result<CatalogProduct>> {
    try {
        await requireAdmin(accessToken);
        validateInput(input);
        const db = createAdminClient();
        const storeId = await getStoreId();
        const baseSlug = slugify(input.name) || 'producto';

        const { data, error } = await db
            .from('products')
            .insert({ ...buildRow(input), store_id: storeId, currency: 'PEN', slug: `${baseSlug}-${Date.now().toString(36)}` })
            .select(PRODUCT_SELECT)
            .single();
        if (error) throw new Error(error.message);

        revalidateStore();
        return { success: true, data: mapDbProduct(data) };
    } catch (err) {
        return fail(err);
    }
}

export async function updateProductAction(accessToken: string, id: string, input: ProductInput): Promise<Result<CatalogProduct>> {
    try {
        await requireAdmin(accessToken);
        validateInput(input);
        const db = createAdminClient();

        const { data: existing, error: findErr } = await db.from('products').select('metadata').eq('id', id).maybeSingle();
        if (findErr) throw new Error(findErr.message);
        if (!existing) throw new Error('El producto no existe.');

        const { data, error } = await db
            .from('products')
            .update({ ...buildRow(input, (existing.metadata as Record<string, unknown>) || {}), updated_at: new Date().toISOString() })
            .eq('id', id)
            .select(PRODUCT_SELECT)
            .single();
        if (error) throw new Error(error.message);

        revalidateStore();
        return { success: true, data: mapDbProduct(data) };
    } catch (err) {
        return fail(err);
    }
}

export interface ProductBulkPatch {
    status?: 'active' | 'draft';
    price_amount?: number;
    stock_quantity?: number;
    category_id?: string | null;
}

export async function updateProductsFieldsAction(accessToken: string, ids: string[], patch: ProductBulkPatch): Promise<Result> {
    try {
        await requireAdmin(accessToken);
        if (!ids.length) return { success: true, data: undefined };

        const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (patch.status) update.status = patch.status;
        if (patch.price_amount !== undefined) {
            if (!Number.isFinite(patch.price_amount) || patch.price_amount < 0) throw new Error('Precio inválido.');
            update.price_amount = Math.round(patch.price_amount);
        }
        if (patch.stock_quantity !== undefined) {
            if (!Number.isFinite(patch.stock_quantity) || patch.stock_quantity < 0) throw new Error('Stock inválido.');
            update.stock_quantity = Math.round(patch.stock_quantity);
        }
        if (patch.category_id !== undefined) update.category_id = patch.category_id;

        const { error } = await createAdminClient().from('products').update(update).in('id', ids);
        if (error) throw new Error(error.message);

        revalidateStore();
        return { success: true, data: undefined };
    } catch (err) {
        return fail(err);
    }
}

export async function duplicateProductAction(accessToken: string, id: string): Promise<Result<CatalogProduct>> {
    try {
        await requireAdmin(accessToken);
        const db = createAdminClient();
        const { data: src, error: findErr } = await db.from('products').select('*').eq('id', id).maybeSingle();
        if (findErr) throw new Error(findErr.message);
        if (!src) throw new Error('El producto no existe.');

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, created_at: _c, updated_at: _u, ...rest } = src;
        const { data, error } = await db
            .from('products')
            .insert({ ...rest, name: `${src.name} (Copia)`, slug: `${src.slug}-copia-${Date.now().toString(36)}`, status: 'draft' })
            .select(PRODUCT_SELECT)
            .single();
        if (error) throw new Error(error.message);

        return { success: true, data: mapDbProduct(data) };
    } catch (err) {
        return fail(err);
    }
}

/**
 * Elimina productos. Si un producto ya tiene pedidos, se archiva en lugar de borrarse
 * para no perder el historial de ventas.
 */
export async function deleteProductsAction(accessToken: string, ids: string[]): Promise<Result<{ deleted: number; archived: number }>> {
    try {
        await requireAdmin(accessToken);
        if (!ids.length) return { success: true, data: { deleted: 0, archived: 0 } };
        const db = createAdminClient();

        const { data: sold } = await db.from('order_items').select('product_id').in('product_id', ids);
        const soldIds = Array.from(new Set((sold || []).map(r => String(r.product_id))));
        const deletableIds = ids.filter(id => !soldIds.includes(id));

        if (soldIds.length) {
            const { error } = await db.from('products').update({ status: 'archived' }).in('id', soldIds);
            if (error) throw new Error(error.message);
        }
        if (deletableIds.length) {
            const { error } = await db.from('products').delete().in('id', deletableIds);
            if (error) throw new Error(error.message);
        }

        revalidateStore();
        return { success: true, data: { deleted: deletableIds.length, archived: soldIds.length } };
    } catch (err) {
        return fail(err);
    }
}

/* ------------------------------------------------------------------ */
/* Imágenes                                                            */
/* ------------------------------------------------------------------ */

export async function uploadProductImageAction(accessToken: string, formData: FormData): Promise<Result<string>> {
    try {
        await requireAdmin(accessToken);
        const file = formData.get('file');
        if (!(file instanceof File)) throw new Error('No se recibió ninguna imagen.');
        if (!file.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen.');
        if (file.size > MAX_IMAGE_BYTES) throw new Error('La imagen supera los 4 MB.');

        const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';
        const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const db = createAdminClient();

        const { error } = await db.storage.from(BUCKET).upload(path, file, {
            contentType: file.type,
            cacheControl: '31536000',
            upsert: false,
        });
        if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);

        return { success: true, data: db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
    } catch (err) {
        return fail(err);
    }
}
