import { supabase } from '@/lib/supabase';

export interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number; // Percentage (e.g. 15 = 15%) or Cents (e.g. 2000 = S/ 20.00)
    min_purchase_amount: number; // in cents
    max_uses?: number | null;
    uses_count: number;
    is_active: boolean;
    expires_at?: string | null;
    created_at: string;
}

export interface CreateCouponPayload {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_purchase_amount?: number;
    max_uses?: number | null;
    expires_at?: string | null;
}

export interface ValidationResult {
    valid: boolean;
    discountAmountCents: number;
    coupon?: Coupon;
    message: string;
}

const DEFAULT_DEMO_COUPONS: Coupon[] = [
    {
        id: 'cp-demo-001',
        code: 'OFERTA10',
        discount_type: 'percentage',
        discount_value: 10,
        min_purchase_amount: 5000, // S/ 50.00
        max_uses: 100,
        uses_count: 14,
        is_active: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
    },
    {
        id: 'cp-demo-002',
        code: 'DESCUENTO20',
        discount_type: 'fixed',
        discount_value: 2000, // S/ 20.00
        min_purchase_amount: 8000, // S/ 80.00
        max_uses: 50,
        uses_count: 8,
        is_active: true,
        expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
    },
    {
        id: 'cp-demo-003',
        code: 'BIENVENIDO',
        discount_type: 'percentage',
        discount_value: 15,
        min_purchase_amount: 0,
        max_uses: null,
        uses_count: 42,
        is_active: true,
        expires_at: null,
        created_at: new Date().toISOString(),
    }
];

export class CouponService {
    private static isSupabaseConfigured(): boolean {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        return Boolean(url && !url.includes('your-supabase-project') && !url.includes('placeholder'));
    }

    /**
     * Read coupons with local cache fallback
     */
    static async getCoupons(): Promise<Coupon[]> {
        let localCoupons: Coupon[] = [];
        if (typeof window !== 'undefined') {
            try {
                localCoupons = JSON.parse(localStorage.getItem('admin_coupons') || '[]');
            } catch {
                localCoupons = [];
            }
        }

        if (this.isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('coupons')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data && data.length > 0) {
                    const dbCoupons = data as Coupon[];
                    const combined = [...dbCoupons, ...localCoupons, ...DEFAULT_DEMO_COUPONS];
                    return combined.filter((c, idx, self) => idx === self.findIndex(x => x.code === c.code || x.id === c.id));
                }
            } catch {
                // Fallback to local below
            }
        }

        const combined = [...localCoupons, ...DEFAULT_DEMO_COUPONS];
        return combined.filter((c, idx, self) => idx === self.findIndex(x => x.code === c.code || x.id === c.id));
    }

    /**
     * Create a new promotional coupon
     */
    static async createCoupon(payload: CreateCouponPayload): Promise<Coupon> {
        const cleanCode = payload.code.trim().toUpperCase().replace(/\s+/g, '');
        const newCoupon: Coupon = {
            id: `cp-${Date.now()}`,
            code: cleanCode,
            discount_type: payload.discount_type,
            discount_value: payload.discount_value,
            min_purchase_amount: payload.min_purchase_amount || 0,
            max_uses: payload.max_uses || null,
            uses_count: 0,
            is_active: true,
            expires_at: payload.expires_at || null,
            created_at: new Date().toISOString(),
        };

        // Always update local cache
        if (typeof window !== 'undefined') {
            try {
                const local = JSON.parse(localStorage.getItem('admin_coupons') || '[]');
                local.unshift(newCoupon);
                localStorage.setItem('admin_coupons', JSON.stringify(local));
                window.dispatchEvent(new Event('coupons_updated'));
            } catch (e) {
                console.warn('Localstorage error:', e);
            }
        }

        // Also attempt DB insert
        if (this.isSupabaseConfigured()) {
            try {
                const { data: store } = await supabase.from('stores').select('id').single();
                if (store?.id) {
                    await supabase.from('coupons').insert({
                        store_id: store.id,
                        code: cleanCode,
                        discount_type: payload.discount_type,
                        discount_value: payload.discount_value,
                        min_purchase_amount: payload.min_purchase_amount || 0,
                        max_uses: payload.max_uses || null,
                        expires_at: payload.expires_at || null,
                    });
                }
            } catch {
                // Background error handled
            }
        }

        return newCoupon;
    }

    /**
     * Toggle active status
     */
    static async toggleCouponStatus(id: string, is_active: boolean): Promise<boolean> {
        if (typeof window !== 'undefined') {
            try {
                const local: Coupon[] = JSON.parse(localStorage.getItem('admin_coupons') || '[]');
                const idx = local.findIndex(c => c.id === id);
                if (idx !== -1) {
                    local[idx].is_active = is_active;
                    localStorage.setItem('admin_coupons', JSON.stringify(local));
                    window.dispatchEvent(new Event('coupons_updated'));
                }
            } catch {
                // Ignore
            }
        }

        if (this.isSupabaseConfigured()) {
            try {
                await supabase.from('coupons').update({ is_active }).eq('id', id);
            } catch {
                // Ignore
            }
        }

        return true;
    }

    /**
     * Delete coupon
     */
    static async deleteCoupon(id: string): Promise<boolean> {
        if (typeof window !== 'undefined') {
            try {
                const local: Coupon[] = JSON.parse(localStorage.getItem('admin_coupons') || '[]');
                const filtered = local.filter(c => c.id !== id);
                localStorage.setItem('admin_coupons', JSON.stringify(filtered));
                window.dispatchEvent(new Event('coupons_updated'));
            } catch {
                // Ignore
            }
        }

        if (this.isSupabaseConfigured()) {
            try {
                await supabase.from('coupons').delete().eq('id', id);
            } catch {
                // Ignore
            }
        }

        return true;
    }

    /**
     * Validate a coupon code during checkout
     */
    static async validateCoupon(rawCode: string, subtotalCents: number): Promise<ValidationResult> {
        const cleanCode = rawCode.trim().toUpperCase();
        if (!cleanCode) {
            return { valid: false, discountAmountCents: 0, message: 'Por favor ingresa un código de cupón.' };
        }

        const coupons = await this.getCoupons();
        const found = coupons.find(c => c.code === cleanCode);

        if (!found) {
            return { valid: false, discountAmountCents: 0, message: 'El código de cupón ingresado no existe.' };
        }

        if (!found.is_active) {
            return { valid: false, discountAmountCents: 0, message: 'Este cupón se encuentra inactivo actualmente.' };
        }

        if (found.expires_at && new Date(found.expires_at) < new Date()) {
            return { valid: false, discountAmountCents: 0, message: 'Este cupón de descuento ha expirado.' };
        }

        if (found.max_uses && found.uses_count >= found.max_uses) {
            return { valid: false, discountAmountCents: 0, message: 'Este cupón ha alcanzado su límite de usos.' };
        }

        if (found.min_purchase_amount && subtotalCents < found.min_purchase_amount) {
            const minSoles = (found.min_purchase_amount / 100).toFixed(2);
            return {
                valid: false,
                discountAmountCents: 0,
                message: `Este cupón requiere un monto mínimo de compra de S/ ${minSoles}.`
            };
        }

        // Calculate discount amount
        let discountCents = 0;
        if (found.discount_type === 'percentage') {
            discountCents = Math.round((subtotalCents * found.discount_value) / 100);
        } else {
            discountCents = Math.min(subtotalCents, found.discount_value);
        }

        return {
            valid: true,
            discountAmountCents: discountCents,
            coupon: found,
            message: `¡Cupón ${found.code} aplicado con éxito! Descuento: ${found.discount_type === 'percentage' ? `${found.discount_value}%` : `S/ ${(discountCents / 100).toFixed(2)}`}`
        };
    }
}
