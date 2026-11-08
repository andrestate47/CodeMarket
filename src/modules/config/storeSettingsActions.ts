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
    ownerName?: string;
    storeName: string;
    storeTagline?: string;
    currency: string;
    supportEmail: string;
    whatsappPhone: string;
    storePhone?: string;
    storeCategory?: string;
    storeCountry?: string;
    storeAddresses?: string[];
    enableAutoWhatsappRedirect: boolean;
    requireEmail: boolean;
    requireAgeConfirmation?: boolean;
    paymentMethods: PaymentMethodSetting[];
    shippingMethods: ShippingMethodSetting[];
    // Appearance settings
    logoUrl?: string;
    faviconUrl?: string;
    logoShape?: 'cuadrada' | 'rectangular' | 'circular';
    coverEnabled?: boolean;
    descEnabled?: boolean;
    storeDescription?: string;
    bgType?: 'sin-fondo' | 'color' | 'trama' | 'imagen';
    cartEnabled?: boolean;
    selectedTemplate?: string;
    colorType?: 'predeterminados' | 'personalizado';
    primaryBg?: string;
    primaryText?: string;
    secondaryBg?: string;
    secondaryText?: string;
}

async function loadStoredMetadata(adminClient: ReturnType<typeof createAdminClient>, storeRow: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (storeRow.metadata && typeof storeRow.metadata === 'object') {
        return storeRow.metadata as Record<string, unknown>;
    }
    try {
        const { data, error } = await adminClient.storage
            .from('payment-receipts')
            .download('store-config/metadata.json');
        if (!error && data) {
            const text = await data.text();
            return JSON.parse(text);
        }
    } catch {
        // Fallback to empty object
    }
    return {};
}

async function saveStoredMetadata(adminClient: ReturnType<typeof createAdminClient>, meta: Record<string, unknown>): Promise<void> {
    try {
        const buffer = Buffer.from(JSON.stringify(meta, null, 2), 'utf-8');
        await adminClient.storage
            .from('payment-receipts')
            .upload('store-config/metadata.json', buffer, {
                contentType: 'application/json',
                upsert: true,
            });
    } catch {
        // Ignore storage write error
    }
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
            .select('*')
            .eq('slug', 'codemarket')
            .single();

        if (error || !store) {
            return { success: false, error: 'No se pudo cargar la configuración de la tienda.' };
        }

        const meta = (await loadStoredMetadata(adminClient, store as Record<string, unknown>)) as Record<string, any>;

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
                ownerName: meta.owner_name || 'Andrés',
                storeName: store.name || 'TiendaVir',
                storeTagline: meta.store_tagline || 'Tu Tienda Virtual Premium',
                currency: store.currency || 'PEN',
                supportEmail: meta.support_email || 'contacto@tiendavir.com',
                whatsappPhone: store.whatsapp_phone || '+51 987 654 321',
                storePhone: meta.store_phone || '',
                storeCategory: meta.store_category || 'Hogar y Cocina',
                storeCountry: meta.store_country || 'Perú',
                storeAddresses: meta.store_addresses || ['Jr. San Lorenzo 1064 - https://maps.app.goo.gl/P8su1pJh4h4YixUh7'],
                enableAutoWhatsappRedirect: meta.enable_auto_whatsapp_redirect !== false,
                requireEmail: meta.require_email !== false,
                requireAgeConfirmation: Boolean(meta.require_age_confirmation),
                paymentMethods: meta.payment_methods || defaultPaymentMethods,
                shippingMethods: meta.shipping_methods || defaultShippingMethods,
                // Appearance settings
                logoUrl: meta.logo_url || '',
                faviconUrl: meta.favicon_url || '',
                logoShape: meta.logo_shape || 'circular',
                coverEnabled: meta.cover_enabled !== false,
                descEnabled: meta.desc_enabled !== false,
                storeDescription: meta.store_description || 'Somos una tienda online dedicada a la elaboración de objetos de diseño...',
                bgType: meta.bg_type || 'sin-fondo',
                cartEnabled: meta.cart_enabled !== false,
                selectedTemplate: meta.selected_template || '1',
                colorType: meta.color_type || 'personalizado',
                primaryBg: meta.primary_bg || '#f7ce46',
                primaryText: meta.primary_text || 'Negro',
                secondaryBg: meta.secondary_bg || '#f7ce46',
                secondaryText: meta.secondary_text || 'Negro',
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
            .select('*')
            .eq('slug', 'codemarket')
            .single();

        if (!store) {
            return { success: false, error: 'No se encontró la tienda principal.' };
        }

        const currentMeta = await loadStoredMetadata(adminClient, store as Record<string, unknown>);

        const updatedMeta = {
            ...currentMeta,
            ...(payload.ownerName !== undefined && { owner_name: payload.ownerName }),
            ...(payload.storeTagline !== undefined && { store_tagline: payload.storeTagline }),
            ...(payload.supportEmail !== undefined && { support_email: payload.supportEmail }),
            ...(payload.storePhone !== undefined && { store_phone: payload.storePhone }),
            ...(payload.storeCategory !== undefined && { store_category: payload.storeCategory }),
            ...(payload.storeCountry !== undefined && { store_country: payload.storeCountry }),
            ...(payload.storeAddresses !== undefined && { store_addresses: payload.storeAddresses }),
            ...(payload.enableAutoWhatsappRedirect !== undefined && { enable_auto_whatsapp_redirect: payload.enableAutoWhatsappRedirect }),
            ...(payload.requireEmail !== undefined && { require_email: payload.requireEmail }),
            ...(payload.requireAgeConfirmation !== undefined && { require_age_confirmation: payload.requireAgeConfirmation }),
            ...(payload.paymentMethods !== undefined && { payment_methods: payload.paymentMethods }),
            ...(payload.shippingMethods !== undefined && { shipping_methods: payload.shippingMethods }),
            // Appearance settings
            ...(payload.logoUrl !== undefined && { logo_url: payload.logoUrl }),
            ...(payload.faviconUrl !== undefined && { favicon_url: payload.faviconUrl }),
            ...(payload.logoShape !== undefined && { logo_shape: payload.logoShape }),
            ...(payload.coverEnabled !== undefined && { cover_enabled: payload.coverEnabled }),
            ...(payload.descEnabled !== undefined && { desc_enabled: payload.descEnabled }),
            ...(payload.storeDescription !== undefined && { store_description: payload.storeDescription }),
            ...(payload.bgType !== undefined && { bg_type: payload.bgType }),
            ...(payload.cartEnabled !== undefined && { cart_enabled: payload.cartEnabled }),
            ...(payload.selectedTemplate !== undefined && { selected_template: payload.selectedTemplate }),
            ...(payload.colorType !== undefined && { color_type: payload.colorType }),
            ...(payload.primaryBg !== undefined && { primary_bg: payload.primaryBg }),
            ...(payload.primaryText !== undefined && { primary_text: payload.primaryText }),
            ...(payload.secondaryBg !== undefined && { secondary_bg: payload.secondaryBg }),
            ...(payload.secondaryText !== undefined && { secondary_text: payload.secondaryText }),
        };

        await saveStoredMetadata(adminClient, updatedMeta);

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if ('metadata' in store) {
            updateData.metadata = updatedMeta;
        }

        if (payload.storeName) {
            updateData.name = payload.storeName;
        }

        if (payload.whatsappPhone !== undefined) {
            updateData.whatsapp_phone = payload.whatsappPhone;
        }

        if (payload.supportEmail !== undefined) {
            updateData.email = payload.supportEmail;
        }

        if (payload.storePhone !== undefined) {
            updateData.phone = payload.storePhone;
        }

        if (payload.logoUrl !== undefined) {
            updateData.logo_url = payload.logoUrl;
        }

        if (payload.storeDescription !== undefined) {
            updateData.description = payload.storeDescription;
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
