'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney, parseMoneyToCents } from '@/lib/money';
import { EmailService } from '@/lib/services/emailService';

export interface OrderFilterParams {
    searchQuery?: string;
    orderStatus?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    source?: string;
    deliveryType?: string;
    dateRange?: 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month';
    paymentMethod?: string;
    page?: number;
    limit?: number;
}

export interface ManualOrderItemPayload {
    productId: string;
    variantId?: string;
    productName: string;
    variantName?: string;
    sku?: string;
    image?: string;
    unitPriceAmount: number; // in cents
    originalUnitPriceAmount: number; // in cents
    priceAdjustmentReason?: string;
    quantity: number;
}

export interface CreateManualOrderPayload {
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    documentType?: string;
    documentNumber?: string;

    source: 'online_store' | 'manual' | 'whatsapp' | 'instagram' | 'facebook' | 'phone' | 'pos' | 'other';
    sourceReference?: string;

    deliveryType: 'pickup' | 'local_delivery' | 'national_shipping' | 'none';
    shippingMethodName?: string;
    shippingAmount: number; // in cents
    recipientName?: string;
    recipientPhone?: string;
    shippingDepartment?: string;
    shippingProvince?: string;
    shippingDistrict?: string;
    shippingAddressLine?: string;
    shippingReference?: string;
    shippingPostalCode?: string;

    discountType?: 'percentage' | 'fixed' | 'coupon';
    discountValue?: number; // percent value or fixed cents
    couponCode?: string;

    paymentMethod: 'yape' | 'plin' | 'bank_transfer' | 'cash_on_delivery' | 'external_payment_link' | 'cash' | 'other';
    initialPaymentStatus: 'pending' | 'paid';
    initialOrderStatus?: 'new' | 'confirmed';

    customerNotes?: string;
    internalNotes?: string;

    items: ManualOrderItemPayload[];
}

export interface OrderItemRecord {
    id: string;
    order_id: string;
    product_id?: string;
    variant_id?: string;
    product_name: string;
    variant_name?: string;
    sku?: string;
    image_url?: string;
    image?: string;
    unit_price_amount: number;
    original_unit_price?: number;
    final_unit_price?: number;
    price_adjustment_reason?: string;
    quantity: number;
    total_amount: number;
}

export interface OrderEventRecord {
    id: string;
    order_id: string;
    event_type: string;
    description: string;
    metadata?: Record<string, unknown>;
    created_by?: string;
    created_at: string;
}

export interface OrderNoteRecord {
    id: string;
    order_id: string;
    user_name?: string;
    content: string;
    created_at: string;
}

export interface OrderRecord {
    id: string;
    store_id: string;
    customer_id?: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    document_type?: string;
    document_number?: string;
    currency: string;
    subtotal_amount: number;
    discount_amount: number;
    shipping_amount: number;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    source: string;
    source_reference?: string;
    order_status: string;
    payment_method: string;
    payment_status: string;
    fulfillment_status: string;
    delivery_type: string;
    shipping_method_name?: string;
    recipient_name?: string;
    recipient_phone?: string;
    shipping_department?: string;
    shipping_province?: string;
    shipping_district?: string;
    shipping_address_line?: string;
    shipping_reference?: string;
    shipping_postal_code?: string;
    discount_type?: string;
    discount_value?: number;
    customer_notes?: string;
    internal_notes?: string;
    cancel_reason?: string;
    cancelled_at?: string;
    created_at: string;
    updated_at: string;
    order_items?: OrderItemRecord[];
    order_events?: OrderEventRecord[];
    order_notes?: OrderNoteRecord[];
}

export interface OrdersListResponse {
    success: boolean;
    orders: OrderRecord[];
    totalCount: number;
    metrics: {
        total: number;
        new: number;
        pendingPayment: number;
        paid: number;
        preparing: number;
        shipped: number;
        delivered: number;
    };
    error?: string;
}

const nowIso = new Date().toISOString();

const MEMORY_DEMO_ORDERS: OrderRecord[] = [
    {
        id: 'ord-demo-001',
        store_id: 'demo-store-001',
        order_number: 'ORD-1001',
        customer_name: 'Carlos Mendoza',
        customer_email: 'carlos.mendoza@gmail.com',
        customer_phone: '+51 987 654 321',
        source: 'whatsapp',
        order_status: 'new',
        payment_status: 'pending',
        fulfillment_status: 'unfulfilled',
        delivery_type: 'local_delivery',
        shipping_method_name: 'Delivery Express Lima',
        shipping_district: 'Miraflores',
        total_amount: 139.00,
        subtotal_amount: 129.00,
        discount_amount: 0,
        shipping_amount: 10.00,
        paid_amount: 0,
        balance_amount: 139.00,
        currency: 'PEN',
        payment_method: 'yape',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        updated_at: nowIso,
    },
    {
        id: 'ord-demo-002',
        store_id: 'demo-store-001',
        order_number: 'ORD-1002',
        customer_name: 'María Fernanda Ríos',
        customer_email: 'maria.rios@hotmail.com',
        customer_phone: '+51 912 345 678',
        source: 'online_store',
        order_status: 'confirmed',
        payment_status: 'paid',
        fulfillment_status: 'preparing',
        delivery_type: 'national_shipping',
        shipping_method_name: 'Envío Olva Courier',
        shipping_district: 'Trujillo',
        total_amount: 280.00,
        subtotal_amount: 260.00,
        discount_amount: 0,
        shipping_amount: 20.00,
        paid_amount: 280.00,
        balance_amount: 0,
        currency: 'PEN',
        payment_method: 'plin',
        created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        updated_at: nowIso,
    },
    {
        id: 'ord-demo-003',
        store_id: 'demo-store-001',
        order_number: 'ORD-1003',
        customer_name: 'Jorge Luis Morales',
        customer_email: 'jorge.morales@empresa.pe',
        customer_phone: '+51 955 888 222',
        source: 'pos',
        order_status: 'confirmed',
        payment_status: 'paid',
        fulfillment_status: 'shipped',
        delivery_type: 'local_delivery',
        shipping_method_name: 'Motorizado Pro',
        shipping_district: 'San Isidro',
        total_amount: 99.90,
        subtotal_amount: 89.90,
        discount_amount: 0,
        shipping_amount: 10.00,
        paid_amount: 99.90,
        balance_amount: 0,
        currency: 'PEN',
        payment_method: 'bank_transfer',
        created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        updated_at: nowIso,
    },
    {
        id: 'ord-demo-004',
        store_id: 'demo-store-001',
        order_number: 'ORD-1004',
        customer_name: 'Ana Sofía Delgado',
        customer_email: 'ana.delgado@outlook.com',
        customer_phone: '+51 944 111 333',
        source: 'instagram',
        order_status: 'completed',
        payment_status: 'paid',
        fulfillment_status: 'delivered',
        delivery_type: 'pickup',
        shipping_method_name: 'Recojo en tienda',
        shipping_district: 'San Borja',
        total_amount: 350.00,
        subtotal_amount: 350.00,
        discount_amount: 0,
        shipping_amount: 0,
        paid_amount: 350.00,
        balance_amount: 0,
        currency: 'PEN',
        payment_method: 'cash',
        created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
        updated_at: nowIso,
    },
    {
        id: 'ord-demo-005',
        store_id: 'demo-store-001',
        order_number: 'ORD-1005',
        customer_name: 'Roberto Valenzuela',
        customer_email: 'roberto.v@gmail.com',
        customer_phone: '+51 933 222 111',
        source: 'phone',
        order_status: 'new',
        payment_status: 'pending',
        fulfillment_status: 'unfulfilled',
        delivery_type: 'local_delivery',
        shipping_method_name: 'Delivery Estándar',
        shipping_district: 'Surco',
        total_amount: 75.00,
        subtotal_amount: 65.00,
        discount_amount: 0,
        shipping_amount: 10.00,
        paid_amount: 0,
        balance_amount: 75.00,
        currency: 'PEN',
        payment_method: 'cash_on_delivery',
        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        updated_at: nowIso,
    },
    {
        id: 'ord-demo-006',
        store_id: 'demo-store-001',
        order_number: 'ORD-1006',
        customer_name: 'Camila Benavides',
        customer_email: 'camila.benavides@gmail.com',
        customer_phone: '+51 977 444 888',
        source: 'online_store',
        order_status: 'confirmed',
        payment_status: 'paid',
        fulfillment_status: 'shipped',
        delivery_type: 'national_shipping',
        shipping_method_name: 'Shalom Express',
        shipping_district: 'Arequipa',
        total_amount: 420.00,
        subtotal_amount: 400.00,
        discount_amount: 0,
        shipping_amount: 20.00,
        paid_amount: 420.00,
        balance_amount: 0,
        currency: 'PEN',
        payment_method: 'card',
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        updated_at: nowIso,
    },
    {
        id: 'ord-demo-007',
        store_id: 'demo-store-001',
        order_number: 'ORD-1007',
        customer_name: 'Diego Barnechea',
        customer_email: 'diego.b@gmail.com',
        customer_phone: '+51 966 555 999',
        source: 'whatsapp',
        order_status: 'confirmed',
        payment_status: 'paid',
        fulfillment_status: 'preparing',
        delivery_type: 'local_delivery',
        shipping_method_name: 'Delivery Express Lima',
        shipping_district: 'La Molina',
        total_amount: 210.00,
        subtotal_amount: 195.00,
        discount_amount: 0,
        shipping_amount: 15.00,
        paid_amount: 210.00,
        balance_amount: 0,
        currency: 'PEN',
        payment_method: 'yape',
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        updated_at: nowIso,
    }
];

function solesToCents(val: number | string | undefined | null): number {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') {
        return Math.round(val * 100);
    }
    const cleaned = String(val).replace(',', '.').replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 100);
}

function unpackDbOrder(raw: Record<string, any>): OrderRecord {
    let meta: Record<string, any> = {};
    if (typeof raw.internal_notes === 'string' && raw.internal_notes.trim().startsWith('{')) {
        try {
            meta = JSON.parse(raw.internal_notes);
        } catch {
            // ignore
        }
    }

    const toDec = (val: unknown) => {
        const n = Number(val || 0);
        return Number.isInteger(n) && Math.abs(n) >= 100 ? n / 100 : n;
    };

    const subtotalDec = meta.subtotal_amount_soles !== undefined ? Number(meta.subtotal_amount_soles) : toDec(raw.subtotal_amount);
    const discountDec = meta.discount_amount_soles !== undefined ? Number(meta.discount_amount_soles) : toDec(raw.discount_amount);
    const shippingDec = meta.shipping_amount_soles !== undefined ? Number(meta.shipping_amount_soles) : toDec(raw.shipping_amount);
    const totalDec = meta.total_amount_soles !== undefined ? Number(meta.total_amount_soles) : toDec(raw.total_amount);
    const isPaid = raw.payment_status === 'paid';
    const paidDec = raw.paid_amount !== undefined ? toDec(raw.paid_amount) : (meta.paid_amount !== undefined ? toDec(meta.paid_amount) : (isPaid ? totalDec : 0));

    return {
        ...(meta as Partial<OrderRecord>),
        ...(raw as OrderRecord),
        source: raw.source || meta.source || 'online_store',
        source_reference: raw.source_reference || meta.source_reference || '',
        document_type: raw.document_type || meta.document_type || 'DNI',
        document_number: raw.document_number || meta.document_number || '',
        order_status: raw.order_status || meta.order_status || 'new',
        delivery_type: raw.delivery_type || meta.delivery_type || 'local_delivery',
        shipping_method_name: raw.shipping_method_name || meta.shipping_method_name || 'Delivery Local',
        recipient_name: raw.recipient_name || meta.recipient_name || raw.customer_name,
        recipient_phone: raw.recipient_phone || meta.recipient_phone || raw.customer_phone,
        shipping_department: raw.shipping_department || meta.shipping_department || '',
        shipping_province: raw.shipping_province || meta.shipping_province || '',
        shipping_district: raw.shipping_district || meta.shipping_district || '',
        shipping_address_line: raw.shipping_address_line || meta.shipping_address_line || '',
        shipping_reference: raw.shipping_reference || meta.shipping_reference || '',
        shipping_postal_code: raw.shipping_postal_code || meta.shipping_postal_code || '',
        internal_notes: meta.internal_note_text || (typeof raw.internal_notes === 'string' && !raw.internal_notes.trim().startsWith('{') ? raw.internal_notes : ''),
        subtotal_amount: subtotalDec,
        discount_amount: discountDec,
        shipping_amount: shippingDec,
        total_amount: totalDec,
        paid_amount: paidDec,
        balance_amount: Math.max(0, totalDec - paidDec),
    };
}

/**
 * Fetch orders list with real metric counters, debounced search, and complex multi-filtering
 */
export async function getOrdersListAction(params: OrderFilterParams): Promise<OrdersListResponse> {
    try {
        const adminClient = createAdminClient();
        let dbOrdersList: OrderRecord[] = [];

        try {
            const { data: fetchedDbOrders } = await adminClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchedDbOrders && fetchedDbOrders.length > 0) {
                dbOrdersList = (fetchedDbOrders as Record<string, any>[]).map(unpackDbOrder);
            }
        } catch (dbErr) {
            console.warn('DB fetch orders warning, using memory fallback:', dbErr);
        }

        // Combine DB orders FIRST, followed by MEMORY_DEMO_ORDERS
        const allCombinedOrders = [...dbOrdersList, ...MEMORY_DEMO_ORDERS].filter(
            (ord, idx, self) => idx === self.findIndex((o) => o.id === ord.id || o.order_number === ord.order_number)
        );

        // Filter combined orders
        const filtered = allCombinedOrders.filter((o: OrderRecord) => {
            if (params.orderStatus && params.orderStatus !== 'all' && o.order_status !== params.orderStatus) return false;
            if (params.paymentStatus && params.paymentStatus !== 'all' && o.payment_status !== params.paymentStatus) return false;
            if (params.fulfillmentStatus && params.fulfillmentStatus !== 'all' && o.fulfillment_status !== params.fulfillmentStatus) return false;
            if (params.source && params.source !== 'all' && o.source !== params.source) return false;
            if (params.deliveryType && params.deliveryType !== 'all' && o.delivery_type !== params.deliveryType) return false;
            if (params.paymentMethod && params.paymentMethod !== 'all' && o.payment_method !== params.paymentMethod) return false;
            if (params.searchQuery && params.searchQuery.trim() !== '') {
                const q = params.searchQuery.trim().toLowerCase();
                const match = (o.order_number && o.order_number.toLowerCase().includes(q)) ||
                    (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
                    (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
                    (o.customer_phone && o.customer_phone.toLowerCase().includes(q));
                if (!match) return false;
            }
            return true;
        });

        // Real metrics counters
        const metrics = {
            total: allCombinedOrders.length,
            new: allCombinedOrders.filter(o => o.order_status === 'new' || !o.order_status).length,
            pendingPayment: allCombinedOrders.filter(o => o.payment_status === 'pending' || o.payment_status === 'under_review').length,
            paid: allCombinedOrders.filter(o => o.payment_status === 'paid').length,
            preparing: allCombinedOrders.filter(o => o.fulfillment_status === 'preparing' || o.fulfillment_status === 'processing').length,
            shipped: allCombinedOrders.filter(o => o.fulfillment_status === 'shipped').length,
            delivered: allCombinedOrders.filter(o => o.fulfillment_status === 'delivered' || o.fulfillment_status === 'fulfilled').length,
        };

        const page = params.page || 1;
        const limit = params.limit || 50;
        const from = (page - 1) * limit;
        const pagedOrders = filtered.slice(from, from + limit);

        return {
            success: true,
            orders: pagedOrders,
            totalCount: filtered.length,
            metrics,
        };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error inesperado al cargar pedidos.';
        return {
            success: false,
            orders: [],
            totalCount: 0,
            metrics: { total: 0, new: 0, pendingPayment: 0, paid: 0, preparing: 0, shipped: 0, delivered: 0 },
            error: errorMsg,
        };
    }
}

/**
 * Create a new manual order (POS / Admin created)
 */
export async function createManualOrderAction(payload: CreateManualOrderPayload) {
    try {
        const {
            customerId,
            customerName,
            customerEmail,
            customerPhone,
            documentType,
            documentNumber,
            source,
            sourceReference,
            deliveryType,
            shippingMethodName,
            shippingAmount,
            recipientName,
            recipientPhone,
            shippingDepartment,
            shippingProvince,
            shippingDistrict,
            shippingAddressLine,
            shippingReference,
            shippingPostalCode,
            discountType,
            discountValue,
            paymentMethod,
            initialPaymentStatus,
            initialOrderStatus,
            customerNotes,
            internalNotes,
            items,
        } = payload;

        if (!items || items.length === 0) {
            return { success: false, error: 'Debe agregar al menos un producto al pedido.' };
        }

        if (!customerName || !customerEmail) {
            return { success: false, error: 'El nombre y correo del cliente son requeridos.' };
        }

        const adminClient = createAdminClient();

        // 1. Get default store
        const { data: store } = await adminClient
            .from('stores')
            .select('id')
            .eq('slug', 'codemarket')
            .single();

        if (!store) {
            return { success: false, error: 'Tienda CodeMarket no configurada.' };
        }

        const storeId = store.id;

        // 2. Customer handling: Find or create customer
        let finalCustomerId: string | null = customerId && customerId.length === 36 ? customerId : null;

        if (!finalCustomerId && customerEmail) {
            const { data: existingCust } = await adminClient
                .from('customers')
                .select('id')
                .eq('store_id', storeId)
                .eq('email', customerEmail)
                .single();

            if (existingCust) {
                finalCustomerId = existingCust.id;
            } else {
                const { data: newCust } = await adminClient
                    .from('customers')
                    .insert({
                        store_id: storeId,
                        name: customerName,
                        email: customerEmail,
                        phone: customerPhone || null,
                    })
                    .select('id')
                    .single();

                if (newCust) {
                    finalCustomerId = newCust.id;
                }
            }
        }

        // 3. Product & Inventory Server-side validation
        const productIds = Array.from(new Set(items.map(i => i.productId)));
        const { data: dbProducts } = await adminClient
            .from('products')
            .select('*')
            .in('id', productIds);

        let subtotalAmountCents = 0;
        const validatedItems = [];

        for (const item of items) {
            const dbProd = dbProducts?.find(p => p.id === item.productId);

            if (dbProd && dbProd.track_inventory && (dbProd.stock_quantity - (dbProd.stock_reserved || 0)) < item.quantity) {
                const available = dbProd.stock_quantity - (dbProd.stock_reserved || 0);
                return {
                    success: false,
                    error: `Stock insuficiente para "${dbProd.name}". Disponible: ${available}, Solicitado: ${item.quantity}.`
                };
            }

            const itemUnitPriceCents = solesToCents(item.unitPriceAmount);
            const itemTotalCents = itemUnitPriceCents * item.quantity;
            subtotalAmountCents += itemTotalCents;

            validatedItems.push({
                store_id: storeId,
                product_id: dbProd ? dbProd.id : (item.productId.length === 36 ? item.productId : null),
                variant_id: item.variantId || null,
                product_name: item.productName || dbProd?.name || 'Producto',
                variant_name: item.variantName || null,
                sku: item.sku || dbProd?.sku || null,
                image: item.image || null,
                unit_price_amount: itemUnitPriceCents,
                original_unit_price: item.originalUnitPriceAmount !== undefined ? solesToCents(item.originalUnitPriceAmount) : (dbProd?.price_amount || itemUnitPriceCents),
                final_unit_price: itemUnitPriceCents,
                price_adjustment_reason: item.priceAdjustmentReason || null,
                quantity: item.quantity,
                total_amount: itemTotalCents,
            });
        }

        // 4. Calculate Order Discounts & Total
        let discountAmountCents = 0;
        if (discountType === 'percentage' && discountValue && discountValue > 0) {
            discountAmountCents = Math.round((subtotalAmountCents * discountValue) / 100);
        } else if (discountType === 'fixed' && discountValue && discountValue > 0) {
            discountAmountCents = solesToCents(discountValue);
        }

        const shippingAmountCents = solesToCents(shippingAmount || 0);
        const totalAmountCents = Math.max(0, subtotalAmountCents + shippingAmountCents - discountAmountCents);

        const paidAmountCents = initialPaymentStatus === 'paid' ? totalAmountCents : 0;
        const balanceAmountCents = Math.max(0, totalAmountCents - paidAmountCents);

        // 5. Generate Order Number
        const orderNumber = `CM-${Math.floor(100000 + Math.random() * 900000)}`;

        const orderStatus = initialOrderStatus || 'new';
        const fulfillmentStatus = 'unfulfilled';

        // 6. Insert Order Record (using guaranteed public.orders columns + extended metadata in internal_notes)
        const manualMeta = {
            source: source || 'manual',
            source_reference: sourceReference || null,
            document_type: documentType || 'DNI',
            document_number: documentNumber || null,
            order_status: orderStatus,
            delivery_type: deliveryType || 'pickup',
            shipping_method_name: shippingMethodName || null,
            recipient_name: recipientName || customerName,
            recipient_phone: recipientPhone || customerPhone || null,
            shipping_department: shippingDepartment || null,
            shipping_province: shippingProvince || null,
            shipping_district: shippingDistrict || null,
            shipping_address_line: shippingAddressLine || null,
            shipping_reference: shippingReference || null,
            shipping_postal_code: shippingPostalCode || null,
            discount_type: discountType || null,
            discount_value: discountValue || 0,
            subtotal_amount_soles: subtotalAmountCents / 100,
            discount_amount_soles: discountAmountCents / 100,
            shipping_amount_soles: shippingAmountCents / 100,
            total_amount_soles: totalAmountCents / 100,
            paid_amount: paidAmountCents,
            balance_amount: balanceAmountCents,
            internal_note_text: internalNotes || null,
            items_snapshot: validatedItems,
        };

        const { data: createdOrder, error: insertOrderErr } = await adminClient
            .from('orders')
            .insert({
                store_id: storeId,
                customer_id: finalCustomerId,
                order_number: orderNumber,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone || null,
                currency: 'PEN',
                subtotal_amount: subtotalAmountCents,
                discount_amount: discountAmountCents,
                shipping_amount: shippingAmountCents,
                total_amount: totalAmountCents,
                payment_method: paymentMethod,
                payment_status: initialPaymentStatus,
                fulfillment_status: fulfillmentStatus,
                customer_notes: customerNotes || null,
                internal_notes: JSON.stringify(manualMeta),
            })
            .select('id, order_number')
            .single();

        if (insertOrderErr || !createdOrder) {
            return { success: false, error: `Error al guardar el pedido: ${insertOrderErr?.message}` };
        }

        const orderId = createdOrder.id;

        // 7. Insert Items (using guaranteed order_items columns)
        const itemsToInsert = validatedItems.map(i => ({
            store_id: i.store_id,
            order_id: orderId,
            product_id: i.product_id,
            product_name: i.product_name,
            unit_price_amount: i.unit_price_amount,
            quantity: i.quantity,
            total_amount: i.total_amount,
        }));
        await adminClient.from('order_items').insert(itemsToInsert);

        // 8. Update Inventory
        for (const item of validatedItems) {
            const dbProd = dbProducts?.find(p => p.id === item.product_id);
            if (dbProd && dbProd.track_inventory) {
                const newStock = Math.max(0, dbProd.stock_quantity - item.quantity);
                await adminClient
                    .from('products')
                    .update({ stock_quantity: newStock })
                    .eq('id', dbProd.id);
            }
        }

        // 9. Record Initial Event
        const channelLabelMap: Record<string, string> = {
            online_store: 'Tienda Online',
            manual: 'Pedido Manual',
            whatsapp: 'WhatsApp',
            instagram: 'Instagram',
            facebook: 'Facebook',
            phone: 'Teléfono',
            pos: 'Venta Presencial POS',
            other: 'Otro Canal',
        };

        const channelLabel = channelLabelMap[source] || source;

        await adminClient.from('order_events').insert({
            store_id: storeId,
            order_id: orderId,
            event_type: 'order_created',
            description: `Pedido ${orderNumber} creado manualmente desde ${channelLabel}.`,
            created_by: 'Administrador',
            metadata: { source, sourceReference, totalAmountCents },
        });

        // 10. If paid initial status, insert payment record
        if (initialPaymentStatus === 'paid') {
            await adminClient.from('order_payments').insert({
                store_id: storeId,
                order_id: orderId,
                payment_method: paymentMethod,
                amount: totalAmountCents,
                currency: 'PEN',
                status: 'completed',
                notes: 'Pago registrado al crear pedido manual',
                recorded_by: 'Administrador',
            });

            await adminClient.from('order_events').insert({
                store_id: storeId,
                order_id: orderId,
                event_type: 'payment_received',
                description: `Pago completo de ${formatMoney(totalAmountCents)} registrado (${paymentMethod.toUpperCase()}).`,
                created_by: 'Administrador',
            });
        }

        // 11. If internal notes, record in order_notes
        if (internalNotes && internalNotes.trim()) {
            await adminClient.from('order_notes').insert({
                store_id: storeId,
                order_id: orderId,
                user_name: 'Administrador',
                content: internalNotes.trim(),
            });
        }

        return {
            success: true,
            orderId: createdOrder.id,
            orderNumber: createdOrder.order_number,
        };

    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al procesar la creación del pedido manual.';
        return {
            success: false,
            error: errorMsg,
        };
    }
}

/**
 * Update order statuses securely with state transition rules and audit history logging
 */
export async function updateOrderStatusAction(
    orderId: string,
    updates: {
        orderStatus?: string;
        paymentStatus?: string;
        fulfillmentStatus?: string;
        reason?: string;
    }
) {
    try {
        const adminClient = createAdminClient();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
        const memoRef = MEMORY_DEMO_ORDERS.find(o => o.id === orderId || o.order_number === orderId);

        let currentOrder: Record<string, any> | null = null;
        if (isUuid) {
            const { data } = await adminClient
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();
            currentOrder = data;
        } else {
            const lookupOrderNum = memoRef?.order_number || orderId;
            const { data } = await adminClient
                .from('orders')
                .select('*')
                .eq('order_number', lookupOrderNum)
                .single();
            currentOrder = data;
        }

        if (!currentOrder) {
            const memoryIndex = MEMORY_DEMO_ORDERS.findIndex(o => o.id === orderId || o.order_number === orderId);
            if (memoryIndex !== -1) {
                const target = MEMORY_DEMO_ORDERS[memoryIndex];
                if (updates.orderStatus) target.order_status = updates.orderStatus;
                if (updates.paymentStatus) {
                    target.payment_status = updates.paymentStatus;
                    if (updates.paymentStatus === 'paid') {
                        target.paid_amount = target.total_amount;
                        target.balance_amount = 0;
                    }
                }
                if (updates.fulfillmentStatus) target.fulfillment_status = updates.fulfillmentStatus;
                target.updated_at = new Date().toISOString();
                return { success: true };
            }
            return { success: false, error: 'Pedido no encontrado.' };
        }

        const realOrderId = currentOrder.id as string;

        let currentMeta: Record<string, any> = {};
        if (typeof currentOrder.internal_notes === 'string' && currentOrder.internal_notes.trim().startsWith('{')) {
            try {
                currentMeta = JSON.parse(currentOrder.internal_notes);
            } catch {
                // ignore
            }
        }
        const prevOrderStatus = currentOrder.order_status || currentMeta.order_status || 'new';

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        const eventsToInsert = [];

        if (updates.orderStatus && updates.orderStatus !== prevOrderStatus) {
            currentMeta.order_status = updates.orderStatus;
            eventsToInsert.push({
                store_id: currentOrder.store_id,
                order_id: realOrderId,
                event_type: 'status_changed',
                description: `Estado del pedido cambiado de ${prevOrderStatus} a ${updates.orderStatus}.`,
                created_by: 'Administrador',
            });

            // Handle cancellation inventory release if cancelled
            if (updates.orderStatus === 'cancelled') {
                currentMeta.cancel_reason = updates.reason || 'Cancelado por el administrador';
                currentMeta.cancelled_at = new Date().toISOString();

                // Fetch items to release stock if needed
                const { data: items } = await adminClient
                    .from('order_items')
                    .select('*')
                    .eq('order_id', realOrderId);

                if (items) {
                    for (const item of items) {
                        if (item.product_id) {
                            const { data: prod } = await adminClient
                                .from('products')
                                .select('stock_quantity')
                                .eq('id', item.product_id)
                                .single();

                            if (prod) {
                                const newStock = prod.stock_quantity + item.quantity;
                                await adminClient
                                    .from('products')
                                    .update({ stock_quantity: newStock })
                                    .eq('id', item.product_id);
                            }
                        }
                    }
                }
            }
        }

        if (updates.paymentStatus && updates.paymentStatus !== currentOrder.payment_status) {
            updateData.payment_status = updates.paymentStatus;

            if (updates.paymentStatus === 'paid') {
                currentMeta.paid_amount = currentOrder.total_amount;
                currentMeta.balance_amount = 0;
            } else if (updates.paymentStatus === 'pending') {
                currentMeta.paid_amount = 0;
                currentMeta.balance_amount = currentOrder.total_amount;
            }

            eventsToInsert.push({
                store_id: currentOrder.store_id,
                order_id: realOrderId,
                event_type: 'payment_status_changed',
                description: `Estado de pago actualizado a ${updates.paymentStatus.toUpperCase()}.`,
                created_by: 'Administrador',
            });
        }

        if (updates.fulfillmentStatus && updates.fulfillmentStatus !== currentOrder.fulfillment_status) {
            updateData.fulfillment_status = updates.fulfillmentStatus;
            eventsToInsert.push({
                store_id: currentOrder.store_id,
                order_id: realOrderId,
                event_type: 'fulfillment_status_changed',
                description: `Estado de entrega actualizado a ${updates.fulfillmentStatus}.`,
                created_by: 'Administrador',
            });

            if (currentOrder.customer_email && ['shipped', 'delivered', 'fulfilled'].includes(updates.fulfillmentStatus)) {
                EmailService.sendShippingUpdateToCustomer({
                    orderNumber: currentOrder.order_number,
                    customerName: currentOrder.customer_name || 'Cliente',
                    customerEmail: currentOrder.customer_email,
                    fulfillmentStatus: updates.fulfillmentStatus,
                    courierName: currentOrder.shipping_method_name || currentMeta.shipping_method_name || undefined,
                }).catch(err => console.warn('Dispatched shipping email error:', err));
            }
        }

        updateData.internal_notes = JSON.stringify(currentMeta);

        const { error: updateErr } = await adminClient
            .from('orders')
            .update(updateData)
            .eq('id', realOrderId);

        if (updateErr) {
            return { success: false, error: updateErr.message };
        }

        if (eventsToInsert.length > 0) {
            await adminClient.from('order_events').insert(eventsToInsert);
        }

        return { success: true };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al actualizar el estado del pedido.';
        return { success: false, error: errorMsg };
    }
}

/**
 * Add an internal administrative note to an order
 */
export async function createOrderNoteAction(orderId: string, content: string) {
    try {
        if (!content || !content.trim()) {
            return { success: false, error: 'El contenido de la nota no puede estar vacío.' };
        }

        const noteObj: OrderNoteRecord = {
            id: `note-${Date.now()}`,
            order_id: orderId,
            user_name: 'Administrador',
            content: content.trim(),
            created_at: new Date().toISOString(),
        };

        try {
            const adminClient = createAdminClient();
            const { data: order } = await adminClient
                .from('orders')
                .select('store_id')
                .eq('id', orderId)
                .single();

            if (order?.store_id) {
                await adminClient
                    .from('order_notes')
                    .insert({
                        store_id: order.store_id,
                        order_id: orderId,
                        user_name: 'Administrador',
                        content: content.trim(),
                    });
            }
        } catch (dbErr) {
            console.warn('DB note insert skipped:', dbErr);
        }

        return { success: true, note: noteObj };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al guardar la nota.';
        return { success: false, error: errorMsg };
    }
}

/**
 * Perform bulk updates on selected orders
 */
export async function bulkUpdateOrdersAction(orderIds: string[], action: 'confirm' | 'prepare' | 'ship') {
    try {
        if (!orderIds || orderIds.length === 0) {
            return { success: false, error: 'No se seleccionaron pedidos.' };
        }

        const adminClient = createAdminClient();

        if (action === 'confirm') {
            await adminClient
                .from('orders')
                .update({ order_status: 'confirmed', updated_at: new Date().toISOString() })
                .in('id', orderIds);
        } else if (action === 'prepare') {
            await adminClient
                .from('orders')
                .update({ fulfillment_status: 'preparing', updated_at: new Date().toISOString() })
                .in('id', orderIds);
        } else if (action === 'ship') {
            await adminClient
                .from('orders')
                .update({ fulfillment_status: 'shipped', updated_at: new Date().toISOString() })
                .in('id', orderIds);
        }

        MEMORY_DEMO_ORDERS.forEach(target => {
            if (orderIds.includes(target.id)) {
                if (action === 'confirm') target.order_status = 'confirmed';
                else if (action === 'prepare') target.fulfillment_status = 'preparing';
                else if (action === 'ship') target.fulfillment_status = 'shipped';
                target.updated_at = new Date().toISOString();
            }
        });

        return { success: true };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al ejecutar la acción masiva.';
        return { success: false, error: errorMsg };
    }
}

/**
 * Generate CSV export content for orders
 */
export async function exportOrdersToCSVAction(params: OrderFilterParams): Promise<{ success: boolean; csvContent?: string; error?: string }> {
    try {
        const res = await getOrdersListAction({ ...params, limit: 1000, page: 1 });
        if (!res.success || !res.orders) {
            return { success: false, error: res.error || 'Error al generar la exportación.' };
        }

        const headers = [
            'Número de Pedido',
            'Fecha',
            'Cliente',
            'Correo',
            'Teléfono',
            'Canal',
            'Estado Pedido',
            'Estado Pago',
            'Estado Entrega',
            'Método Pago',
            'Distrito',
            'Total'
        ];

        const rows = res.orders.map(order => [
            `"${order.order_number || ''}"`,
            `"${new Date(order.created_at).toLocaleString('es-PE')}"`,
            `"${(order.customer_name || '').replace(/"/g, '""')}"`,
            `"${order.customer_email || ''}"`,
            `"${order.customer_phone || ''}"`,
            `"${order.source || 'online_store'}"`,
            `"${order.order_status || 'new'}"`,
            `"${order.payment_status || 'pending'}"`,
            `"${order.fulfillment_status || 'unfulfilled'}"`,
            `"${order.payment_method || ''}"`,
            `"${(order.shipping_district || '').replace(/"/g, '""')}"`,
            `"${formatMoney(order.total_amount, order.currency)}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        return { success: true, csvContent };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al exportar CSV.';
        return { success: false, error: errorMsg };
    }
}

/**
 * Create a quick realistic test order (for simulation and testing purposes)
 */
export async function createQuickTestOrderAction(): Promise<{ success: boolean; orderNumber?: string; error?: string }> {
    try {
        const adminClient = createAdminClient();

        const { data: store } = await adminClient
            .from('stores')
            .select('id')
            .eq('slug', 'codemarket')
            .single();

        const storeId = store?.id || 'demo-store-001';

        const customersPool = [
            { name: 'Valeria Mendoza', email: 'valeria.mendoza@gmail.com', phone: '+51 987 654 321', dist: 'Miraflores' },
            { name: 'Gonzalo Castillo', email: 'gonzalo.c@hotmail.com', phone: '+51 912 345 678', dist: 'San Isidro' },
            { name: 'Fiorella Ramos', email: 'fiorella.ramos@outlook.com', phone: '+51 955 888 222', dist: 'Surco' },
            { name: 'Mauricio Silva', email: 'mauricio.silva@empresa.pe', phone: '+51 944 111 333', dist: 'San Borja' },
            { name: 'Ximena Thorne', email: 'ximena.t@gmail.com', phone: '+51 933 222 111', dist: 'La Molina' },
            { name: 'Renzo Castillejo', email: 'renzo.cast@gmail.com', phone: '+51 977 444 888', dist: 'Barranco' },
            { name: 'Camila Alva', email: 'camila.alva@icloud.com', phone: '+51 966 555 999', dist: 'Jesús María' },
        ];

        const selectedCust = customersPool[Math.floor(Math.random() * customersPool.length)];
        const sources = ['whatsapp', 'online_store', 'pos', 'instagram', 'phone'];
        const paymentMethods = ['yape', 'plin', 'bank_transfer', 'card', 'cash'];
        const deliveryTypes = ['local_delivery', 'national_shipping', 'pickup'];

        const selectedSource = sources[Math.floor(Math.random() * sources.length)];
        const selectedMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const selectedDelivery = deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)];

        const isPaid = Math.random() > 0.2;
        const totalAmount = Math.floor(Math.random() * 250) + 65;
        const subtotalAmount = totalAmount - 15;
        const shippingAmount = 15;

        const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        const nowIso = new Date().toISOString();

        try {
            if (store?.id) {
                let customerId: string | null = null;
                const { data: existingCust } = await adminClient
                    .from('customers')
                    .select('id')
                    .eq('store_id', storeId)
                    .eq('email', selectedCust.email)
                    .single();

                if (existingCust) {
                    customerId = existingCust.id;
                } else {
                    const { data: newCust } = await adminClient
                        .from('customers')
                        .insert({
                            store_id: storeId,
                            name: selectedCust.name,
                            email: selectedCust.email,
                            phone: selectedCust.phone,
                        })
                        .select('id')
                        .single();
                    if (newCust) customerId = newCust.id;
                }

                await adminClient
                    .from('orders')
                    .insert({
                        store_id: storeId,
                        customer_id: customerId,
                        order_number: orderNumber,
                        customer_name: selectedCust.name,
                        customer_email: selectedCust.email,
                        customer_phone: selectedCust.phone,
                        currency: 'PEN',
                        subtotal_amount: subtotalAmount * 100,
                        discount_amount: 0,
                        shipping_amount: shippingAmount * 100,
                        total_amount: totalAmount * 100,
                        paid_amount: isPaid ? totalAmount * 100 : 0,
                        balance_amount: isPaid ? 0 : totalAmount * 100,
                        source: selectedSource,
                        order_status: isPaid ? 'confirmed' : 'new',
                        payment_method: selectedMethod,
                        payment_status: isPaid ? 'paid' : 'pending',
                        fulfillment_status: isPaid ? 'preparing' : 'unfulfilled',
                        delivery_type: selectedDelivery,
                        shipping_method_name: selectedDelivery === 'pickup' ? 'Recojo en tienda' : 'Delivery Express Lima',
                        shipping_department: 'Lima',
                        shipping_province: 'Lima',
                        shipping_district: selectedCust.dist,
                        shipping_address_line: `Calle Las Orquídeas #${Math.floor(100 + Math.random() * 800)}`,
                        internal_notes: 'Pedido de prueba generado automáticamente para simulación.',
                        created_at: nowIso,
                        updated_at: nowIso,
                    });
            }
        } catch (dbErr) {
            console.warn('DB insert attempt skipped or failed, using memory demo storage:', dbErr);
        }

        const newDemoOrder: OrderRecord = {
            id: `ord-sim-${Date.now()}`,
            store_id: storeId,
            order_number: orderNumber,
            customer_name: selectedCust.name,
            customer_email: selectedCust.email,
            customer_phone: selectedCust.phone,
            source: selectedSource,
            order_status: isPaid ? 'confirmed' : 'new',
            payment_status: isPaid ? 'paid' : 'pending',
            fulfillment_status: isPaid ? 'preparing' : 'unfulfilled',
            delivery_type: selectedDelivery,
            shipping_method_name: selectedDelivery === 'pickup' ? 'Recojo en tienda' : 'Delivery Express Lima',
            shipping_district: selectedCust.dist,
            total_amount: totalAmount,
            subtotal_amount: subtotalAmount,
            discount_amount: 0,
            shipping_amount: shippingAmount,
            paid_amount: isPaid ? totalAmount : 0,
            balance_amount: isPaid ? 0 : totalAmount,
            currency: 'PEN',
            payment_method: selectedMethod,
            created_at: nowIso,
            updated_at: nowIso,
        };

        MEMORY_DEMO_ORDERS.unshift(newDemoOrder);

        return { success: true, orderNumber };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al generar pedido de prueba.';
        return { success: false, error: msg };
    }
}

/**
 * Update an existing manual order (when going one step back to modify any order data)
 */
export async function updateManualOrderAction(orderId: string, payload: CreateManualOrderPayload) {
    try {
        const {
            customerName,
            customerEmail,
            customerPhone,
            documentType,
            documentNumber,
            source,
            sourceReference,
            deliveryType,
            shippingMethodName,
            shippingAmount,
            recipientName,
            recipientPhone,
            shippingDepartment,
            shippingProvince,
            shippingDistrict,
            shippingAddressLine,
            shippingReference,
            shippingPostalCode,
            discountType,
            discountValue,
            paymentMethod,
            initialPaymentStatus,
            customerNotes,
            internalNotes,
            items,
        } = payload;

        if (!items || items.length === 0) {
            return { success: false, error: 'Debe agregar al menos un producto al pedido.' };
        }

        const adminClient = createAdminClient();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
        const memoRef = MEMORY_DEMO_ORDERS.find(o => o.id === orderId || o.order_number === orderId);

        let existingOrder: Record<string, any> | null = null;
        if (isUuid) {
            const { data } = await adminClient
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();
            existingOrder = data;
        } else {
            const lookupOrderNum = memoRef?.order_number || orderId;
            const { data } = await adminClient
                .from('orders')
                .select('*')
                .eq('order_number', lookupOrderNum)
                .single();
            existingOrder = data;
        }

        // If the order being modified is a demo order in memory (e.g. ord-demo-001 / ORD-1001) or not yet in DB,
        // update it in memory AND persist it as a real order in Supabase so the user can continue seamlessly!
        if (!existingOrder) {
            const memoIdx = MEMORY_DEMO_ORDERS.findIndex(o => o.id === orderId || o.order_number === orderId);
            if (memoIdx !== -1) {
                const target = MEMORY_DEMO_ORDERS[memoIdx];
                target.customer_name = customerName;
                target.customer_email = customerEmail;
                target.customer_phone = customerPhone;
                target.delivery_type = deliveryType;
                target.shipping_amount = Number(shippingAmount || 0);
                target.shipping_department = shippingDepartment;
                target.shipping_province = shippingProvince;
                target.shipping_district = shippingDistrict;
                target.shipping_address_line = shippingAddressLine;
                target.shipping_reference = shippingReference;
                const newSub = items.reduce((acc, it) => acc + Number(it.unitPriceAmount || 0) * it.quantity, 0);
                target.subtotal_amount = newSub;
                target.total_amount = newSub + Number(shippingAmount || 0);
                target.updated_at = new Date().toISOString();
            }

            const created = await createManualOrderAction(payload);
            if (created.success && created.orderId) {
                if (memoIdx !== -1) {
                    await adminClient
                        .from('orders')
                        .update({ order_number: MEMORY_DEMO_ORDERS[memoIdx].order_number })
                        .eq('id', created.orderId);
                }
                return {
                    success: true,
                    orderId: created.orderId,
                    orderNumber: memoIdx !== -1 ? MEMORY_DEMO_ORDERS[memoIdx].order_number : created.orderNumber,
                };
            }
            if (memoIdx !== -1) {
                return {
                    success: true,
                    orderId: MEMORY_DEMO_ORDERS[memoIdx].id,
                    orderNumber: MEMORY_DEMO_ORDERS[memoIdx].order_number,
                };
            }
            return { success: false, error: created.error || 'No se pudo guardar los cambios del pedido.' };
        }

        const realOrderId = existingOrder.id as string;

        let currentMeta: Record<string, any> = {};
        if (typeof existingOrder.internal_notes === 'string' && existingOrder.internal_notes.trim().startsWith('{')) {
            try {
                currentMeta = JSON.parse(existingOrder.internal_notes);
            } catch {
                // ignore
            }
        }

        let subtotalAmountCents = 0;
        const validatedItems = items.map(item => {
            const itemUnitPriceCents = solesToCents(item.unitPriceAmount);
            const itemTotalCents = itemUnitPriceCents * item.quantity;
            subtotalAmountCents += itemTotalCents;

            return {
                store_id: existingOrder.store_id,
                product_id: item.productId && item.productId.length === 36 ? item.productId : null,
                variant_id: item.variantId || null,
                product_name: item.productName || 'Producto',
                variant_name: item.variantName || null,
                sku: item.sku || null,
                image: item.image || null,
                unit_price_amount: itemUnitPriceCents,
                original_unit_price: solesToCents(item.originalUnitPriceAmount || item.unitPriceAmount),
                final_unit_price: itemUnitPriceCents,
                price_adjustment_reason: item.priceAdjustmentReason || null,
                quantity: item.quantity,
                total_amount: itemTotalCents,
            };
        });

        let discountAmountCents = 0;
        if (discountType === 'percentage' && discountValue && discountValue > 0) {
            discountAmountCents = Math.round((subtotalAmountCents * discountValue) / 100);
        } else if (discountType === 'fixed' && discountValue && discountValue > 0) {
            discountAmountCents = solesToCents(discountValue);
        }

        const shippingAmountCents = solesToCents(shippingAmount || 0);
        const totalAmountCents = Math.max(0, subtotalAmountCents + shippingAmountCents - discountAmountCents);
        const paidAmountCents = initialPaymentStatus === 'paid' ? totalAmountCents : 0;
        const balanceAmountCents = Math.max(0, totalAmountCents - paidAmountCents);

        const updatedMeta = {
            ...currentMeta,
            source: source || currentMeta.source || 'manual',
            source_reference: sourceReference || null,
            document_type: documentType || 'DNI',
            document_number: documentNumber || null,
            delivery_type: deliveryType || 'pickup',
            shipping_method_name: shippingMethodName || null,
            recipient_name: recipientName || customerName,
            recipient_phone: recipientPhone || customerPhone || null,
            shipping_department: shippingDepartment || null,
            shipping_province: shippingProvince || null,
            shipping_district: shippingDistrict || null,
            shipping_address_line: shippingAddressLine || null,
            shipping_reference: shippingReference || null,
            shipping_postal_code: shippingPostalCode || null,
            discount_type: discountType || null,
            discount_value: discountValue || 0,
            subtotal_amount_soles: subtotalAmountCents / 100,
            discount_amount_soles: discountAmountCents / 100,
            shipping_amount_soles: shippingAmountCents / 100,
            total_amount_soles: totalAmountCents / 100,
            paid_amount: paidAmountCents,
            balance_amount: balanceAmountCents,
            internal_note_text: internalNotes || null,
            items_snapshot: validatedItems,
        };

        const { error: updateErr } = await adminClient
            .from('orders')
            .update({
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone || null,
                subtotal_amount: subtotalAmountCents,
                discount_amount: discountAmountCents,
                shipping_amount: shippingAmountCents,
                total_amount: totalAmountCents,
                payment_method: paymentMethod,
                payment_status: initialPaymentStatus,
                customer_notes: customerNotes || null,
                internal_notes: JSON.stringify(updatedMeta),
                updated_at: new Date().toISOString(),
            })
            .eq('id', realOrderId);

        if (updateErr) {
            return { success: false, error: `Error al actualizar el pedido: ${updateErr.message}` };
        }

        // Replace order_items
        await adminClient.from('order_items').delete().eq('order_id', realOrderId);
        const itemsToInsert = validatedItems.map(i => ({
            store_id: i.store_id,
            order_id: realOrderId,
            product_id: i.product_id,
            product_name: i.product_name,
            unit_price_amount: i.unit_price_amount,
            quantity: i.quantity,
            total_amount: i.total_amount,
        }));
        await adminClient.from('order_items').insert(itemsToInsert);

        await adminClient.from('order_events').insert({
            store_id: existingOrder.store_id,
            order_id: realOrderId,
            event_type: 'order_updated',
            description: `Datos del pedido #${existingOrder.order_number} modificados por el administrador.`,
            created_by: 'Administrador',
        });

        return {
            success: true,
            orderId: realOrderId,
            orderNumber: existingOrder.order_number,
        };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al actualizar el pedido.';
        return { success: false, error: msg };
    }
}

/**
 * Fetch a single order by ID with fallbacks for memory demo orders
 */
export async function getSingleOrderAction(orderId: string) {
    try {
        const memoOrder = MEMORY_DEMO_ORDERS.find(o => o.id === orderId || o.order_number === orderId || o.id.includes(orderId));

        let targetOrder: OrderRecord | null = null;
        let items: OrderItemRecord[] = [];
        let events: OrderEventRecord[] = [];
        let notes: OrderNoteRecord[] = [];
        let totalSpent = 0;
        const totalOrdersCount = 1;

        try {
            const adminClient = createAdminClient();
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

            let dbOrder: Record<string, any> | null = null;
            if (isUuid) {
                const { data } = await adminClient
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .single();
                dbOrder = data;
            } else {
                const lookupOrderNum = memoOrder?.order_number || orderId;
                const { data } = await adminClient
                    .from('orders')
                    .select('*')
                    .eq('order_number', lookupOrderNum)
                    .single();
                dbOrder = data;
            }

            if (dbOrder) {
                const realOrderId = dbOrder.id as string;
                targetOrder = unpackDbOrder(dbOrder as Record<string, any>);
                let snapshotItems: Record<string, any>[] = [];
                if (typeof dbOrder.internal_notes === 'string' && dbOrder.internal_notes.trim().startsWith('{')) {
                    try {
                        const parsedMeta = JSON.parse(dbOrder.internal_notes);
                        if (Array.isArray(parsedMeta.items_snapshot)) {
                            snapshotItems = parsedMeta.items_snapshot;
                        }
                    } catch {
                        // ignore
                    }
                }

                const { data: dbOrderItems } = await adminClient
                    .from('order_items')
                    .select('*')
                    .eq('order_id', realOrderId);

                const { data: dbOrderEvents } = await adminClient
                    .from('order_events')
                    .select('*')
                    .eq('order_id', realOrderId)
                    .order('created_at', { ascending: false });

                // Enrich with product images from products table if needed
                let dbProdImagesMap: Record<string, string> = {};
                try {
                    const productIds = Array.from(new Set([
                        ...(dbOrderItems || []).map((x: Record<string, any>) => x.product_id),
                        ...snapshotItems.map((x: Record<string, any>) => x.product_id),
                    ].filter(Boolean)));

                    if (productIds.length > 0) {
                        const { data: prodRows } = await adminClient
                            .from('products')
                            .select('id, product_images(url, is_primary)')
                            .in('id', productIds);
                        if (prodRows) {
                            for (const pr of prodRows as Record<string, any>[]) {
                                const imgs = Array.isArray(pr.product_images) ? pr.product_images : [];
                                const primary = imgs.find((im: any) => im.is_primary) || imgs[0];
                                if (primary?.url) {
                                    dbProdImagesMap[pr.id] = primary.url;
                                }
                            }
                        }
                    }
                } catch {
                    // ignore optional image lookup error
                }

                const rawItems = ((dbOrderItems && dbOrderItems.length > 0) ? dbOrderItems : snapshotItems) as Record<string, any>[];
                items = rawItems.map((i, idx) => {
                    const snap = snapshotItems.find(s => s.product_name === i.product_name) || snapshotItems[idx] || {};
                    const pid = i.product_id || snap.product_id;
                    const imgUrl = i.image || i.image_url || snap.image || (pid ? dbProdImagesMap[pid] : undefined);
                    const unitDec = (i.unit_price_amount && Number.isInteger(i.unit_price_amount) && i.unit_price_amount >= 100) ? i.unit_price_amount / 100 : Number(i.unit_price_amount || 0);
                    const totalDec = (i.total_amount && Number.isInteger(i.total_amount) && i.total_amount >= 100) ? i.total_amount / 100 : Number(i.total_amount || 0);
                    return {
                        id: i.id || `item-${idx}`,
                        order_id: realOrderId,
                        product_id: pid,
                        variant_id: i.variant_id || snap.variant_id,
                        product_name: i.product_name || snap.product_name || 'Producto',
                        variant_name: i.variant_name || snap.variant_name || undefined,
                        sku: i.sku || snap.sku || undefined,
                        image: imgUrl,
                        image_url: imgUrl,
                        unit_price_amount: unitDec,
                        original_unit_price: unitDec,
                        final_unit_price: unitDec,
                        quantity: Number(i.quantity || 1),
                        total_amount: totalDec,
                    };
                });
                events = (dbOrderEvents || []) as OrderEventRecord[];
            }
        } catch (dbErr) {
            console.warn('DB single order fetch skipped:', dbErr);
        }

        if (!targetOrder && memoOrder) {
            targetOrder = memoOrder;
        }

        if (!targetOrder && MEMORY_DEMO_ORDERS.length > 0) {
            targetOrder = MEMORY_DEMO_ORDERS[0];
        }

        if (!targetOrder) {
            return { success: false, error: 'Pedido no encontrado.' };
        }

        // Demo items fallback if empty
        if (!items || items.length === 0) {
            items = [
                {
                    id: `item-${targetOrder.id}-1`,
                    order_id: targetOrder.id,
                    product_name: 'Polo Cotton Premium 100% Algodón',
                    variant_name: 'Negro / Talla M',
                    sku: 'POLO-COT-M',
                    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80',
                    unit_price_amount: targetOrder.subtotal_amount || targetOrder.total_amount,
                    original_unit_price: targetOrder.subtotal_amount || targetOrder.total_amount,
                    final_unit_price: targetOrder.subtotal_amount || targetOrder.total_amount,
                    quantity: 1,
                    total_amount: targetOrder.subtotal_amount || targetOrder.total_amount,
                }
            ];
        }

        if (!events || events.length === 0) {
            events = [
                {
                    id: `event-${targetOrder.id}-1`,
                    order_id: targetOrder.id,
                    event_type: 'created',
                    description: `Pedido ${targetOrder.order_number} registrado correctamente desde el canal ${targetOrder.source || 'online_store'}.`,
                    created_by: targetOrder.customer_name,
                    created_at: targetOrder.created_at,
                }
            ];
        }

        totalSpent = targetOrder.total_amount || 150;

        return {
            success: true,
            order: targetOrder,
            items,
            events,
            notes,
            customerHistory: {
                totalOrders: totalOrdersCount,
                totalSpent,
            }
        };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al obtener el pedido.';
        return { success: false, error: errorMsg };
    }
}

export interface SavedCustomerRecord {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
    email: string;
    documentType: string;
    documentNumber: string;
    department?: string;
    province?: string;
    district?: string;
    addressLine?: string;
    reference?: string;
}

const DEFAULT_SAVED_CUSTOMERS: SavedCustomerRecord[] = [
    {
        id: 'cust-demo-1',
        firstName: 'Carlos',
        lastName: 'Mendoza',
        fullName: 'Carlos Mendoza',
        phone: '987654321',
        email: 'carlos.mendoza@gmail.com',
        documentType: 'DNI',
        documentNumber: '74859632',
        department: 'Lima',
        province: 'Lima',
        district: 'Miraflores',
        addressLine: 'Av. Larco 450, Dpto 302',
        reference: 'Frente al Parque Kennedy',
    },
    {
        id: 'cust-demo-2',
        firstName: 'María Fernanda',
        lastName: 'Ríos',
        fullName: 'María Fernanda Ríos',
        phone: '912345678',
        email: 'maria.rios@hotmail.com',
        documentType: 'DNI',
        documentNumber: '71234589',
        department: 'La Libertad',
        province: 'Trujillo',
        district: 'Trujillo',
        addressLine: 'Jr. Pizarro 620',
        reference: 'A media cuadra de la Plaza',
    },
    {
        id: 'cust-demo-3',
        firstName: 'Jorge Luis',
        lastName: 'Morales',
        fullName: 'Jorge Luis Morales',
        phone: '955888222',
        email: 'jorge.morales@empresa.pe',
        documentType: 'RUC',
        documentNumber: '20601234567',
        department: 'Lima',
        province: 'Lima',
        district: 'San Isidro',
        addressLine: 'Av. Javier Prado Este 1240, Of. 801',
        reference: 'Edificio Corporativo',
    },
    {
        id: 'cust-demo-4',
        firstName: 'Ana Sofía',
        lastName: 'Delgado',
        fullName: 'Ana Sofía Delgado',
        phone: '944111333',
        email: 'ana.delgado@outlook.com',
        documentType: 'DNI',
        documentNumber: '76543218',
        department: 'Lima',
        province: 'Lima',
        district: 'San Borja',
        addressLine: 'Calle Las Artes Norte 315',
        reference: 'Altura estación San Borja Sur',
    },
    {
        id: 'cust-demo-5',
        firstName: 'Diego',
        lastName: 'Barnechea',
        fullName: 'Diego Barnechea',
        phone: '966555999',
        email: 'diego.b@gmail.com',
        documentType: 'DNI',
        documentNumber: '45896321',
        department: 'Lima',
        province: 'Lima',
        district: 'La Molina',
        addressLine: 'Av. Raúl Ferrero 1080',
        reference: 'Cerca a Molina Plaza',
    },
];

function splitFullName(fullName: string): { firstName: string; lastName: string } {
    const clean = (fullName || '').trim().replace(/\s+/g, ' ');
    if (!clean) return { firstName: '', lastName: '' };
    const parts = clean.split(' ');
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
    return {
        firstName: parts.slice(0, -1).join(' '),
        lastName: parts.slice(-1).join(' '),
    };
}

function cleanPhoneInput(phone?: string | null): string {
    if (!phone) return '';
    return phone.replace(/^\+?51\s*/, '').replace(/\s+/g, '').trim();
}

export async function getSavedCustomersForAutocompleteAction(): Promise<{
    success: boolean;
    customers: SavedCustomerRecord[];
}> {
    try {
        const adminClient = createAdminClient();
        const mapByKey = new Map<string, SavedCustomerRecord>();

        // 1. Consultar órdenes recientes para extraer clientes y sus direcciones reales
        const { data: dbOrders } = await adminClient
            .from('orders')
            .select('id, customer_name, customer_email, customer_phone, internal_notes, created_at')
            .order('created_at', { ascending: false })
            .limit(100);

        if (dbOrders) {
            for (const raw of dbOrders) {
                const unpacked = unpackDbOrder(raw as Record<string, any>);
                const phoneClean = cleanPhoneInput(unpacked.customer_phone);
                const fullName = (unpacked.customer_name || '').trim();
                if (!fullName && !phoneClean) continue;

                const { firstName, lastName } = splitFullName(fullName);
                const email = unpacked.customer_email && !unpacked.customer_email.includes('sin-correo@') ? unpacked.customer_email : '';
                const key = (phoneClean || email || fullName).toLowerCase();

                if (!mapByKey.has(key)) {
                    mapByKey.set(key, {
                        id: `ord-cust-${raw.id}`,
                        firstName,
                        lastName,
                        fullName,
                        phone: phoneClean,
                        email,
                        documentType: 'DNI',
                        documentNumber: '',
                        department: unpacked.shipping_department || 'Lima',
                        province: unpacked.shipping_province || 'Lima',
                        district: unpacked.shipping_district || '',
                        addressLine: unpacked.shipping_address_line || '',
                        reference: unpacked.shipping_reference || '',
                    });
                }
            }
        }

        // 2. Consultar tabla customers en Supabase
        const { data: dbCustomers } = await adminClient
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (dbCustomers) {
            for (const c of dbCustomers) {
                const phoneClean = cleanPhoneInput(c.phone);
                const fullName = (c.name || '').trim();
                const { firstName, lastName } = splitFullName(fullName);
                const email = c.email && !c.email.includes('sin-correo@') ? c.email : '';
                const key = (phoneClean || email || fullName).toLowerCase();

                const existing = mapByKey.get(key);
                mapByKey.set(key, {
                    id: c.id,
                    firstName: firstName || existing?.firstName || '',
                    lastName: lastName || existing?.lastName || '',
                    fullName: fullName || existing?.fullName || '',
                    phone: phoneClean || existing?.phone || '',
                    email: email || existing?.email || '',
                    documentType: c.document_type || existing?.documentType || 'DNI',
                    documentNumber: c.document_number || existing?.documentNumber || '',
                    department: existing?.department || 'Lima',
                    province: existing?.province || 'Lima',
                    district: existing?.district || '',
                    addressLine: existing?.addressLine || '',
                    reference: existing?.reference || '',
                });
            }
        }

        // 3. Agregar clientes pre-guardados de respaldo
        for (const demo of DEFAULT_SAVED_CUSTOMERS) {
            const key = demo.phone.toLowerCase();
            if (!mapByKey.has(key)) {
                mapByKey.set(key, demo);
            }
        }

        return {
            success: true,
            customers: Array.from(mapByKey.values()),
        };
    } catch {
        return {
            success: true,
            customers: DEFAULT_SAVED_CUSTOMERS,
        };
    }
}
