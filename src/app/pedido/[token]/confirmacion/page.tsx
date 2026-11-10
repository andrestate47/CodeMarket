'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { getOrderByTokenAction, uploadPaymentReceiptAction } from '@/modules/checkout/checkoutSettingsActions';
import styles from './ConfirmationPage.module.css';

function WhatsAppIcon({ size = 22 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0, verticalAlign: 'middle' }}
        >
            <circle cx="16" cy="16" r="16" fill="#25D366" />
            <path
                d="M23.5 8.5C21.5 6.5 18.8 5.4 16 5.4C10.1 5.4 5.4 10.1 5.4 16C5.4 17.9 5.9 19.7 6.8 21.3L5.4 26.6L10.8 25.2C12.3 26 14.1 26.5 16 26.5C21.9 26.5 26.6 21.8 26.6 15.9C26.6 13.1 25.5 10.5 23.5 8.5ZM16 24.7C14.4 24.7 12.8 24.3 11.5 23.5L11.2 23.3L7.9 24.2L8.8 21L8.5 20.6C7.6 19.2 7.2 17.6 7.2 16C7.2 11.1 11.1 7.2 16 7.2C18.4 7.2 20.6 8.1 22.3 9.8C24 11.5 24.9 13.7 24.9 16.1C24.8 20.9 20.9 24.7 16 24.7ZM20.9 18.7C20.6 18.5 19.3 17.9 19 17.8C18.8 17.7 18.6 17.7 18.5 17.9C18.3 18.2 17.8 18.7 17.7 18.9C17.5 19.1 17.4 19.1 17.1 19C16.8 18.8 15.8 18.5 14.7 17.5C13.8 16.7 13.2 15.7 13 15.4C12.8 15.1 13 15 13.1 14.8C13.2 14.7 13.4 14.5 13.5 14.4C13.6 14.2 13.7 14.1 13.7 14C13.8 13.8 13.8 13.7 13.7 13.6C13.6 13.5 13.1 12.3 12.9 11.8C12.7 11.3 12.5 11.4 12.4 11.4H11.9C11.7 11.4 11.5 11.5 11.3 11.7C11.1 11.9 10.5 12.5 10.5 13.7C10.5 14.9 11.4 16.1 11.5 16.2C11.6 16.4 13.2 18.8 15.7 19.9C17.8 20.8 18.2 20.6 18.7 20.6C19.2 20.5 20.2 20 20.4 19.4C20.6 18.8 20.6 18.3 20.5 18.2C20.5 18.8 21.2 18.8 20.9 18.7Z"
                fill="white"
            />
        </svg>
    );
}

interface OrderRecord {
    id: string;
    order_number: string;
    customer_name?: string;
    customer_phone?: string;
    payment_method: string;
    payment_status: string;
    total_formatted: string;
    payment_receipt_url?: string;
    currency: string;
    order_items?: { product_name: string; quantity: number }[];
}

interface OrderDataState {
    success: boolean;
    order: OrderRecord;
    methodConfig?: {
        name?: string;
        instructions?: string;
        number?: string;
        holder?: string;
        qr_url?: string;
        banks?: { bank: string; account: string; cci?: string; holder: string }[];
    } | null;
    whatsappPhone: string;
}

export default function OrderConfirmationPage() {
    const params = useParams();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [orderData, setOrderData] = useState<OrderDataState | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Upload receipt state
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [receiptUploadedUrl, setReceiptUploadedUrl] = useState<string | null>(null);

    useEffect(() => {
        let isCurrent = true;
        (async () => {
            setLoading(true);
            const res = await getOrderByTokenAction(token);
            if (isCurrent) {
                if (res.success && res.order) {
                    setOrderData(res as unknown as OrderDataState);
                    if (res.order.payment_receipt_url) {
                        setReceiptUploadedUrl(res.order.payment_receipt_url);
                    }
                } else {
                    setErrorMsg(res.error || 'No se pudo cargar la información del pedido.');
                }
                setLoading(false);
            }
        })();
        return () => {
            isCurrent = false;
        };
    }, [token]);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`¡${label} copiado al portapapeles!`);
    };

    const handleUploadReceipt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!receiptFile) {
            toast.error('Selecciona un archivo primero.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('receipt_file', receiptFile);

        const res = await uploadPaymentReceiptAction(token, formData);
        setUploading(false);

        if (res.success) {
            toast.success(res.message || 'Comprobante subido con éxito.');
            setOrderData((prev) => (prev ? {
                ...prev,
                order: {
                    ...prev.order,
                    payment_status: 'under_review',
                    payment_receipt_url: res.receiptUrl
                }
            } : null));
        } else {
            toast.error(res.error || 'Error al subir el comprobante.');
        }
    };

    if (loading) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
                    <h2>Cargando información del pedido...</h2>
                </div>
            </div>
        );
    }

    if (errorMsg || !orderData) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px' }}>
                    <div className={styles.card}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                        <h2 className={styles.title}>Pedido No Encontrado</h2>
                        <p className={styles.subtitle}>{errorMsg || 'Verifica el enlace proporcionado.'}</p>
                        <Link href="/" className={styles.homeBtn}>
                            Volver a la Tienda
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const { order, methodConfig, whatsappPhone } = orderData;
    const isQuote = order.payment_method === 'quote_request';

    const getPaymentStatusBadge = () => {
        if (order.payment_status === 'paid') {
            return <span className={`${styles.statusTag} ${styles.statusPaid}`}>✓ Pagado</span>;
        }
        if (order.payment_status === 'under_review') {
            return <span className={`${styles.statusTag} ${styles.statusUnderReview}`}>🔎 En Revisión</span>;
        }
        return <span className={`${styles.statusTag} ${styles.statusPending}`}>⏳ Pago Pendiente</span>;
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.headerIcon}>{isQuote ? '📋' : '🎉'}</div>
                    <h1 className={styles.title}>
                        {isQuote ? '¡Solicitud de Cotización Recibida!' : '¡Pedido Recibido!'}
                    </h1>
                    <p className={styles.subtitle}>
                        {isQuote
                            ? 'Hemos registrado tu solicitud. Nuestro equipo revisará los detalles y te responderá en breve.'
                            : '¡Tu pedido ya fue registrado! A continuación encontrarás los datos e instrucciones para realizar el pago de tu compra.'}
                    </p>

                    <div className={styles.orderBadgeRow}>
                        <div className={styles.orderNumberTag}>
                            <span className={styles.orderNumberLabel}>Número:</span>
                            <span className={styles.orderNumberValue}>{order.order_number}</span>
                        </div>
                        {getPaymentStatusBadge()}
                    </div>

                    {/* INSTRUCCIONES DE PAGO */}
                    {!isQuote && (
                        <div className={styles.paymentBox}>
                            <h3 className={styles.paymentBoxTitle}>
                                <span>💳</span> Método Seleccionado: {methodConfig?.name || order.payment_method.toUpperCase()}
                            </h3>

                            <p className={styles.paymentTotalRow}>
                                Total a pagar: <strong className={styles.paymentTotalAmount}>{order.total_formatted}</strong>
                            </p>

                            {/* YAPE / PLIN Instructions */}
                            {(order.payment_method === 'yape' || order.payment_method === 'plin') && (
                                <div>
                                    <p className={styles.paymentInstructions}>
                                        {methodConfig?.instructions || 'Realiza la transferencia por la aplicación móvil usando los datos especificados.'}
                                    </p>
                                    <div className={styles.qrContainer}>
                                        {methodConfig?.qr_url && (
                                            <div className={styles.qrImage}>
                                                <Image
                                                    src={methodConfig.qr_url}
                                                    alt="QR de Pago"
                                                    width={140}
                                                    height={140}
                                                    style={{ objectFit: 'contain' }}
                                                />
                                            </div>
                                        )}
                                        <div className={styles.paymentMetaList}>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Número {methodConfig?.name || 'Yape'}:</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <strong className={styles.metaValue}>{methodConfig?.number || '+51 999 999 999'}</strong>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(methodConfig?.number || '+51999999999', 'Número')}
                                                        className={styles.copyBtn}
                                                    >
                                                        Copiar
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Titular:</span>
                                                <strong className={styles.metaValue}>{methodConfig?.holder || 'CodeMarket Perú'}</strong>
                                            </div>

                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Concepto / Nota:</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <strong className={styles.orderNumberValue}>{order.order_number}</strong>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(order.order_number, 'Número de pedido')}
                                                        className={styles.copyBtn}
                                                    >
                                                        Copiar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* BANK TRANSFER Instructions */}
                            {order.payment_method === 'bank_transfer' && (
                                <div>
                                    <p className={styles.paymentInstructions}>
                                        {methodConfig?.instructions || 'Transfiere a cualquiera de nuestras cuentas e incluye tu número de pedido en la glosa.'}
                                    </p>
                                    <div className={styles.banksGrid}>
                                        {(methodConfig?.banks || [
                                            { bank: 'BCP', account: '193-0000000-0-00', cci: '002-193-000000000000-00', holder: 'CodeMarket S.A.C.' },
                                            { bank: 'BBVA', account: '0011-0000-00000000-00', cci: '011-000-000000000000-00', holder: 'CodeMarket S.A.C.' }
                                        ]).map((b: { bank: string; account: string; cci?: string; holder: string }, idx: number) => (
                                            <div key={idx} className={styles.bankCard}>
                                                <div className={styles.bankName}>Banco {b.bank}</div>
                                                <div className={styles.bankDetails}>
                                                    <div>Cuenta: <strong>{b.account}</strong></div>
                                                    {b.cci && <div>CCI: <strong style={{ fontSize: '0.8rem' }}>{b.cci}</strong></div>}
                                                    <div>Titular: {b.holder}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(b.account, `Cuenta ${b.bank}`)}
                                                    className={styles.copyBtn}
                                                    style={{ marginTop: '10px', width: '100%' }}
                                                >
                                                    Copiar Cuenta {b.bank}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CASH ON DELIVERY Instructions */}
                            {order.payment_method === 'cash_on_delivery' && (
                                <div>
                                    <p style={{ fontSize: '0.94rem', color: 'var(--foreground)', margin: 0, lineHeight: 1.6 }}>
                                        🛵 <strong>Pago contra entrega confirmado.</strong> Nuestro repartidor llevará tu pedido a la dirección indicada. Recuerda tener listo el monto exacto de <strong style={{ color: 'var(--robotina-orange)' }}>{order.total_formatted}</strong> en efectivo o pagar con tarjeta mediante POS móvil.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* RECEIPT UPLOAD SECTION */}
                    {!isQuote && order.payment_method !== 'cash_on_delivery' && (
                        <div className={styles.receiptSection}>
                            <h4 className={styles.receiptTitle}>📎 Adjuntar Comprobante de Pago</h4>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                                Si ya realizaste la transferencia o Yape, sube aquí una captura de pantalla o foto del comprobante para acelerar la verificación.
                            </p>

                            {receiptUploadedUrl ? (
                                <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '10px', color: '#22c55e', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    ✓ Comprobante subido correctamente. Tu pago está en revisión administrativa.
                                </div>
                            ) : (
                                <form onSubmit={handleUploadReceipt} className={styles.receiptForm}>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,application/pdf"
                                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                        className={styles.fileInput}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={uploading || !receiptFile}
                                        className={styles.uploadBtn}
                                    >
                                        {uploading ? 'Subiendo comprobante...' : 'Subir Comprobante'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* WHATSAPP AUTOMATIC AFFILIATION CARD */}
                    {(() => {
                        const cleanPhone = whatsappPhone.replace(/[^0-9]/g, '');
                        const itemsSummary = order.order_items && order.order_items.length > 0
                            ? order.order_items.map(i => `${i.product_name} (x${i.quantity})`).join(', ')
                            : 'Productos varios';

                        const messageText = `Hola TiendaVir, acabo de registrar mi pedido en la web y deseo continuar con mi compra:\n\n` +
                            `📋 *Pedido:* ${order.order_number}\n` +
                            `👤 *Cliente:* ${order.customer_name || 'Cliente'}\n` +
                            `📱 *Teléfono:* ${order.customer_phone || 'No especificado'}\n` +
                            `📦 *Productos:* ${itemsSummary}\n` +
                            `💵 *Total:* ${order.total_formatted}\n` +
                            `💳 *Método de Pago:* ${methodConfig?.name || order.payment_method.toUpperCase()}\n\n` +
                            (receiptUploadedUrl
                                ? `✅ Ya adjunté mi comprobante de pago en la web para proceder con la entrega. ¡Muchas gracias!`
                                : `Quedo atento(a) para coordinar el pago y la entrega de mi pedido. ¡Muchas gracias!`);

                        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

                        return (
                            <div style={{
                                marginTop: '24px',
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.04) 100%)',
                                border: '1.5px solid rgba(34, 197, 94, 0.35)',
                                borderRadius: '16px',
                                padding: '20px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                    Atención directa
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                                    <WhatsAppIcon size={46} />
                                </div>
                                <h3 style={{ margin: '0 0 16px 0', color: '#15803d', fontSize: '1.15rem', fontWeight: 900 }}>
                                    ¿Prefieres continuar tu compra por WhatsApp?
                                </h3>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.whatsappBtn}
                                        style={{
                                            background: '#25D366',
                                            color: '#ffffff',
                                            fontWeight: 800,
                                            padding: '12px 24px',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            fontSize: '0.95rem',
                                        }}
                                    >
                                        <WhatsAppIcon size={22} />
                                        <span>Continuar compra por WhatsApp</span>
                                    </a>

                                    <Link href="/" className={styles.homeBtn}>
                                        ← Volver a la Tienda
                                    </Link>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
