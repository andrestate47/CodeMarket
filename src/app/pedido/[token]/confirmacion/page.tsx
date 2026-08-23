'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { getOrderByTokenAction, uploadPaymentReceiptAction } from '@/modules/checkout/checkoutSettingsActions';
import styles from './ConfirmationPage.module.css';

interface OrderRecord {
    id: string;
    order_number: string;
    payment_method: string;
    payment_status: string;
    total_formatted: string;
    payment_receipt_url?: string;
    currency: string;
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
                            : 'Tu pedido ha sido registrado en el sistema. A continuación encontrarás las instrucciones para completar tu pago.'}
                    </p>

                    <div className={styles.orderBadgeRow}>
                        <div className={styles.orderNumberTag}>
                            Número: {order.order_number}
                        </div>
                        {getPaymentStatusBadge()}
                    </div>

                    {/* Instruction Box by Payment Method */}
                    {!isQuote && (
                        <div className={styles.paymentBox}>
                            <h3 className={styles.paymentBoxTitle}>
                                <span>💳</span> Método Seleccionado: {methodConfig?.name || order.payment_method.toUpperCase()}
                            </h3>

                            <p style={{ margin: '0 0 16px 0', fontSize: '0.92rem', color: '#ccc', lineHeight: '1.5' }}>
                                Total a pagar: <strong style={{ color: 'var(--robotina-orange)', fontSize: '1.1rem' }}>{order.total_formatted}</strong>
                            </p>

                            {/* YAPE / PLIN Instructions */}
                            {(order.payment_method === 'yape' || order.payment_method === 'plin') && (
                                <div>
                                    <p style={{ fontSize: '0.9rem', color: '#bbb', marginBottom: '14px' }}>
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
                                                <span>Número {methodConfig?.name || 'Yape'}:</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <strong>{methodConfig?.number || '+51 999 999 999'}</strong>
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
                                                <span>Titular:</span>
                                                <strong>{methodConfig?.holder || 'CodeMarket Perú'}</strong>
                                            </div>

                                            <div className={styles.metaItem}>
                                                <span>Concepto / Nota:</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <strong style={{ color: 'var(--robotina-orange)' }}>{order.order_number}</strong>
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
                                    <p style={{ fontSize: '0.9rem', color: '#bbb', marginBottom: '14px' }}>
                                        {methodConfig?.instructions || 'Transfiere a cualquiera de nuestras cuentas e incluye tu número de pedido en la glosa.'}
                                    </p>
                                    <div className={styles.banksGrid}>
                                        {(methodConfig?.banks || [
                                            { bank: 'BCP', account: '193-0000000-0-00', cci: '002-193-000000000000-00', holder: 'CodeMarket S.A.C.' },
                                            { bank: 'BBVA', account: '0011-0000-00000000-00', cci: '011-000-000000000000-00', holder: 'CodeMarket S.A.C.' }
                                        ]).map((b: { bank: string; account: string; cci?: string; holder: string }, idx: number) => (
                                            <div key={idx} className={styles.bankCard}>
                                                <div className={styles.bankName}>Banco {b.bank}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#ccc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                                    <p style={{ fontSize: '0.92rem', color: '#ddd', margin: 0, lineHeight: 1.6 }}>
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

                    <div className={styles.actionsRow}>
                        <Link href="/" className={styles.homeBtn}>
                            ← Volver a la Tienda
                        </Link>
                        <a
                            href={`https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}?text=Hola,%20tengo%20una%20consulta%20sobre%20mi%20pedido%20${order.order_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.whatsappBtn}
                        >
                            <span>💬 Contactar por WhatsApp</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
