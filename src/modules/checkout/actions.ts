'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/money';
import { getCheckoutSettingsAction, PaymentMethodConfig, ShippingMethodConfig } from './checkoutSettingsActions';

export interface CheckoutPayload {
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    shippingMethodId: string;
    paymentMethod: string;
    notes?: string;
    recipientName?: string;
    recipientPhone?: string;
    department?: string;
    province?: string;
    district?: string;
    addressLine?: string;
    reference?: string;
    postalCode?: string;
    isAgeConfirmed?: boolean;
    couponCode?: string;
    orderType?: 'order' | 'quote';
    items: {
        productId: string;
        quantity: number;
        variantId?: string;
    }[];
}

export interface CheckoutResult {
    success: boolean;
    orderId?: string;
    orderNumber?: string;
    accessToken?: string;
    redirectUrl?: string;
    totalFormatted?: string;
    error?: string;
    fieldErrors?: Record<string, string>;
}

export async function processCheckoutAction(payload: CheckoutPayload): Promise<CheckoutResult> {
    try {
        const {
            customerName,
            customerEmail,
            customerPhone,
            shippingMethodId,
            paymentMethod,
            notes,
            recipientName,
            recipientPhone,
            department,
            province,
            district,
            addressLine,
            reference,
            postalCode,
            isAgeConfirmed,
            couponCode,
            orderType = 'order',
            items
        } = payload;

        const fieldErrors: Record<string, string> = {};

        // 1. Basic Field Validations
        if (!customerName || !customerName.trim()) {
            fieldErrors.customerName = 'Ingresa tu nombre completo.';
        }

        if (!customerPhone || !customerPhone.trim()) {
            fieldErrors.customerPhone = 'Ingresa un número de teléfono o WhatsApp válido.';
        }

        // Fetch Store Settings
        const settingsRes = await getCheckoutSettingsAction();
        if (!settingsRes.success || !settingsRes.settings) {
            return { success: false, error: 'No se pudo conectar con la configuración de la tienda.' };
        }

        const { settings } = settingsRes;

        if (settings.require_email && (!customerEmail || !customerEmail.includes('@'))) {
            fieldErrors.customerEmail = 'Ingresa un correo electrónico válido.';
        }

        if (settings.require_age_confirmation && !isAgeConfirmed) {
            fieldErrors.isAgeConfirmed = 'Debes confirmar que cumples con la edad mínima legal.';
        }

        if (!items || items.length === 0) {
            return { success: false, error: 'Tu carrito de compras está vacío.' };
        }

        // Validate Shipping Method
        const selectedShipping = settings.shipping_methods.find(s => s.id === shippingMethodId);
        if (!selectedShipping) {
            fieldErrors.shippingMethodId = 'Selecciona un método de envío válido.';
        } else if (selectedShipping.requires_address) {
            if (!department || !department.trim()) fieldErrors.department = 'Selecciona tu departamento.';
            if (!province || !province.trim()) fieldErrors.province = 'Selecciona tu provincia.';
            if (!district || !district.trim()) fieldErrors.district = 'Selecciona tu distrito.';
            if (!addressLine || !addressLine.trim()) fieldErrors.addressLine = 'Ingresa tu dirección exacta de entrega.';
        }

        // Validate Payment Method
        const selectedPayment = settings.payment_methods.find(p => p.id === paymentMethod);
        if (!selectedPayment && orderType !== 'quote') {
            fieldErrors.paymentMethod = 'Selecciona un método de pago válido.';
        } else if (selectedPayment?.allowed_shipping_methods && selectedPayment.allowed_shipping_methods.length > 0) {
            if (!selectedPayment.allowed_shipping_methods.includes(shippingMethodId)) {
                fieldErrors.paymentMethod = `El método ${selectedPayment.name} no está disponible para ${selectedShipping?.name || 'este envío'}.`;
            }
        }

        if (Object.keys(fieldErrors).length > 0) {
            return {
                success: false,
                error: 'Por favor corrige los campos indicados.',
                fieldErrors
            };
        }

        const adminClient = createAdminClient();

        // 2. Fetch default store
        const { data: store, error: storeError } = await adminClient
            .from('stores')
            .select('id, name, slug, currency')
            .eq('slug', 'codemarket')
            .single();

        if (storeError || !store) {
            return { success: false, error: 'Error al conectar con la tienda CodeMarket.' };
        }

        const storeId = store.id;

        // 3. Fetch and validate product prices & stock directly from DB (Server-side recalculation)
        const productIds = items.map(i => i.productId);
        const { data: dbProducts, error: prodError } = await adminClient
            .from('products')
            .select('*')
            .in('id', productIds);

        let subtotalAmount = 0;
        const orderItemsToInsert: {
            store_id: string;
            product_id?: string;
            product_name: string;
            variant_name?: string;
            unit_price_amount: number;
            quantity: number;
            total_amount: number;
        }[] = [];

        for (const item of items) {
            const product = dbProducts?.find(p => p.id === item.productId);
            
            // If product is found in DB:
            if (product) {
                if (product.status !== 'active') {
                    return { success: false, error: `El producto "${product.name}" ya no está disponible.` };
                }

                if (product.track_inventory && product.stock_quantity < item.quantity) {
                    return { success: false, error: `Stock insuficiente para el producto "${product.name}". Disponible: ${product.stock_quantity} uds.` };
                }

                const priceAmount = Number(product.price_amount || 0);
                const itemTotal = priceAmount * item.quantity;
                subtotalAmount += itemTotal;

                orderItemsToInsert.push({
                    store_id: storeId,
                    product_id: product.id,
                    product_name: product.name,
                    unit_price_amount: priceAmount,
                    quantity: item.quantity,
                    total_amount: itemTotal,
                });
            } else {
                // Fallback for demo products not yet saved in DB table
                const itemTotal = 4500 * item.quantity; // Default S/ 45.00 fallback
                subtotalAmount += itemTotal;
                orderItemsToInsert.push({
                    store_id: storeId,
                    product_name: `Producto Demo (${item.productId})`,
                    unit_price_amount: 4500,
                    quantity: item.quantity,
                    total_amount: itemTotal,
                });
            }
        }

        // Calculate Shipping Fee from Server Configuration
        const shippingAmount = selectedShipping ? selectedShipping.price_amount : 0;

        // Calculate Discount (validate coupon if any)
        let discountAmount = 0;
        if (couponCode) {
            const upperCode = couponCode.trim().toUpperCase();
            if (upperCode === 'ROBOTINA10' || upperCode === 'PROMO10') {
                discountAmount = Math.round(subtotalAmount * 0.10);
            } else if (upperCode === 'DESC20') {
                discountAmount = Math.round(subtotalAmount * 0.20);
            } else if (upperCode === 'CODEMARKET') {
                discountAmount = Math.round(subtotalAmount * 0.15);
            }
        }

        const totalAmount = Math.max(0, subtotalAmount + shippingAmount - discountAmount);

        // 4. Create or fetch Customer
        let customerId: string | null = null;
        if (customerEmail) {
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
                        notes: notes || null,
                    })
                    .select('id')
                    .single();
                if (newCustomer) {
                    customerId = newCustomer.id;
                }
            }
        }

        // 5. Generate Order Number (CM-100000 + random)
        const orderNumber = `CM-${Math.floor(100000 + Math.random() * 900000)}`;

        // 6. Insert Order
        const isQuote = orderType === 'quote';
        const initialPaymentStatus = isQuote ? 'pending' : 'pending';
        const initialOrderStatus = isQuote ? 'quote' : 'confirmed';

        const { data: createdOrder, error: orderErr } = await adminClient
            .from('orders')
            .insert({
                store_id: storeId,
                customer_id: customerId,
                order_number: orderNumber,
                customer_name: customerName,
                customer_email: customerEmail || 'sin-correo@codemarket.dev',
                customer_phone: customerPhone,
                currency: store.currency || 'PEN',
                subtotal_amount: subtotalAmount,
                discount_amount: discountAmount,
                shipping_amount: shippingAmount,
                total_amount: totalAmount,
                payment_method: isQuote ? 'quote_request' : paymentMethod,
                payment_status: initialPaymentStatus,
                fulfillment_status: 'unfulfilled',
                order_status: initialOrderStatus,
                delivery_type: selectedShipping?.id === 'store_pickup' ? 'pickup' : 'delivery',
                shipping_method_id: shippingMethodId,
                shipping_method_name: selectedShipping?.name,
                recipient_name: recipientName || customerName,
                recipient_phone: recipientPhone || customerPhone,
                shipping_department: department || null,
                shipping_province: province || null,
                shipping_district: district || null,
                shipping_address_line: addressLine || null,
                shipping_reference: reference || null,
                shipping_postal_code: postalCode || null,
                is_age_confirmed: Boolean(isAgeConfirmed),
                customer_notes: notes || null,
            })
            .select('id, order_number, access_token, total_amount, currency')
            .single();

        if (orderErr || !createdOrder) {
            console.error('Order creation error:', orderErr);
            return { success: false, error: `Error al registrar el pedido: ${orderErr?.message || 'Fallo desconocido'}` };
        }

        // 7. Insert Order Items
        const itemsWithOrderId = orderItemsToInsert.map(item => ({
            ...item,
            order_id: createdOrder.id,
        }));

        await adminClient.from('order_items').insert(itemsWithOrderId);

        // 8. Record Order Created Timeline Event
        await adminClient.from('order_events').insert({
            store_id: storeId,
            order_id: createdOrder.id,
            event_type: 'order_created',
            description: `Pedido ${createdOrder.order_number} registrado por ${customerName}.`,
            created_by: 'Cliente (Checkout)'
        });

        // 9. Update Inventory if tracked
        for (const item of items) {
            const product = dbProducts?.find(p => p.id === item.productId);
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

        const accessToken = createdOrder.access_token || createdOrder.id;

        return {
            success: true,
            orderId: createdOrder.id,
            orderNumber: createdOrder.order_number,
            accessToken,
            redirectUrl: `/pedido/${accessToken}/confirmacion`,
            totalFormatted: formatMoney(createdOrder.total_amount / 100, createdOrder.currency),
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error inesperado durante el checkout.';
        return { success: false, error: message };
    }
}
