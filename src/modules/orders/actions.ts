'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney, parseMoneyToCents } from '@/lib/money';

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

/**
 * Fetch orders list with real metric counters, debounced search, and complex multi-filtering
 */
export async function getOrdersListAction(params: OrderFilterParams): Promise<OrdersListResponse> {
    try {
        const adminClient = createAdminClient();

        // 1. Fetch store ID
        const { data: store } = await adminClient
            .from('stores')
            .select('id')
            .eq('slug', 'codemarket')
            .single();

        if (!store) {
            return {
                success: false,
                orders: [],
                totalCount: 0,
                metrics: { total: 0, new: 0, pendingPayment: 0, paid: 0, preparing: 0, shipped: 0, delivered: 0 },
                error: 'Tienda CodeMarket no encontrada',
            };
        }

        const storeId = store.id;

        // 2. Fetch all orders for store to calculate real metrics
        const { data: allOrders, error: allOrdersError } = await adminClient
            .from('orders')
            .select('id, order_status, payment_status, fulfillment_status')
            .eq('store_id', storeId);

        if (allOrdersError) {
            return {
                success: false,
                orders: [],
                totalCount: 0,
                metrics: { total: 0, new: 0, pendingPayment: 0, paid: 0, preparing: 0, shipped: 0, delivered: 0 },
                error: allOrdersError.message,
            };
        }

        const metrics = {
            total: allOrders?.length || 0,
            new: allOrders?.filter(o => o.order_status === 'new' || !o.order_status).length || 0,
            pendingPayment: allOrders?.filter(o => o.payment_status === 'pending' || o.payment_status === 'under_review').length || 0,
            paid: allOrders?.filter(o => o.payment_status === 'paid').length || 0,
            preparing: allOrders?.filter(o => o.fulfillment_status === 'preparing' || o.fulfillment_status === 'processing').length || 0,
            shipped: allOrders?.filter(o => o.fulfillment_status === 'shipped').length || 0,
            delivered: allOrders?.filter(o => o.fulfillment_status === 'delivered' || o.fulfillment_status === 'fulfilled').length || 0,
        };

        // 3. Build main query
        let query = adminClient
            .from('orders')
            .select(`
                *,
                order_items (*),
                order_events (*),
                order_notes (*)
            `, { count: 'exact' })
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        // Apply filters
        if (params.orderStatus && params.orderStatus !== 'all') {
            query = query.eq('order_status', params.orderStatus);
        }

        if (params.paymentStatus && params.paymentStatus !== 'all') {
            query = query.eq('payment_status', params.paymentStatus);
        }

        if (params.fulfillmentStatus && params.fulfillmentStatus !== 'all') {
            query = query.eq('fulfillment_status', params.fulfillmentStatus);
        }

        if (params.source && params.source !== 'all') {
            query = query.eq('source', params.source);
        }

        if (params.deliveryType && params.deliveryType !== 'all') {
            query = query.eq('delivery_type', params.deliveryType);
        }

        if (params.paymentMethod && params.paymentMethod !== 'all') {
            query = query.eq('payment_method', params.paymentMethod);
        }

        // Date range filter
        if (params.dateRange && params.dateRange !== 'all') {
            const now = new Date();
            let startDate = new Date();

            if (params.dateRange === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (params.dateRange === 'yesterday') {
                startDate.setDate(now.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date();
                endDate.setDate(now.getDate() - 1);
                endDate.setHours(23, 59, 59, 999);
                query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
            } else if (params.dateRange === 'last_7_days') {
                startDate.setDate(now.getDate() - 7);
            } else if (params.dateRange === 'last_30_days') {
                startDate.setDate(now.getDate() - 30);
            } else if (params.dateRange === 'this_month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            if (params.dateRange !== 'yesterday') {
                query = query.gte('created_at', startDate.toISOString());
            }
        }

        // Text search across order_number, customer_name, customer_email, customer_phone
        if (params.searchQuery && params.searchQuery.trim() !== '') {
            const q = params.searchQuery.trim();
            query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,customer_phone.ilike.%${q}%`);
        }

        const page = params.page || 1;
        const limit = params.limit || 50;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query.range(from, to);

        const { data: orders, count, error } = await query;

        if (error) {
            return {
                success: false,
                orders: [],
                totalCount: 0,
                metrics,
                error: error.message,
            };
        }

        return {
            success: true,
            orders: (orders as OrderRecord[]) || [],
            totalCount: count || 0,
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
        let finalCustomerId: string | null = customerId || null;

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
                        document_type: documentType || null,
                        document_number: documentNumber || null,
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

            const itemUnitPriceCents = parseMoneyToCents(item.unitPriceAmount);
            const itemTotalCents = itemUnitPriceCents * item.quantity;
            subtotalAmountCents += itemTotalCents;

            validatedItems.push({
                store_id: storeId,
                product_id: dbProd ? dbProd.id : (item.productId.length === 36 ? item.productId : null),
                variant_id: item.variantId || null,
                product_name: item.productName || dbProd?.name || 'Producto',
                variant_name: item.variantName || null,
                sku: item.sku || dbProd?.sku || null,
                unit_price_amount: itemUnitPriceCents,
                original_unit_price: parseMoneyToCents(item.originalUnitPriceAmount || dbProd?.price_amount || itemUnitPriceCents),
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
            discountAmountCents = parseMoneyToCents(discountValue);
        }

        const shippingAmountCents = parseMoneyToCents(shippingAmount || 0);
        const totalAmountCents = Math.max(0, subtotalAmountCents + shippingAmountCents - discountAmountCents);

        const paidAmountCents = initialPaymentStatus === 'paid' ? totalAmountCents : 0;
        const balanceAmountCents = Math.max(0, totalAmountCents - paidAmountCents);

        // 5. Generate Order Number
        const orderNumber = `CM-${Math.floor(100000 + Math.random() * 900000)}`;

        const orderStatus = initialOrderStatus || 'confirmed';
        const fulfillmentStatus = 'unfulfilled';

        // 6. Insert Order Record
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
                paid_amount: paidAmountCents,
                balance_amount: balanceAmountCents,
                source: source || 'manual',
                source_reference: sourceReference || null,
                order_status: orderStatus,
                payment_method: paymentMethod,
                payment_status: initialPaymentStatus,
                fulfillment_status: fulfillmentStatus,
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
                customer_notes: customerNotes || null,
                internal_notes: internalNotes || null,
            })
            .select('id, order_number')
            .single();

        if (insertOrderErr || !createdOrder) {
            return { success: false, error: `Error al guardar el pedido: ${insertOrderErr?.message}` };
        }

        const orderId = createdOrder.id;

        // 7. Insert Items
        const itemsToInsert = validatedItems.map(i => ({ ...i, order_id: orderId }));
        await adminClient.from('order_items').insert(itemsToInsert);

        // 8. Update Inventory & Record Movements
        for (const item of validatedItems) {
            const dbProd = dbProducts?.find(p => p.id === item.product_id);
            if (dbProd && dbProd.track_inventory) {
                const newStock = Math.max(0, dbProd.stock_quantity - item.quantity);
                await adminClient
                    .from('products')
                    .update({ stock_quantity: newStock })
                    .eq('id', dbProd.id);

                await adminClient.from('inventory_movements').insert({
                    store_id: storeId,
                    product_id: dbProd.id,
                    movement_type: 'sale',
                    quantity: -item.quantity,
                    reference_type: 'order',
                    reference_id: orderId,
                    notes: `Venta manual en pedido ${orderNumber} (Canal: ${source})`,
                });
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

        const { data: currentOrder } = await adminClient
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (!currentOrder) {
            return { success: false, error: 'Pedido no encontrado.' };
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        const eventsToInsert = [];

        if (updates.orderStatus && updates.orderStatus !== currentOrder.order_status) {
            updateData.order_status = updates.orderStatus;
            eventsToInsert.push({
                store_id: currentOrder.store_id,
                order_id: orderId,
                event_type: 'status_changed',
                description: `Estado del pedido cambiado de ${currentOrder.order_status || 'nuevo'} a ${updates.orderStatus}.`,
                created_by: 'Administrador',
            });

            // Handle cancellation inventory release if cancelled
            if (updates.orderStatus === 'cancelled') {
                updateData.cancel_reason = updates.reason || 'Cancelado por el administrador';
                updateData.cancelled_at = new Date().toISOString();

                // Fetch items to release stock if needed
                const { data: items } = await adminClient
                    .from('order_items')
                    .select('*')
                    .eq('order_id', orderId);

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

                                await adminClient.from('inventory_movements').insert({
                                    store_id: currentOrder.store_id,
                                    product_id: item.product_id,
                                    movement_type: 'cancellation',
                                    quantity: item.quantity,
                                    reference_type: 'order',
                                    reference_id: orderId,
                                    notes: `Restablecimiento de stock por cancelación de pedido ${currentOrder.order_number}`,
                                });
                            }
                        }
                    }
                }
            }
        }

        if (updates.paymentStatus && updates.paymentStatus !== currentOrder.payment_status) {
            updateData.payment_status = updates.paymentStatus;

            if (updates.paymentStatus === 'paid') {
                updateData.paid_amount = currentOrder.total_amount;
                updateData.balance_amount = 0;
            } else if (updates.paymentStatus === 'pending') {
                updateData.paid_amount = 0;
                updateData.balance_amount = currentOrder.total_amount;
            }

            eventsToInsert.push({
                store_id: currentOrder.store_id,
                order_id: orderId,
                event_type: 'payment_status_changed',
                description: `Estado de pago actualizado a ${updates.paymentStatus.toUpperCase()}.`,
                created_by: 'Administrador',
            });
        }

        if (updates.fulfillmentStatus && updates.fulfillmentStatus !== currentOrder.fulfillment_status) {
            updateData.fulfillment_status = updates.fulfillmentStatus;
            eventsToInsert.push({
                store_id: currentOrder.store_id,
                order_id: orderId,
                event_type: 'fulfillment_status_changed',
                description: `Estado de entrega actualizado a ${updates.fulfillmentStatus}.`,
                created_by: 'Administrador',
            });
        }

        const { error: updateErr } = await adminClient
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

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

        const adminClient = createAdminClient();

        const { data: order } = await adminClient
            .from('orders')
            .select('store_id')
            .eq('id', orderId)
            .single();

        if (!order) {
            return { success: false, error: 'Pedido no encontrado.' };
        }

        const { data: note, error } = await adminClient
            .from('order_notes')
            .insert({
                store_id: order.store_id,
                order_id: orderId,
                user_name: 'Administrador',
                content: content.trim(),
            })
            .select('*')
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, note };
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
