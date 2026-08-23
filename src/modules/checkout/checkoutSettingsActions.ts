'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/money';

export interface PaymentMethodConfig {
    id: string;
    name: string;
    is_active: boolean;
    type: string;
    number?: string;
    holder?: string;
    qr_url?: string;
    instructions?: string;
    banks?: { bank: string; account: string; cci?: string; holder: string }[];
    allowed_shipping_methods?: string[];
}

export interface ShippingMethodConfig {
    id: string;
    name: string;
    is_active: boolean;
    price_amount: number; // in cents
    price_formatted?: string;
    estimated_days?: string;
    requires_address: boolean;
    address_details?: string;
}

export interface CheckoutSettings {
    storeName: string;
    currency: string;
    require_email: boolean;
    require_age_confirmation: boolean;
    payment_methods: PaymentMethodConfig[];
    shipping_methods: ShippingMethodConfig[];
}

export interface CustomerAddress {
    id: string;
    label: string;
    recipient_name: string;
    phone?: string;
    department?: string;
    province?: string;
    district?: string;
    address_line: string;
    reference?: string;
    postal_code?: string;
}

export async function getCheckoutSettingsAction(): Promise<{ success: boolean; settings?: CheckoutSettings; error?: string }> {
    try {
        const adminClient = createAdminClient();
        const { data: store, error } = await adminClient
            .from('stores')
            .select('name, currency, metadata')
            .eq('slug', 'codemarket')
            .single();

        if (error || !store) {
            return { success: false, error: 'No se pudo obtener la configuración de la tienda.' };
        }

        const meta = store.metadata || {};
        const currency = store.currency || 'PEN';

        const defaultPaymentMethods: PaymentMethodConfig[] = [
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
                allowed_shipping_methods: ['delivery_local'],
                instructions: 'Disponible únicamente para Delivery Local en Lima Metropolitana. Puedes pagar en efectivo o con tarjeta al recibir tu pedido.'
            }
        ];

        const defaultShippingMethods: ShippingMethodConfig[] = [
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

        const rawPayments: PaymentMethodConfig[] = meta.payment_methods || defaultPaymentMethods;
        const rawShipping: ShippingMethodConfig[] = meta.shipping_methods || defaultShippingMethods;

        const activePayments = rawPayments.filter(p => p.is_active);
        const activeShipping = rawShipping
            .filter(s => s.is_active)
            .map(s => ({
                ...s,
                price_formatted: formatMoney(s.price_amount / 100, currency)
            }));

        return {
            success: true,
            settings: {
                storeName: store.name || 'CodeMarket',
                currency,
                require_email: meta.require_email !== false,
                require_age_confirmation: Boolean(meta.require_age_confirmation),
                payment_methods: activePayments,
                shipping_methods: activeShipping
            }
        };
    } catch (err) {
        return { success: false, error: 'Error al consultar configuraciones.' };
    }
}

export async function getOrderByTokenAction(token: string) {
    try {
        if (!token) return { success: false, error: 'Token no válido.' };

        const adminClient = createAdminClient();
        const { data: order, error } = await adminClient
            .from('orders')
            .select(`
                *,
                order_items (*)
            `)
            .eq('access_token', token)
            .single();

        if (error || !order) {
            return { success: false, error: 'Pedido no encontrado.' };
        }

        const { data: store } = await adminClient
            .from('stores')
            .select('name, metadata, whatsapp_phone')
            .eq('id', order.store_id)
            .single();

        const meta = store?.metadata || {};
        const paymentMethods: PaymentMethodConfig[] = meta.payment_methods || [];
        const selectedMethodConfig = paymentMethods.find(p => p.id === order.payment_method);

        return {
            success: true,
            order: {
                ...order,
                subtotal_formatted: formatMoney(order.subtotal_amount / 100, order.currency),
                shipping_formatted: formatMoney(order.shipping_amount / 100, order.currency),
                discount_formatted: formatMoney(order.discount_amount / 100, order.currency),
                total_formatted: formatMoney(order.total_amount / 100, order.currency),
            },
            methodConfig: selectedMethodConfig || null,
            whatsappPhone: store?.whatsapp_phone || '+51900000000'
        };
    } catch {
        return { success: false, error: 'Error al buscar la orden.' };
    }
}

export async function uploadPaymentReceiptAction(orderToken: string, formData: FormData) {
    try {
        const file = formData.get('receipt_file') as File | null;
        if (!file) {
            return { success: false, error: 'Debes seleccionar un archivo de comprobante.' };
        }

        // Validate file size (max 8MB)
        if (file.size > 8 * 1024 * 1024) {
            return { success: false, error: 'El archivo no debe superar los 8MB.' };
        }

        const adminClient = createAdminClient();
        
        // Find order
        const { data: order, error: findErr } = await adminClient
            .from('orders')
            .select('id, order_number, store_id')
            .eq('access_token', orderToken)
            .single();

        if (findErr || !order) {
            return { success: false, error: 'No se encontró la orden especificada.' };
        }

        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `${order.order_number}-${Date.now()}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadErr } = await adminClient.storage
            .from('payment-receipts')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (uploadErr) {
            console.error('Storage upload error:', uploadErr);
            return { success: false, error: 'Error al guardar el archivo en almacenamiento.' };
        }

        const { data: publicUrlData } = adminClient.storage
            .from('payment-receipts')
            .getPublicUrl(filePath);

        const receiptUrl = publicUrlData?.publicUrl || filePath;

        // Update order status
        await adminClient
            .from('orders')
            .update({
                payment_receipt_url: receiptUrl,
                receipt_uploaded_at: new Date().toISOString(),
                payment_status: 'under_review'
            })
            .eq('id', order.id);

        // Record timeline event
        await adminClient.from('order_events').insert({
            store_id: order.store_id,
            order_id: order.id,
            event_type: 'receipt_uploaded',
            description: `El cliente adjuntó el comprobante de pago (${file.name}). En revisión administrativa.`,
            created_by: 'Cliente (Público)'
        });

        return {
            success: true,
            receiptUrl,
            message: '¡Comprobante subido con éxito! Tu pago está siendo revisado.'
        };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al procesar la subida.';
        return { success: false, error: msg };
    }
}
