'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/money';

export interface CheckoutPayload {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    paymentMethod: 'yape' | 'plin' | 'bank_transfer' | 'cash_on_delivery' | 'quote_request';
    notes?: string;
    addressLine?: string;
    district?: string;
    items: {
        productId: string;
        quantity: number;
    }[];
}

export interface CheckoutResult {
    success: boolean;
    orderId?: string;
    orderNumber?: string;
    totalFormatted?: string;
    error?: string;
}

export async function processCheckoutAction(payload: CheckoutPayload): Promise<CheckoutResult> {
    try {
        const { customerName, customerEmail, customerPhone, paymentMethod, notes, items } = payload;

        if (!items || items.length === 0) {
            return { success: false, error: 'El carrito está vacío.' };
        }

        if (!customerName || !customerEmail) {
            return { success: false, error: 'Por favor proporciona tu nombre y correo electrónico.' };
        }

        const adminClient = createAdminClient();

        // 1. Fetch default store
        const { data: store, error: storeError } = await adminClient
            .from('stores')
            .select('id')
            .eq('slug', 'codemarket')
            .single();

        if (storeError || !store) {
            return { success: false, error: 'Error al conectar con la tienda CodeMarket.' };
        }

        const storeId = store.id;

        // 2. Fetch and validate product prices & stock directly from DB (Server-side recalculation)
        const productIds = items.map(i => i.productId);
        const { data: dbProducts, error: prodError } = await adminClient
            .from('products')
            .select('*')
            .in('id', productIds);

        if (prodError || !dbProducts) {
            return { success: false, error: 'No se pudieron verificar los productos seleccionados.' };
        }

        let subtotalAmount = 0;
        const orderItemsToInsert: {
            store_id: string;
            product_id: string;
            product_name: string;
            unit_price_amount: number;
            quantity: number;
            total_amount: number;
        }[] = [];

        for (const item of items) {
            const product = dbProducts.find(p => p.id === item.productId);
            if (!product || product.status !== 'active') {
                return { success: false, error: `El producto seleccionado ya no está disponible.` };
            }

            if (product.track_inventory && product.stock_quantity < item.quantity) {
                return { success: false, error: `Stock insuficiente para el producto "${product.name}". Disponible: ${product.stock_quantity}.` };
            }

            const itemTotal = product.price_amount * item.quantity;
            subtotalAmount += itemTotal;

            orderItemsToInsert.push({
                store_id: storeId,
                product_id: product.id,
                product_name: product.name,
                unit_price_amount: product.price_amount,
                quantity: item.quantity,
                total_amount: itemTotal,
            });
        }

        const shippingAmount = 0;
        const discountAmount = 0;
        const totalAmount = subtotalAmount + shippingAmount - discountAmount;

        // 3. Create or fetch Customer
        let customerId: string | null = null;
        const { data: existingCustomer } = await adminClient
            .from('customers')
            .select('id')
            .eq('store_id', storeId)
            .eq('email', customerEmail)
            .single();

        if (existingCustomer) {
            customerId = existingCustomer.id;
        } else {
            const { data: newCustomer } = await adminClient
                .from('customers')
                .insert({
                    store_id: storeId,
                    name: customerName,
                    email: customerEmail,
                    phone: customerPhone,
                })
                .select('id')
                .single();
            if (newCustomer) {
                customerId = newCustomer.id;
            }
        }

        // 4. Generate Order Number (CM-1000 + random suffix/counter)
        const orderNumber = `CM-${Math.floor(100000 + Math.random() * 900000)}`;

        // 5. Insert Order
        const { data: createdOrder, error: orderErr } = await adminClient
            .from('orders')
            .insert({
                store_id: storeId,
                customer_id: customerId,
                order_number: orderNumber,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                currency: 'PEN',
                subtotal_amount: subtotalAmount,
                discount_amount: discountAmount,
                shipping_amount: shippingAmount,
                total_amount: totalAmount,
                payment_method: paymentMethod,
                payment_status: 'pending',
                fulfillment_status: 'unfulfilled',
                customer_notes: notes || null,
            })
            .select('id, order_number, total_amount, currency')
            .single();

        if (orderErr || !createdOrder) {
            return { success: false, error: `Error al registrar el pedido: ${orderErr?.message}` };
        }

        // 6. Insert Order Items
        const itemsWithOrderId = orderItemsToInsert.map(item => ({
            ...item,
            order_id: createdOrder.id,
        }));

        await adminClient.from('order_items').insert(itemsWithOrderId);

        // 7. Update Inventory if tracked
        for (const item of items) {
            const product = dbProducts.find(p => p.id === item.productId);
            if (product && product.track_inventory) {
                const newStock = Math.max(0, product.stock_quantity - item.quantity);
                await adminClient
                    .from('products')
                    .update({ stock_quantity: newStock })
                    .eq('id', product.id);

                await adminClient.from('inventory_movements').insert({
                    store_id: storeId,
                    product_id: product.id,
                    movement_type: 'sale',
                    quantity: -item.quantity,
                    reference_type: 'order',
                    reference_id: createdOrder.id,
                    notes: `Venta en pedido ${createdOrder.order_number}`,
                });
            }
        }

        return {
            success: true,
            orderId: createdOrder.id,
            orderNumber: createdOrder.order_number,
            totalFormatted: formatMoney(createdOrder.total_amount, createdOrder.currency),
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error inesperado durante el checkout.';
        return { success: false, error: message };
    }
}
