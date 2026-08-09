'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatMoney, parseMoneyToCents } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { createManualOrderAction } from '@/modules/orders/actions';

interface CustomerOption {
    id: string;
    name: string;
    email: string;
    phone?: string;
    document_type?: string;
    document_number?: string;
}

interface ProductVariantOption {
    id: string;
    name: string;
    sku?: string;
    price_amount: number;
    stock_quantity: number;
}

interface ProductSearchResult {
    id: string;
    name: string;
    sku?: string;
    price_amount: number; // in cents
    stock_quantity: number;
    track_inventory: boolean;
    product_variants?: ProductVariantOption[];
}

interface SelectedOrderItem {
    productId: string;
    variantId?: string;
    productName: string;
    variantName?: string;
    sku?: string;
    originalUnitPriceAmount: number; // in cents
    unitPriceAmount: number; // in cents
    priceAdjustmentReason?: string;
    quantity: number;
    availableStock: number;
}

export default function NewManualOrderPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // STEP 1: CUSTOMER STATE
    const [customerMode, setCustomerMode] = useState<'search' | 'new' | 'guest'>('search');
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerResults, setCustomerResults] = useState<CustomerOption[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

    // Guest / New Customer Form
    const [custName, setCustName] = useState('');
    const [custEmail, setCustEmail] = useState('');
    const [custPhone, setCustPhone] = useState('');
    const [custDocType, setCustDocType] = useState('DNI');
    const [custDocNum, setCustDocNum] = useState('');

    // STEP 2: CHANNEL / SOURCE
    const [source, setSource] = useState<'online_store' | 'manual' | 'whatsapp' | 'instagram' | 'facebook' | 'phone' | 'pos' | 'other'>('whatsapp');
    const [sourceReference, setSourceReference] = useState('');

    // STEP 3: PRODUCTS & VARIANTS
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
    const [selectedItems, setSelectedItems] = useState<SelectedOrderItem[]>([]);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);

    // STEP 4: DISCOUNTS
    const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
    const [discountValue, setDiscountValue] = useState<string>('0');

    // STEP 5: SHIPPING
    const [deliveryType, setDeliveryType] = useState<'pickup' | 'local_delivery' | 'national_shipping' | 'none'>('local_delivery');
    const [shippingMethodName, setShippingMethodName] = useState('Delivery Express');
    const [shippingFeeInput, setShippingFeeInput] = useState<string>('10.00');
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [shippingDepartment, setShippingDepartment] = useState('Lima');
    const [shippingProvince, setShippingProvince] = useState('Lima');
    const [shippingDistrict, setShippingDistrict] = useState('Miraflores');
    const [shippingAddressLine, setShippingAddressLine] = useState('');
    const [shippingReference, setShippingReference] = useState('');

    // STEP 6: PAYMENT METHOD & INITIAL STATUS
    const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin' | 'bank_transfer' | 'cash_on_delivery' | 'external_payment_link' | 'cash' | 'other'>('yape');
    const [initialPaymentStatus, setInitialPaymentStatus] = useState<'pending' | 'paid'>('pending');

    // NOTES
    const [customerNotes, setCustomerNotes] = useState('');
    const [internalNotes, setInternalNotes] = useState('');

    // ERRORS & TOAST
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Customer search debounce
    useEffect(() => {
        if (!customerSearchQuery.trim() || customerMode !== 'search') {
            return;
        }

        const handler = setTimeout(async () => {
            const { data } = await supabase
                .from('customers')
                .select('*')
                .or(`name.ilike.%${customerSearchQuery}%,email.ilike.%${customerSearchQuery}%,phone.ilike.%${customerSearchQuery}%`)
                .limit(5);

            setCustomerResults(data || []);
        }, 300);

        return () => clearTimeout(handler);
    }, [customerSearchQuery, customerMode]);

    // Product search debounce
    useEffect(() => {
        if (!productSearchQuery.trim()) {
            return;
        }

        const handler = setTimeout(async () => {
            setIsSearchingProducts(true);
            const { data: prods } = await supabase
                .from('products')
                .select(`
                    id, name, sku, price_amount, stock_quantity, track_inventory,
                    product_variants (id, name, sku, price_amount, stock_quantity)
                `)
                .eq('status', 'active')
                .or(`name.ilike.%${productSearchQuery}%,sku.ilike.%${productSearchQuery}%`)
                .limit(8);

            setProductResults(prods || []);
            setIsSearchingProducts(false);
        }, 300);

        return () => clearTimeout(handler);
    }, [productSearchQuery]);

    // Select customer handler
    const handleSelectCustomer = (c: CustomerOption) => {
        setSelectedCustomer(c);
        setCustName(c.name);
        setCustEmail(c.email);
        setCustPhone(c.phone || '');
        setCustDocType(c.document_type || 'DNI');
        setCustDocNum(c.document_number || '');
        setCustomerResults([]);
    };

    // Add Product / Variant to Order
    const handleAddProduct = (prod: ProductSearchResult, variant?: ProductVariantOption) => {
        const variantId = variant?.id;
        const productName = prod.name;
        const variantName = variant?.name;
        const sku = variant?.sku || prod.sku;
        const basePriceCents = variant ? variant.price_amount : prod.price_amount;
        const availableStock = variant ? variant.stock_quantity : prod.stock_quantity;

        // Check if item already in order
        const existingIndex = selectedItems.findIndex(
            i => i.productId === prod.id && i.variantId === variantId
        );

        if (existingIndex >= 0) {
            const updated = [...selectedItems];
            updated[existingIndex].quantity += 1;
            setSelectedItems(updated);
        } else {
            setSelectedItems(prev => [
                ...prev,
                {
                    productId: prod.id,
                    variantId,
                    productName,
                    variantName,
                    sku,
                    originalUnitPriceAmount: basePriceCents,
                    unitPriceAmount: basePriceCents,
                    quantity: 1,
                    availableStock,
                },
            ]);
        }

        setProductSearchQuery('');
        setProductResults([]);
    };

    const handleQuantityChange = (index: number, delta: number) => {
        setSelectedItems(prev => {
            const copy = [...prev];
            const newQty = copy[index].quantity + delta;
            if (newQty <= 0) {
                return copy.filter((_, i) => i !== index);
            }
            copy[index].quantity = newQty;
            return copy;
        });
    };

    const handlePriceAdjustment = (index: number, newPriceSoles: string, reason: string) => {
        const newCents = parseMoneyToCents(newPriceSoles);
        setSelectedItems(prev => {
            const copy = [...prev];
            copy[index].unitPriceAmount = newCents;
            copy[index].priceAdjustmentReason = reason;
            return copy;
        });
    };

    // Calculations
    const subtotalCents = selectedItems.reduce((acc, item) => acc + (item.unitPriceAmount * item.quantity), 0);

    let discountCents = 0;
    if (discountType === 'percentage') {
        const val = parseFloat(discountValue) || 0;
        discountCents = Math.round((subtotalCents * val) / 100);
    } else if (discountType === 'fixed') {
        discountCents = parseMoneyToCents(discountValue);
    }

    const shippingCents = deliveryType === 'pickup' || deliveryType === 'none' ? 0 : parseMoneyToCents(shippingFeeInput);
    const totalCents = Math.max(0, subtotalCents + shippingCents - discountCents);

    // Submit Order
    const handleSubmit = () => {
        setErrorMessage(null);

        if (!custName.trim() || !custEmail.trim()) {
            setErrorMessage('Por favor ingrese el nombre y correo del cliente.');
            return;
        }

        if (selectedItems.length === 0) {
            setErrorMessage('Debe agregar al menos un producto al pedido.');
            return;
        }

        startTransition(async () => {
            const payload = {
                customerId: selectedCustomer?.id,
                customerName: custName.trim(),
                customerEmail: custEmail.trim(),
                customerPhone: custPhone.trim(),
                documentType: custDocType,
                documentNumber: custDocNum.trim(),
                source,
                sourceReference: sourceReference.trim(),
                deliveryType,
                shippingMethodName: deliveryType === 'pickup' ? 'Recojo en tienda' : shippingMethodName,
                shippingAmount: shippingCents,
                recipientName: recipientName.trim() || custName.trim(),
                recipientPhone: recipientPhone.trim() || custPhone.trim(),
                shippingDepartment,
                shippingProvince,
                shippingDistrict,
                shippingAddressLine,
                shippingReference,
                discountType: discountType === 'none' ? undefined : discountType,
                discountValue: parseFloat(discountValue) || 0,
                paymentMethod,
                initialPaymentStatus,
                initialOrderStatus: 'confirmed' as const,
                customerNotes: customerNotes.trim(),
                internalNotes: internalNotes.trim(),
                items: selectedItems,
            };

            const res = await createManualOrderAction(payload);
            if (res.success && res.orderId) {
                router.push(`/admin/pedidos/${res.orderId}`);
            } else {
                setErrorMessage(res.error || 'Error al crear el pedido.');
            }
        });
    };

    return (
        <div>
            <AdminPageHeader
                title="Crear Pedido Manual"
                description="Registra una venta asistida desde WhatsApp, teléfono, presencial u otros canales."
                action={
                    <Link
                        href="/admin/pedidos"
                        style={{
                            padding: '8px 14px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            fontWeight: 600,
                        }}
                    >
                        ← Cancelar
                    </Link>
                }
            />

            {errorMessage && (
                <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '12px', color: '#f87171', marginBottom: '20px', fontWeight: 600 }}>
                    ⚠️ {errorMessage}
                </div>
            )}

            {/* MAIN TWO COLUMN POS LAYOUT */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '24px', alignItems: 'start' }}>
                {/* LEFT COLUMN — FORM SECTIONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* SECTION 1: CLIENTE */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            👤 1. Información del Cliente
                        </h3>

                        {/* Customer Mode Tabs */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <button
                                type="button"
                                onClick={() => { setCustomerMode('search'); setSelectedCustomer(null); }}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: customerMode === 'search' ? '1px solid var(--robotina-orange)' : '1px solid var(--glass-border)',
                                    background: customerMode === 'search' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                    color: customerMode === 'search' ? '#f97316' : '#a1a1aa',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                🔍 Buscar Existente
                            </button>
                            <button
                                type="button"
                                onClick={() => { setCustomerMode('new'); setSelectedCustomer(null); }}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: customerMode === 'new' ? '1px solid var(--robotina-orange)' : '1px solid var(--glass-border)',
                                    background: customerMode === 'new' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                    color: customerMode === 'new' ? '#f97316' : '#a1a1aa',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                + Crear Nuevo Cliente
                            </button>
                            <button
                                type="button"
                                onClick={() => { setCustomerMode('guest'); setSelectedCustomer(null); setCustName('Cliente Sin Registrar'); setCustEmail('invitado@codemarket.pe'); }}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: customerMode === 'guest' ? '1px solid var(--robotina-orange)' : '1px solid var(--glass-border)',
                                    background: customerMode === 'guest' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                    color: customerMode === 'guest' ? '#f97316' : '#a1a1aa',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                ⚡ Cliente Sin Registrar
                            </button>
                        </div>

                        {/* Mode: Search */}
                        {customerMode === 'search' && (
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={customerSearchQuery}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setCustomerSearchQuery(val);
                                        if (!val.trim()) setCustomerResults([]);
                                    }}
                                    placeholder="Buscar cliente por nombre, correo o teléfono..."
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--input-bg)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '0.88rem',
                                    }}
                                />

                                {customerResults.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                        background: '#18181b', border: '1px solid var(--glass-border)', borderRadius: '8px', marginTop: '4px',
                                        maxHeight: '200px', overflowY: 'auto'
                                    }}>
                                        {customerResults.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => handleSelectCustomer(c)}
                                                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                            >
                                                <div style={{ fontWeight: 700, color: 'white' }}>{c.name}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>{c.email} • {c.phone || 'Sin tel'}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Form Fields for Selected / New / Guest */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Nombre completo *</label>
                                <input
                                    type="text"
                                    value={custName}
                                    onChange={e => setCustName(e.target.value)}
                                    style={{ width: '100%', padding: '9px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Correo Electrónico *</label>
                                <input
                                    type="email"
                                    value={custEmail}
                                    onChange={e => setCustEmail(e.target.value)}
                                    style={{ width: '100%', padding: '9px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Teléfono (WhatsApp)</label>
                                <input
                                    type="text"
                                    value={custPhone}
                                    onChange={e => setCustPhone(e.target.value)}
                                    placeholder="+51 999 000 000"
                                    style={{ width: '100%', padding: '9px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Documento (DNI / RUC)</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <select
                                        value={custDocType}
                                        onChange={e => setCustDocType(e.target.value)}
                                        style={{ padding: '9px 8px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', fontSize: '0.8rem' }}
                                    >
                                        <option value="DNI">DNI</option>
                                        <option value="RUC">RUC</option>
                                        <option value="CE">CE</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={custDocNum}
                                        onChange={e => setCustDocNum(e.target.value)}
                                        placeholder="Número..."
                                        style={{ flex: 1, padding: '9px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: CANAL DE ORIGEN */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '14px' }}>
                            📢 2. Canal de Origen del Pedido
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Seleccionar Canal *</label>
                                <select
                                    value={source}
                                    onChange={e => setSource(e.target.value as 'online_store' | 'manual' | 'whatsapp' | 'instagram' | 'facebook' | 'phone' | 'pos' | 'other')}
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                >
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="phone">Teléfono</option>
                                    <option value="pos">Venta Presencial (POS)</option>
                                    <option value="online_store">Tienda Online</option>
                                    <option value="manual">Manual / Interno</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Referencia de Canal (Opcional)</label>
                                <input
                                    type="text"
                                    value={sourceReference}
                                    onChange={e => setSourceReference(e.target.value)}
                                    placeholder="Ej: +51 999 000 000 o @usuario_ig"
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: PRODUCTOS Y VARIANTES */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '14px' }}>
                            🛒 3. Selección de Productos y Variantes
                        </h3>

                        {/* Search Product Input */}
                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <input
                                type="text"
                                value={productSearchQuery}
                                onChange={e => {
                                    const val = e.target.value;
                                    setProductSearchQuery(val);
                                    if (!val.trim()) setProductResults([]);
                                }}
                                placeholder="Buscar por nombre de producto o SKU..."
                                style={{ width: '100%', padding: '11px 14px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white' }}
                            />
                            {isSearchingProducts && (
                                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#a1a1aa' }}>
                                    Cargando...
                                </span>
                            )}

                            {productResults.length > 0 && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                                    background: '#18181b', border: '1px solid var(--glass-border)', borderRadius: '10px', marginTop: '6px',
                                    maxHeight: '260px', overflowY: 'auto', boxShadow: '0 12px 30px rgba(0,0,0,0.7)'
                                }}>
                                    {productResults.map(p => (
                                        <div key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            {/* Product Item */}
                                            <div
                                                onClick={() => handleAddProduct(p)}
                                                style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'white' }}>{p.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>SKU: {p.sku || 'N/A'} • Stock: {p.stock_quantity}</div>
                                                </div>
                                                <div style={{ fontWeight: 800, color: '#4ade80' }}>
                                                    {formatMoney(p.price_amount)}
                                                </div>
                                            </div>

                                            {/* Variants if any */}
                                            {p.product_variants && p.product_variants.length > 0 && (
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 14px 10px 24px' }}>
                                                    <span style={{ fontSize: '0.72rem', color: '#71717a' }}>Variantes:</span>
                                                    {p.product_variants.map(v => (
                                                        <div
                                                            key={v.id}
                                                            onClick={() => handleAddProduct(p, v)}
                                                            style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', marginTop: '4px' }}
                                                        >
                                                            <span style={{ fontSize: '0.8rem', color: '#e4e4e7' }}>↳ {v.name}</span>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4ade80' }}>{formatMoney(v.price_amount)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Items Table */}
                        {selectedItems.length === 0 ? (
                            <div style={{ padding: '24px', color: '#71717a', textAlign: 'center', border: '1px dashed var(--glass-border)', borderRadius: '10px' }}>
                                No has agregado ningún producto al pedido. Usa el buscador arriba.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {selectedItems.map((item, idx) => (
                                    <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, color: 'white' }}>{item.productName}</div>
                                            {item.variantName && <div style={{ fontSize: '0.78rem', color: '#60a5fa' }}>Variante: {item.variantName}</div>}
                                            {item.sku && <div style={{ fontSize: '0.75rem', color: '#71717a' }}>SKU: {item.sku}</div>}
                                        </div>

                                        {/* Unit Price & Adjustment */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                            <div style={{ fontWeight: 800, color: '#4ade80' }}>
                                                {formatMoney(item.unitPriceAmount)}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Ajustar precio..."
                                                onBlur={(e) => {
                                                    if (e.target.value) {
                                                        const reason = prompt('Razón del ajuste de precio (Ej: Mayorista, Promoción):');
                                                        if (reason) handlePriceAdjustment(idx, e.target.value, reason);
                                                    }
                                                }}
                                                style={{ width: '90px', padding: '3px 6px', fontSize: '0.75rem', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'white', textAlign: 'right' }}
                                            />
                                        </div>

                                        {/* Quantity Controls */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '6px' }}>
                                            <button type="button" onClick={() => handleQuantityChange(idx, -1)} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer' }}>-</button>
                                            <span style={{ fontWeight: 700, color: 'white', minWidth: '18px', textAlign: 'center' }}>{item.quantity}</span>
                                            <button type="button" onClick={() => handleQuantityChange(idx, 1)} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer' }}>+</button>
                                        </div>

                                        {/* Subtotal Item */}
                                        <div style={{ fontWeight: 800, color: 'white', minWidth: '80px', textAlign: 'right' }}>
                                            {formatMoney(item.unitPriceAmount * item.quantity)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: DESCUENTOS Y ENVÍO */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '14px' }}>
                            🚚 4. Envío y Descuentos
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Tipo de Entrega *</label>
                                <select
                                    value={deliveryType}
                                    onChange={e => setDeliveryType(e.target.value as 'pickup' | 'local_delivery' | 'national_shipping' | 'none')}
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                >
                                    <option value="local_delivery">Delivery Local</option>
                                    <option value="national_shipping">Envío Nacional</option>
                                    <option value="pickup">Recojo en Tienda</option>
                                    <option value="none">Sin Envío</option>
                                </select>
                            </div>

                            {deliveryType !== 'pickup' && deliveryType !== 'none' && (
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Costo de Envío (S/)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={shippingFeeInput}
                                        onChange={e => setShippingFeeInput(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Shipping Address Inputs if required */}
                        {deliveryType !== 'pickup' && deliveryType !== 'none' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '12px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Nombre del Destinatario</label>
                                    <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Nombre del receptor" style={{ width: '100%', padding: '7px 10px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Teléfono Destinatario</label>
                                    <input type="text" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder="Teléfono de entrega" style={{ width: '100%', padding: '7px 10px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Método / Empresa Envío</label>
                                    <input type="text" value={shippingMethodName} onChange={e => setShippingMethodName(e.target.value)} placeholder="Ej: Olva, Shalom, Express" style={{ width: '100%', padding: '7px 10px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Departamento</label>
                                    <input type="text" value={shippingDepartment} onChange={e => setShippingDepartment(e.target.value)} style={{ width: '100%', padding: '7px 10px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Provincia</label>
                                    <input type="text" value={shippingProvince} onChange={e => setShippingProvince(e.target.value)} style={{ width: '100%', padding: '7px 10px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Distrito</label>
                                    <input type="text" value={shippingDistrict} onChange={e => setShippingDistrict(e.target.value)} style={{ width: '100%', padding: '7px 10px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Dirección de Entrega</label>
                                    <input type="text" value={shippingAddressLine} onChange={e => setShippingAddressLine(e.target.value)} placeholder="Av. Principal 123, Dpto 402" style={{ width: '100%', padding: '7px 10px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>Referencia</label>
                                    <input type="text" value={shippingReference} onChange={e => setShippingReference(e.target.value)} placeholder="Frente al parque..." style={{ width: '100%', padding: '7px 10px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
                                </div>
                            </div>
                        )}

                        {/* Discounts */}
                        <div style={{ marginTop: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '14px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', display: 'block', marginBottom: '8px' }}>Descuento General del Pedido</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select
                                    value={discountType}
                                    onChange={e => setDiscountType(e.target.value as 'none' | 'percentage' | 'fixed')}
                                    style={{ padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                >
                                    <option value="none">Sin Descuento</option>
                                    <option value="percentage">Porcentaje (%)</option>
                                    <option value="fixed">Monto Fijo (S/)</option>
                                </select>
                                {discountType !== 'none' && (
                                    <input
                                        type="number"
                                        value={discountValue}
                                        onChange={e => setDiscountValue(e.target.value)}
                                        placeholder={discountType === 'percentage' ? '%' : 'S/'}
                                        style={{ width: '120px', padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: PAGO Y NOTAS */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '14px' }}>
                            💳 5. Método de Pago y Notas
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Método de Pago *</label>
                                <select
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value as 'yape' | 'plin' | 'bank_transfer' | 'cash_on_delivery' | 'external_payment_link' | 'cash' | 'other')}
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                >
                                    <option value="yape">Yape</option>
                                    <option value="plin">Plin</option>
                                    <option value="bank_transfer">Transferencia Bancaria</option>
                                    <option value="cash_on_delivery">Pago contra entrega</option>
                                    <option value="cash">Efectivo (POS)</option>
                                    <option value="external_payment_link">Link de Pago</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Estado Inicial del Pago *</label>
                                <select
                                    value={initialPaymentStatus}
                                    onChange={e => setInitialPaymentStatus(e.target.value as 'pending' | 'paid')}
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                >
                                    <option value="pending">Pendiente de Pago</option>
                                    <option value="paid">Pagado (Marcar como Pagado)</option>
                                </select>
                            </div>
                        </div>

                        {/* Customer & Internal Notes */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Nota del Cliente (Instrucciones de entrega/pedido)</label>
                                <input
                                    type="text"
                                    value={customerNotes}
                                    onChange={e => setCustomerNotes(e.target.value)}
                                    placeholder="Ej: Llamar antes de entregar, dejar en portería."
                                    style={{ width: '100%', padding: '9px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Notas Internas (Solo Administradores)</label>
                                <textarea
                                    rows={2}
                                    value={internalNotes}
                                    onChange={e => setInternalNotes(e.target.value)}
                                    placeholder="Ej: Cliente recurrente de WhatsApp, enviar bolsa de regalo."
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN — STICKY SUMMARY CARD */}
                <div style={{ position: 'sticky', top: '24px' }}>
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                            Resumen del Pedido
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa' }}>
                                <span>Subtotal productos ({selectedItems.reduce((a, b) => a + b.quantity, 0)})</span>
                                <span>{formatMoney(subtotalCents)}</span>
                            </div>

                            {discountCents > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                                    <span>Descuento aplicado</span>
                                    <span>-{formatMoney(discountCents)}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa' }}>
                                <span>Costo de envío</span>
                                <span>{formatMoney(shippingCents)}</span>
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: 800, fontSize: '1.25rem',
                                borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: '6px'
                            }}>
                                <span>Total Final</span>
                                <span style={{ color: 'var(--robotina-orange)' }}>{formatMoney(totalCents)}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isPending}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: 'var(--gradient-main)',
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
                            }}
                        >
                            {isPending ? 'Creando Pedido...' : '✓ Crear Pedido Real'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
