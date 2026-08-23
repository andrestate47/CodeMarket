'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/money';
import { OrderRecord, OrderItemRecord, getSingleOrderAction } from '@/modules/orders/actions';

export default function PrintOrderPage() {
    const params = useParams();
    const orderId = params?.id as string;

    const [order, setOrder] = useState<OrderRecord | null>(null);
    const [items, setItems] = useState<OrderItemRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (!orderId) return;
            setLoading(true);

            const res = await getSingleOrderAction(orderId);

            if (res.success && res.order && isMounted) {
                setOrder(res.order);
                setItems(res.items || []);
                setLoading(false);

                // Trigger print automatically once rendered
                setTimeout(() => {
                    window.print();
                }, 500);
            } else if (isMounted) {
                setLoading(false);
            }
        })();

        return () => { isMounted = false; };
    }, [orderId]);

    if (loading || !order) {
        return <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>Cargando pedido para impresión...</div>;
    }

    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '40px 20px',
            fontFamily: 'Arial, Helvetica, sans-serif',
            color: '#111827',
            background: 'white'
        }}>
            {/* PRINT HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111827', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#ea580c' }}>CodeMarket</h1>
                    <div style={{ fontSize: '13px', color: '#4b5563' }}>Comprobante de Pedido & Hoja de Despacho</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>PEDIDO #{order.order_number}</h2>
                    <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                        Fecha: {new Date(order.created_at).toLocaleString('es-PE')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px' }}>
                        Canal: <strong style={{ textTransform: 'capitalize' }}>{order.source || 'Tienda Online'}</strong>
                    </div>
                </div>
            </div>

            {/* TWO COLUMN CUSTOMER & SHIPPING INFO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 8px 0' }}>Datos del Cliente</h3>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{order.customer_name}</div>
                    <div style={{ fontSize: '13px', color: '#374151' }}>Correo: {order.customer_email}</div>
                    <div style={{ fontSize: '13px', color: '#374151' }}>Teléfono: {order.customer_phone || 'N/A'}</div>
                </div>

                <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 8px 0' }}>Dirección de Entrega</h3>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Receptor: {order.recipient_name || order.customer_name}</div>
                    <div style={{ fontSize: '13px', color: '#374151' }}>{order.shipping_address_line || 'Recojo en tienda'}</div>
                    <div style={{ fontSize: '13px', color: '#374151' }}>{order.shipping_district || ''} {order.shipping_province ? `• ${order.shipping_province}` : ''}</div>
                    {order.shipping_reference && (
                        <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px' }}>
                            Ref: {order.shipping_reference}
                        </div>
                    )}
                </div>
            </div>

            {/* PRODUCTS TABLE */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f3f4f6', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Producto</th>
                        <th style={{ padding: '10px' }}>SKU</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Precio Unit.</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Cant.</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {(item.image_url || item.image) && (
                                        <img
                                            src={item.image_url || item.image}
                                            alt={item.product_name}
                                            style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e5e7eb', flexShrink: 0 }}
                                        />
                                    )}
                                    <div>
                                        <strong>{item.product_name}</strong>
                                        {item.variant_name && <div style={{ fontSize: '11px', color: '#6b7280' }}>Variante: {item.variant_name}</div>}
                                    </div>
                                </div>
                            </td>
                            <td style={{ padding: '10px', color: '#6b7280' }}>{item.sku || '—'}</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>{formatMoney(item.unit_price_amount)}</td>
                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(item.total_amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* TOTALS & SUMMARY */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '50%' }}>
                    {order.customer_notes && (
                        <div style={{ background: '#fffbebf', border: '1px solid #fef3c7', padding: '12px', borderRadius: '6px' }}>
                            <strong style={{ fontSize: '12px', color: '#92400e', display: 'block' }}>Instrucciones del cliente:</strong>
                            <span style={{ fontSize: '13px', color: '#78350f' }}>&quot;{order.customer_notes}&quot;</span>
                        </div>
                    )}
                </div>

                <div style={{ width: '240px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#4b5563' }}>
                        <span>Subtotal:</span>
                        <span>{formatMoney(order.subtotal_amount)}</span>
                    </div>
                    {order.discount_amount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#dc2626' }}>
                            <span>Descuento:</span>
                            <span>-{formatMoney(order.discount_amount)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#4b5563' }}>
                        <span>Envío:</span>
                        <span>{formatMoney(order.shipping_amount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 'bold', fontSize: '16px', borderTop: '2px solid #111827', marginTop: '6px' }}>
                        <span>TOTAL:</span>
                        <span>{formatMoney(order.total_amount, order.currency)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#059669', fontWeight: 'bold' }}>
                        <span>Estado de Pago:</span>
                        <span style={{ textTransform: 'uppercase' }}>{order.payment_status || 'PENDIENTE'}</span>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>
                ¡Gracias por tu compra en CodeMarket! • www.codemarket.pe
            </div>
        </div>
    );
}
