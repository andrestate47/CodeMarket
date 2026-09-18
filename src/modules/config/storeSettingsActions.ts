'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export interface PaymentMethodSetting {
    id: string;
    name: string;
    is_active: boolean;
    type: string;
    number?: string;
    holder?: string;
    qr_url?: string;
    instructions?: string;
    banks?: { bank: string; account: string; cci?: string; holder: string }[];
}

export interface ShippingMethodSetting {
    id: string;
    name: string;
    is_active: boolean;
    price_amount: number; // in cents
    estimated_days?: string;
    requires_address: boolean;
    address_details?: string;
}

export interface CompleteStoreSettings {
    storeName: string;
    storeTagline?: string;
    currency: string;
    supportEmail: string;
    whatsappPhone: string;
    enableAutoWhatsappRedirect: boolean;
    requireEmail: boolean;
    requireAgeConfirmation: boolean;
    paymentMethods: PaymentMethodSetting[];
    shippingMethods: ShippingMethodSetting[];
}

/**
 * Fetch full store configuration settings for Admin panel
 */
export async function getFullStoreSettingsAction(): Promise<{
    success: boolean;
    settings?: CompleteStoreSettings;
    error?: string;
}> {
    try {
        const adminClient = createAdminClient();
        const { data: store, error } = await adminClient
            .from('stores')
            .select('name, currency, whatsapp_phone, metadata')
            .eq('slug', 'codemarket')
            .single();

        if (error || !store) {
            return { success: false, error: 'No se pudo cargar la configuración de la tienda.' };
        }

        const meta = store.metadata || {};

        const defaultPaymentMethods: PaymentMethodSetting[] = [
            {
                id: 'yape',
                name: 'Yape',
                is_active: true,
                type: 'manual',
                number: '999 999 999',
                holder: 'CodeMarket Perú',
                instructions: 'Abre Yape en tu teléfono, yapea al número o escanea el QR. En la nota o concepto indica únicamente tu número de pedido.'
            },
            {
                id: 'plin',
                name: 'Plin',
                is_active: true,
                type: 'manual',
                number: '999 999 999',
                holder: 'CodeMarket Perú',
                instructions: 'Transfiere por Plin al número indicado usando tu código de pedido como concepto.'
            },
            {
                id: 'bank_transfer',
                name: 'Transferencia Bancaria',
                is_active: true,
                type: 'manual',
                banks: [
                    { bank: 'BCP', account: '193-0000000-0-00', cci: '002-193-000000000000-00', holder: 'CodeMarket S.A.C.' },
                    { bank: 'BBVA', account: '0011-0000-00000000-00', cci: '011-000-000000000000-00', holder: 'CodeMarket S.A.C.' }
                ],
                instructions: 'Transfiere el monto exacto a cualquiera de nuestras cuentas bancarias oficiales e incluye el número de pedido en la glosa.'
            },
            {
                id: 'cash_on_delivery',
                name: 'Pago Contra Entrega (Efectivo / POS)',
                is_active: true,
                type: 'manual',
                instructions: 'Disponible únicamente para Delivery Local en Lima Metropolitana.'
            }
        ];

        const defaultShippingMethods: ShippingMethodSetting[] = [
            {
                id: 'delivery_local',
                name: 'Delivery Local (Lima Metropolitana)',
                is_active: true,
                price_amount: 1000,
                estimated_days: '1 - 2 días hábiles',
                requires_address: true
            },
            {
                id: 'shipping_national',
                name: 'Envío Nacional (Provincias por Shalom / Olva)',
                is_active: true,
                price_amount: 2000,
                estimated_days: '2 - 4 días hábiles',
                requires_address: true
            },
            {
                id: 'store_pickup',
                name: 'Recojo en Tienda / Almacén (Gratis)',
                is_active: true,
                price_amount: 0,
                estimated_days: 'Mismo día',
                requires_address: false,
                address_details: 'Av. Javier Prado Este 456, San Isidro, Lima'
            }
        ];

        return {
            success: true,
            settings: {
                storeName: store.name || 'TiendaVir',
                storeTagline: meta.store_tagline || 'Tu Tienda Virtual Premium',
                currency: store.currency || 'PEN',
                supportEmail: meta.support_email || 'contacto@tiendavir.com',
                whatsappPhone: store.whatsapp_phone || '+51 987 654 321',
                enableAutoWhatsappRedirect: meta.enable_auto_whatsapp_redirect !== false,
                requireEmail: meta.require_email !== false,
                requireAgeConfirmation: Boolean(meta.require_age_confirmation),
                paymentMethods: meta.payment_methods || defaultPaymentMethods,
                shippingMethods: meta.shipping_methods || defaultShippingMethods,
            }
        };
    } catch (err) {
        return { success: false, error: 'Error inesperado al cargar ajustes de la tienda.' };
    }
}

/**
 * Update full store configuration settings
 */
export async function updateStoreSettingsAction(payload: Partial<CompleteStoreSettings>): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const adminClient = createAdminClient();

        const { data: store } = await adminClient
            .from('stores')
            .select('id, metadata')
            .eq('slug', 'codemarket')
            .single();

        if (!store) {
            return { success: false, error: 'No se encontró la tienda principal.' };
        }

        const currentMeta = store.metadata || {};

        const updatedMeta = {
            ...currentMeta,
            ...(payload.storeTagline !== undefined && { store_tagline: payload.storeTagline }),
            ...(payload.supportEmail !== undefined && { support_email: payload.supportEmail }),
            ...(payload.enableAutoWhatsappRedirect !== undefined && { enable_auto_whatsapp_redirect: payload.enableAutoWhatsappRedirect }),
            ...(payload.requireEmail !== undefined && { require_email: payload.requireEmail }),
            ...(payload.requireAgeConfirmation !== undefined && { require_age_confirmation: payload.requireAgeConfirmation }),
            ...(payload.paymentMethods !== undefined && { payment_methods: payload.paymentMethods }),
            ...(payload.shippingMethods !== undefined && { shipping_methods: payload.shippingMethods }),
        };

        const updateData: Record<string, unknown> = {
            metadata: updatedMeta,
            updated_at: new Date().toISOString(),
        };

        if (payload.storeName) {
            updateData.name = payload.storeName;
        }

        if (payload.whatsappPhone !== undefined) {
            updateData.whatsapp_phone = payload.whatsappPhone;
        }

        const { error } = await adminClient
            .from('stores')
            .update(updateData)
            .eq('id', store.id);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al guardar la configuración.';
        return { success: false, error: errorMsg };
    }
}
