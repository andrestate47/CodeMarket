import { formatMoney } from '@/lib/money';

export interface ProductPricingInfo {
    currentPriceAmount: number;
    currentPriceFormatted: string;
    compareAtPriceAmount: number | null;
    compareAtPriceFormatted: string | null;
    isOnSale: boolean;
    discountPercentage: number;
    amountSavedAmount: number;
    amountSavedFormatted: string;
    isMultiVariant?: boolean;
    hasVariantSale?: boolean;
    maxDiscountPercentage?: number;
    minPriceAmount?: number;
    displayBadgeText?: string | null;
}

export function isProductOnSale(priceAmount: number, compareAtAmount?: number | null): boolean {
    if (!compareAtAmount || compareAtAmount <= 0) return false;
    return compareAtAmount > priceAmount;
}

export function calculateDiscountPercentage(priceAmount: number, compareAtAmount: number): number {
    if (!compareAtAmount || compareAtAmount <= 0 || compareAtAmount <= priceAmount) return 0;
    const pct = Math.round(((compareAtAmount - priceAmount) / compareAtAmount) * 100);
    return Math.max(0, Math.min(99, pct));
}

export interface GenericProductPricingInput {
    price_amount?: number | null;
    compare_at_amount?: number | null;
    price?: string | number | null;
    compare_price?: string | number | null;
    currency?: string;
    has_variants?: boolean;
    variants?: Array<{
        id?: string;
        price_amount?: number | null;
        compare_at_amount?: number | null;
        price?: string | number | null;
        compare_price?: string | number | null;
    }>;
}

function parsePriceToNumber(val?: string | number | null): number {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const clean = String(val).replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

export function getProductPricing(
    product: GenericProductPricingInput,
    selectedVariantId?: string | null
): ProductPricingInfo {
    const currency = product.currency || 'PEN';

    // 1. If a specific variant is selected, derive pricing from that variant
    if (selectedVariantId && product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => v.id === selectedVariantId);
        if (variant) {
            const vPrice = variant.price_amount ?? parsePriceToNumber(variant.price);
            const vCompare = variant.compare_at_amount ?? parsePriceToNumber(variant.compare_price);

            const onSale = isProductOnSale(vPrice, vCompare);
            const pct = onSale && vCompare ? calculateDiscountPercentage(vPrice, vCompare) : 0;
            const saved = onSale && vCompare ? Math.max(0, vCompare - vPrice) : 0;

            return {
                currentPriceAmount: vPrice,
                currentPriceFormatted: formatMoney(vPrice, currency),
                compareAtPriceAmount: onSale ? (vCompare ?? null) : null,
                compareAtPriceFormatted: onSale && vCompare ? formatMoney(vCompare, currency) : null,
                isOnSale: onSale,
                discountPercentage: pct,
                amountSavedAmount: saved,
                amountSavedFormatted: formatMoney(saved, currency),
                displayBadgeText: onSale && pct > 0 ? `-${pct}%` : null,
            };
        }
    }

    // 2. Base Product Prices
    const basePrice = product.price_amount ?? parsePriceToNumber(product.price);
    const baseCompare = product.compare_at_amount ?? parsePriceToNumber(product.compare_price);

    // 3. Multi-variant evaluation
    const variants = product.variants || [];
    const hasVariants = Boolean(product.has_variants || variants.length > 0);

    if (hasVariants && variants.length > 0) {
        let maxDiscount = 0;
        let minPrice = Infinity;
        let anyVariantOnSale = false;

        variants.forEach(v => {
            const vp = v.price_amount ?? parsePriceToNumber(v.price);
            const vc = v.compare_at_amount ?? parsePriceToNumber(v.compare_price);

            if (vp > 0 && vp < minPrice) minPrice = vp;

            if (isProductOnSale(vp, vc) && vc) {
                anyVariantOnSale = true;
                const pct = calculateDiscountPercentage(vp, vc);
                if (pct > maxDiscount) maxDiscount = pct;
            }
        });

        // Also check base product prices
        const baseOnSale = isProductOnSale(basePrice, baseCompare);
        if (baseOnSale && baseCompare) {
            anyVariantOnSale = true;
            const basePct = calculateDiscountPercentage(basePrice, baseCompare);
            if (basePct > maxDiscount) maxDiscount = basePct;
        }

        const effectivePrice = minPrice !== Infinity ? minPrice : basePrice;
        const effectiveCompare = baseOnSale ? baseCompare : null;
        const saved = baseOnSale && baseCompare ? Math.max(0, baseCompare - effectivePrice) : 0;

        let badgeText: string | null = null;
        if (anyVariantOnSale && maxDiscount > 0) {
            badgeText = `Hasta -${maxDiscount}%`;
        }

        return {
            currentPriceAmount: effectivePrice,
            currentPriceFormatted: formatMoney(effectivePrice, currency),
            compareAtPriceAmount: effectiveCompare,
            compareAtPriceFormatted: effectiveCompare ? formatMoney(effectiveCompare, currency) : null,
            isOnSale: anyVariantOnSale,
            discountPercentage: maxDiscount,
            amountSavedAmount: saved,
            amountSavedFormatted: formatMoney(saved, currency),
            isMultiVariant: true,
            hasVariantSale: anyVariantOnSale,
            maxDiscountPercentage: maxDiscount,
            minPriceAmount: effectivePrice,
            displayBadgeText: badgeText,
        };
    }

    // 4. Single Product evaluation
    const onSale = isProductOnSale(basePrice, baseCompare);
    const pct = onSale && baseCompare ? calculateDiscountPercentage(basePrice, baseCompare) : 0;
    const saved = onSale && baseCompare ? Math.max(0, baseCompare - basePrice) : 0;

    return {
        currentPriceAmount: basePrice,
        currentPriceFormatted: formatMoney(basePrice, currency),
        compareAtPriceAmount: onSale ? (baseCompare ?? null) : null,
        compareAtPriceFormatted: onSale && baseCompare ? formatMoney(baseCompare, currency) : null,
        isOnSale: onSale,
        discountPercentage: pct,
        amountSavedAmount: saved,
        amountSavedFormatted: formatMoney(saved, currency),
        displayBadgeText: onSale && pct > 0 ? `-${pct}%` : null,
    };
}
