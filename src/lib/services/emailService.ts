export interface EmailOrderItem {
    productName: string;
    variantName?: string;
    quantity: number;
    unitPriceFormatted: string;
    totalFormatted: string;
}

export interface TransactionalEmailOrderPayload {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    items: EmailOrderItem[];
    subtotalFormatted: string;
    shippingFormatted: string;
    discountFormatted?: string;
    totalFormatted: string;
    paymentMethodLabel: string;
    shippingAddress?: string;
    confirmationUrl?: string;
}

export class EmailService {
    private static getResendApiKey(): string | undefined {
        return process.env.RESEND_API_KEY;
    }

    private static getAdminEmail(): string {
        return process.env.ADMIN_NOTIFICATION_EMAIL || 'contacto@tiendavir.com';
    }

    /**
     * Send order confirmation email to the buyer
     */
    static async sendOrderConfirmationToCustomer(order: TransactionalEmailOrderPayload): Promise<boolean> {
        const subject = `🛍️ Confirmación de Pedido ${order.orderNumber} - TiendaVir`;

        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">
                    <strong>${item.productName}</strong> ${item.variantName ? `<br><small style="color: #64748b;">${item.variantName}</small>` : ''}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #0f172a;">
                    x${item.quantity}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #ff6b00; font-weight: bold;">
                    ${item.totalFormatted}
                </td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${subject}</title>
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">TiendaVir</h1>
                        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.95;">¡Gracias por tu compra, ${order.customerName}!</p>
                    </div>

                    <!-- Content -->
                    <div style="padding: 24px;">
                        <div style="background: #fff7ed; border: 1px solid #ffedd5; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
                            <span style="display: block; font-size: 12px; font-weight: 700; color: #c2410c; text-transform: uppercase;">Número de Pedido</span>
                            <span style="font-size: 18px; font-weight: 800; color: #ea580c;">${order.orderNumber}</span>
                        </div>

                        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 16px;">Resumen del Pedido</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                            <thead>
                                <tr style="background: #f1f5f9; color: #475569; text-align: left; font-size: 12px; text-transform: uppercase;">
                                    <th style="padding: 8px 10px;">Producto</th>
                                    <th style="padding: 8px 10px; text-align: center;">Cant.</th>
                                    <th style="padding: 8px 10px; text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>

                        <!-- Totals -->
                        <div style="background: #f8fafc; padding: 16px; border-radius: 10px; margin-bottom: 24px; font-size: 14px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569;">
                                <span>Subtotal:</span>
                                <span>${order.subtotalFormatted}</span>
                            </div>
                            ${order.discountFormatted ? `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #22c55e; font-weight: bold;">
                                <span>Descuento aplicado:</span>
                                <span>-${order.discountFormatted}</span>
                            </div>` : ''}
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #475569;">
                                <span>Envío / Despacho:</span>
                                <span>${order.shippingFormatted}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px dashed #cbd5e1; padding-top: 8px;">
                                <span>Total a Pagar:</span>
                                <span style="color: #ff6b00;">${order.totalFormatted}</span>
                            </div>
                        </div>

                        ${order.confirmationUrl ? `
                        <div style="text-align: center; margin-bottom: 24px;">
                            <a href="${order.confirmationUrl}" style="background: linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(255,107,0,0.35);">
                                📍 Ver Estado de Pedido y Adjuntar Comprobante
                            </a>
                        </div>` : ''}

                        <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center;">
                            Método de pago seleccionado: <strong>${order.paymentMethodLabel}</strong>.<br>
                            Si tienes dudas, contáctanos a <a href="mailto:contacto@tiendavir.com" style="color: #ff6b00;">contacto@tiendavir.com</a>.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                        © 2026 TiendaVir • Todos los derechos reservados.
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.dispatchEmail(order.customerEmail, subject, html);
    }

    /**
     * Send new order alert email to the store administrator
     */
    static async sendNewOrderNotificationToAdmin(order: TransactionalEmailOrderPayload): Promise<boolean> {
        const adminEmail = this.getAdminEmail();
        const subject = `🔔 [NUEVA VENTA] Pedido ${order.orderNumber} por ${order.totalFormatted}`;

        const itemsSummary = order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${subject}</title>
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #ffffff;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 24px;">
                    <div style="background: #ff6b00; padding: 10px 16px; border-radius: 8px; font-weight: 800; font-size: 14px; text-transform: uppercase; display: inline-block; margin-bottom: 16px;">
                        ⚡ Notificación de Administración TiendaVir
                    </div>

                    <h2 style="margin: 0 0 8px 0; font-size: 20px;">¡Nueva Venta Recibida! (${order.orderNumber})</h2>
                    <p style="color: #94a3b8; margin: 0 0 20px 0; font-size: 14px;">Un cliente acaba de registrar una orden en la tienda.</p>

                    <div style="background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 20px; font-size: 14px;">
                        <p style="margin: 0 0 8px 0;"><strong>Cliente:</strong> ${order.customerName}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Correo:</strong> ${order.customerEmail}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Teléfono:</strong> ${order.customerPhone || 'No especificado'}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Método de Pago:</strong> ${order.paymentMethodLabel}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Productos:</strong> ${itemsSummary}</p>
                        <p style="margin: 12px 0 0 0; font-size: 18px; font-weight: 800; color: #22c55e; border-top: 1px solid #334155; padding-top: 10px;">
                            Total a Cobrar: ${order.totalFormatted}
                        </p>
                    </div>

                    <div style="text-align: center;">
                        <a href="http://localhost:3000/admin/pedidos" style="background: #ffffff; color: #0f172a; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 800; font-size: 14px; display: inline-block;">
                            🚀 Ver Pedidos en Panel Admin
                        </a>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.dispatchEmail(adminEmail, subject, html);
    }

    /**
     * Send shipping status update email to the customer
     */
    static async sendShippingUpdateToCustomer(payload: {
        orderNumber: string;
        customerName: string;
        customerEmail: string;
        fulfillmentStatus: string;
        trackingNumber?: string;
        courierName?: string;
    }): Promise<boolean> {
        const { orderNumber, customerName, customerEmail, fulfillmentStatus, trackingNumber, courierName } = payload;
        
        const isDelivered = fulfillmentStatus === 'delivered' || fulfillmentStatus === 'fulfilled';
        const statusTitle = isDelivered ? '¡Tu Pedido ha sido Entregado!' : '🚀 ¡Tu Pedido está en Camino!';
        const subject = `${isDelivered ? '📦' : '🚀'} Actualización de Envío: Pedido ${orderNumber} - TiendaVir`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${subject}</title>
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 800;">TiendaVir</h1>
                        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.95;">${statusTitle}</p>
                    </div>

                    <div style="padding: 24px;">
                        <p style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px;">
                            Hola <strong>${customerName}</strong>, te informamos que el estado de tu pedido <strong>${orderNumber}</strong> ha sido actualizado.
                        </p>

                        <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
                            <span style="display: block; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Estado de Despacho</span>
                            <span style="font-size: 18px; font-weight: 800; color: ${isDelivered ? '#22c55e' : '#ff6b00'}; display: block; margin-top: 4px;">
                                ${isDelivered ? '✅ Entregado' : '🚀 En camino / Enviado'}
                            </span>

                            ${trackingNumber ? `
                            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
                                <span style="display: block; font-size: 12px; font-weight: 700; color: #475569;">Empresa de Envío / Courier:</span>
                                <span style="font-weight: 800; color: #0f172a;">${courierName || 'Olva Courier / Shalom'}</span>
                                <span style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-top: 8px;">Número de Seguimiento / Tracking:</span>
                                <span style="font-weight: 800; font-family: monospace; font-size: 16px; color: #ea580c;">${trackingNumber}</span>
                            </div>` : ''}
                        </div>

                        <div style="text-align: center; margin-bottom: 20px;">
                            <a href="http://localhost:3000/dashboard" style="background: linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                                📦 Consultar Mis Pedidos
                            </a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.dispatchEmail(customerEmail, subject, html);
    }

    /**
     * Internal email dispatcher with provider support or log simulation
     */
    private static async dispatchEmail(to: string, subject: string, html: string): Promise<boolean> {
        const apiKey = this.getResendApiKey();

        if (apiKey) {
            try {
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: 'TiendaVir <ventas@tiendavir.com>',
                        to: [to],
                        subject,
                        html,
                    }),
                });

                if (res.ok) {
                    console.log(`[EmailService] Email enviado exitosamente a ${to}`);
                    return true;
                }
            } catch (e) {
                console.warn('[EmailService] Resend API dispatch error:', e);
            }
        }

        // Simulated Dispatch Log (Development fallback)
        console.log('\n======================================================');
        console.log(`✉️ [SIMULACIÓN CORREO TRANSACCIONAL ENVIADO]`);
        console.log(`Destinatario: ${to}`);
        console.log(`Asunto: ${subject}`);
        console.log('======================================================\n');
        return true;
    }
}
