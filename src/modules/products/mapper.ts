import { formatMoney } from '@/lib/money';
import type { CatalogProduct } from '@/modules/catalog/queries';

export const DEFAULT_PRODUCT_IMAGE = '/web-basica-hero.png';

/**
 * Convierte una fila de la tabla `products` (con join opcional a `categories`)
 * al formato CatalogProduct que usan el panel y la tienda.
 *
 * Esquema real: name, price_amount (céntimos), compare_at_amount, featured,
 * product_type, metadata.image, metadata.features, metadata.variants...
 */
export function mapDbProduct(p: Record<string, unknown>): CatalogProduct {
    const meta = (p.metadata as Record<string, unknown>) || {};
    const priceCents = Number(p.price_amount || 0);
    const compareCents = p.compare_at_amount ? Number(p.compare_at_amount) : undefined;
    const currency = String(p.currency || 'PEN');
    const category = p.categories as { name?: string; slug?: string } | null | undefined;
    const shortDesc = p.short_description ? String(p.short_description) : '';
    const longDesc = p.description ? String(p.description) : '';

    return {
        id: String(p.id),
        title: String(p.name || ''),
        category: category?.name || 'General',
        category_id: p.category_id ? String(p.category_id) : undefined,
        description: shortDesc || longDesc,
        short_description: shortDesc || undefined,
        longDescription: longDesc || shortDesc,
        price: formatMoney(priceCents / 100, currency),
        comparePrice: compareCents ? formatMoney(compareCents / 100, currency) : undefined,
        price_amount: priceCents,
        compare_at_amount: compareCents,
        features: Array.isArray(meta.features) ? (meta.features as string[]) : [],
        type: (p.product_type as CatalogProduct['type']) || 'physical',
        cta: String(meta.cta || 'Agregar al Carrito'),
        highlight: Boolean(p.featured),
        color: String(meta.color || 'linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%)'),
        image: meta.image ? String(meta.image) : DEFAULT_PRODUCT_IMAGE,
        stock_quantity: Number(p.stock_quantity ?? 0),
        track_inventory: Boolean(p.track_inventory),
        status: String(p.status || 'active'),
        variants: Array.isArray(meta.variants) ? (meta.variants as CatalogProduct['variants']) : undefined,
        wholesale_rules: Array.isArray(meta.wholesale_rules) ? (meta.wholesale_rules as Record<string, unknown>[]) : undefined,
    };
}

export const PRODUCT_SELECT = '*, categories ( name, slug )';
