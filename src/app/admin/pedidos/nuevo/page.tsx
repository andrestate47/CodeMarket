'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatMoney, parseMoneyToCents } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { createManualOrderAction } from '@/modules/orders/actions';
import { fetchCatalogProducts } from '@/modules/catalog/queries';

interface CustomerOption {
    id: string;
    name: string;
    email: string;
    phone?: string;
    document_type?: string;
    document_number?: string;
    address_line?: string;
    district?: string;
    province?: string;
    department?: string;
    reference?: string;
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
    image?: string;
    product_variants?: ProductVariantOption[];
}

interface SelectedOrderItem {
    productId: string;
    variantId?: string;
    productName: string;
    variantName?: string;
    sku?: string;
    image?: string;
    originalUnitPriceAmount: number; // in cents
    unitPriceAmount: number; // in cents
    priceAdjustmentReason?: string;
    quantity: number;
    availableStock: number;
}

export default function NewManualOrderPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // ─── STEP 1: CLIENTE STATE & MODES ─────────────────────────────
    const [customerMode, setCustomerMode] = useState<'search' | 'new' | 'guest'>('search');
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerResults, setCustomerResults] = useState<CustomerOption[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

    // Form inputs
    const [custName, setCustName] = useState('');
    const [custEmail, setCustEmail] = useState('');
    const [custPhone, setCustPhone] = useState('');
    const [custDocType, setCustDocType] = useState('DNI');
    const [custDocNum, setCustDocNum] = useState('');

    // Known customer address auto-fill state
    const [hasKnownAddress, setHasKnownAddress] = useState(false);

    // ─── STEP 2: CANAL Y VENDEDOR (REPRESENTANTE) ────────────────────
    const [source, setSource] = useState<'online_store' | 'manual' | 'whatsapp' | 'instagram' | 'facebook' | 'phone' | 'pos' | 'other'>('whatsapp');
    const [sourceReference, setSourceReference] = useState('');
    const [salesperson, setSalesperson] = useState('Andrés Tate (Administrador)');

    // ─── STEP 3: PRODUCTOS Y VARIANTES (CORAZÓN DE LA PANTALLA) ─────
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
    const [selectedItems, setSelectedItems] = useState<SelectedOrderItem[]>([]);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);

    // ─── STEP 4: ENVÍOS & PRESETS ───────────────────────────────────
    const [deliveryType, setDeliveryType] = useState<'pickup' | 'local_delivery' | 'national_shipping' | 'custom' | 'none'>('local_delivery');
    const [shippingPreset, setShippingPreset] = useState<'pickup' | 'lima_cercado' | 'lima_metro' | 'national' | 'custom'>('lima_cercado');
    const [shippingMethodName, setShippingMethodName] = useState('Delivery Express Lima');
    const [shippingFeeInput, setShippingFeeInput] = useState<string>('10.00');

    // Dirección de envío
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [shippingDepartment, setShippingDepartment] = useState('Lima');
    const [shippingProvince, setShippingProvince] = useState('Lima');
    const [shippingDistrict, setShippingDistrict] = useState('Miraflores');
    const [shippingAddressLine, setShippingAddressLine] = useState('');
    const [shippingReference, setShippingReference] = useState('');

    // ─── STEP 5: DESCUENTOS AUDITABLES ──────────────────────────────
    const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed' | 'coupon'>('none');
    const [discountValue, setDiscountValue] = useState<string>('0');
    const [discountReason, setDiscountReason] = useState('');

    // ─── STEP 6: PAGO Y NOTAS ───────────────────────────────────────
    const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin' | 'bank_transfer' | 'cash_on_delivery' | 'external_payment_link' | 'cash' | 'other'>('yape');
    const [initialPaymentStatus, setInitialPaymentStatus] = useState<'pending' | 'paid'>('pending');

    const [customerNotes, setCustomerNotes] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // ─── CUSTOMER SEARCH DEBOUNCE ────────────────────────────────────
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
        }, 250);

        return () => clearTimeout(handler);
    }, [customerSearchQuery, customerMode]);

    // ─── PRODUCT SEARCH DEBOUNCE (CATÁLOGO + SUPABASE DB) ────────────
    useEffect(() => {
        const queryTrimmed = productSearchQuery.trim();
        if (!queryTrimmed) {
            setProductResults([]);
            return;
        }

        const queryLower = queryTrimmed.toLowerCase();

        const handler = setTimeout(async () => {
            setIsSearchingProducts(true);
            try {
                // 1. Search in Catalog (Local data + localStorage + Supabase cache)
                const catalogProducts = await fetchCatalogProducts();
                const filteredCatalog = catalogProducts.filter(p =>
                    p.title?.toLowerCase().includes(queryLower) ||
                    p.category?.toLowerCase().includes(queryLower) ||
                    p.id?.toLowerCase().includes(queryLower) ||
                    p.description?.toLowerCase().includes(queryLower)
                );

                // 2. Search direct in Supabase DB safely
                let dbProducts: ProductSearchResult[] = [];
                try {
                    const { data: dbProds } = await supabase
                        .from('products')
                        .select('*')
                        .or(`name.ilike.%${queryTrimmed}%,sku.ilike.%${queryTrimmed}%`)
                        .limit(8);

                    if (dbProds && dbProds.length > 0) {
                        dbProducts = dbProds.map(p => ({
                            id: p.id,
                            name: p.name,
                            sku: p.sku || p.id,
                            price_amount: p.price_amount || 0,
                            stock_quantity: p.stock_quantity ?? 20,
                            track_inventory: p.track_inventory ?? true,
                            image: p.image_url || '/web-basica-hero.png',
                            product_variants: p.metadata?.variants || []
                        }));
                    }
                } catch {
                    // Fallback to catalog
                }

                // 3. Map filtered catalog products
                const mappedCatalog: ProductSearchResult[] = filteredCatalog.map(p => ({
                    id: p.id,
                    name: p.title,
                    sku: p.id,
                    price_amount: p.price_amount,
                    stock_quantity: p.stock_quantity ?? 25,
                    track_inventory: p.track_inventory ?? true,
                    image: p.image,
                    product_variants: (p.variants || []).map((v: Record<string, unknown>) => ({
                        id: (v.id as string) || `${p.id}-${v.name}`,
                        name: (v.name as string) || 'Variante',
                        sku: (v.id as string) || `${p.id}-${v.name}`,
                        price_amount: v.price ? parseMoneyToCents(v.price as string) : p.price_amount,
                        stock_quantity: (v.stock as number) ?? p.stock_quantity ?? 20,
                    }))
                }));

                const combined = [...mappedCatalog, ...dbProducts];
                const uniqueResults = combined.filter((prod, idx, self) =>
                    idx === self.findIndex(item => item.id === prod.id)
                );

                setProductResults(uniqueResults.slice(0, 8));
            } catch (err) {
                console.error('Error al buscar productos:', err);
            } finally {
                setIsSearchingProducts(false);
            }
        }, 150);

        return () => clearTimeout(handler);
    }, [productSearchQuery]);

    // ─── HANDLERS ────────────────────────────────────────────────────
    const handleSelectCustomer = (c: CustomerOption) => {
        setSelectedCustomer(c);
        setCustName(c.name);
        setCustEmail(c.email);
        setCustPhone(c.phone || '');
        setCustDocType(c.document_type || 'DNI');
        setCustDocNum(c.document_number || '');
        setCustomerResults([]);

        // Check if customer has known address
        const hasAddr = !!(c.address_line || c.district || c.province);
        setHasKnownAddress(hasAddr);
        if (hasAddr) {
            handleApplyKnownAddress(c);
        } else {
            setRecipientName(c.name);
            setRecipientPhone(c.phone || '');
        }
    };

    const handleApplyKnownAddress = (c: CustomerOption) => {
        setRecipientName(c.name);
        setRecipientPhone(c.phone || '');
        if (c.department) setShippingDepartment(c.department);
        if (c.province) setShippingProvince(c.province);
        if (c.district) setShippingDistrict(c.district);
        if (c.address_line) setShippingAddressLine(c.address_line);
        if (c.reference) setShippingReference(c.reference);
    };

    // Shipping Preset Handler
    const handleSelectShippingPreset = (preset: 'pickup' | 'lima_cercado' | 'lima_metro' | 'national' | 'custom') => {
        setShippingPreset(preset);
        if (preset === 'pickup') {
            setDeliveryType('pickup');
            setShippingFeeInput('0.00');
            setShippingMethodName('Recojo en tienda (Gratis)');
        } else if (preset === 'lima_cercado') {
            setDeliveryType('local_delivery');
            setShippingFeeInput('10.00');
            setShippingMethodName('Delivery Lima Cercado');
        } else if (preset === 'lima_metro') {
            setDeliveryType('local_delivery');
            setShippingFeeInput('15.00');
            setShippingMethodName('Envío Lima Metropolitana');
        } else if (preset === 'national') {
            setDeliveryType('national_shipping');
            setShippingFeeInput('25.00');
            setShippingMethodName('Envío Nacional (Provincias)');
        } else if (preset === 'custom') {
            setDeliveryType('custom');
            setShippingMethodName('Costo de Envío Personalizado');
        }
    };

    // Add Product / Variant to Order
    const handleAddProduct = (prod: ProductSearchResult, variant?: ProductVariantOption) => {
        const variantId = variant?.id;
        const productName = prod.name;
        const variantName = variant?.name;
        const sku = variant?.sku || prod.sku;
        const basePriceCents = variant ? variant.price_amount : prod.price_amount;
        const availableStock = variant ? variant.stock_quantity : prod.stock_quantity;

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
                    image: prod.image,
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

    const handleRemoveItem = (index: number) => {
        setSelectedItems(prev => prev.filter((_, i) => i !== index));
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

    // ─── CALCULATIONS ────────────────────────────────────────────────
    const subtotalCents = selectedItems.reduce((acc, item) => acc + (item.unitPriceAmount * item.quantity), 0);

    let discountCents = 0;
    if (discountType === 'percentage') {
        const val = parseFloat(discountValue) || 0;
        discountCents = Math.round((subtotalCents * val) / 100);
    } else if (discountType === 'fixed' || discountType === 'coupon') {
        discountCents = parseMoneyToCents(discountValue);
    }

    const shippingCents = deliveryType === 'pickup' || deliveryType === 'none' ? 0 : parseMoneyToCents(shippingFeeInput);
    const totalCents = Math.max(0, subtotalCents + shippingCents - discountCents);

    const paidCents = initialPaymentStatus === 'paid' ? totalCents : 0;
    const balanceCents = Math.max(0, totalCents - paidCents);

    // ─── SUBMIT ORDER ────────────────────────────────────────────────
    const handleSubmit = () => {
        setErrorMessage(null);

        if (!custName.trim()) {
            setErrorMessage('Por favor ingrese el nombre del cliente.');
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
                customerEmail: custEmail.trim() || 'cliente.ocasional@codemarket.pe',
                customerPhone: custPhone.trim(),
                documentType: custDocType,
                documentNumber: custDocNum.trim(),
                source,
                sourceReference: `${salesperson ? `Vendedor: ${salesperson} • ` : ''}${sourceReference.trim()}`,
                deliveryType: deliveryType === 'custom' ? 'local_delivery' : deliveryType,
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
                internalNotes: `${discountReason ? `[Motivo Descuento]: ${discountReason}\n` : ''}${internalNotes.trim()}`,
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
            {/* Page Header */}
            <AdminPageHeader
                title="Crear Pedido Manual"
                description="Centro de venta asistida para pedidos desde WhatsApp, redes sociales, teléfono o venta presencial."
                action={
                    <Link
                        href="/admin/pedidos"
                        style={{
                            padding: '9px 16px',
                            background: 'var(--card-bg)',
                            border: '1.5px solid var(--glass-border)',
                            borderRadius: '10px',
                            color: 'var(--foreground)',
                            fontSize: '0.88rem',
                            textDecoration: 'none',
                            fontWeight: 600,
                        }}
                    >
                        ← Cancelar
                    </Link>
                }
            />

            {errorMessage && (
                <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.15)', border: '1.5px solid #ef4444', borderRadius: '12px', color: '#ef4444', marginBottom: '20px', fontWeight: 700 }}>
                    ⚠️ {errorMessage}
                </div>
            )}

            {/* 70% LEFT FORM / 30% STICKY SUMMARY LAYOUT */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '24px', alignItems: 'start' }}>
                {/* 70% LEFT COLUMN — FORM SECTIONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* SECTION 1: CLIENTE & DIRECCIÓN */}
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            👤 1. Cliente y Datos de Contacto
                        </h3>

                        {/* Customer Mode Tabs */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => { setCustomerMode('search'); setSelectedCustomer(null); }}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: customerMode === 'search' ? '1.5px solid var(--robotina-orange)' : '1.5px solid var(--glass-border)',
                                    background: customerMode === 'search' ? 'rgba(249, 115, 22, 0.15)' : 'var(--input-bg)',
                                    color: customerMode === 'search' ? 'var(--robotina-orange)' : 'var(--text-muted)',
                                    fontSize: '0.84rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                🔍 Buscar Cliente Existente
                            </button>
                            <button
                                type="button"
                                onClick={() => { setCustomerMode('new'); setSelectedCustomer(null); setCustName(''); setCustEmail(''); setCustPhone(''); }}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: customerMode === 'new' ? '1.5px solid var(--robotina-orange)' : '1.5px solid var(--glass-border)',
                                    background: customerMode === 'new' ? 'rgba(249, 115, 22, 0.15)' : 'var(--input-bg)',
                                    color: customerMode === 'new' ? 'var(--robotina-orange)' : 'var(--text-muted)',
                                    fontSize: '0.84rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                + Crear Nuevo Cliente
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCustomerMode('guest');
                                    setSelectedCustomer(null);
                                    setCustName('');
                                    setCustEmail('');
                                    setCustPhone('');
                                }}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: customerMode === 'guest' ? '1.5px solid var(--robotina-orange)' : '1.5px solid var(--glass-border)',
                                    background: customerMode === 'guest' ? 'rgba(249, 115, 22, 0.15)' : 'var(--input-bg)',
                                    color: customerMode === 'guest' ? 'var(--robotina-orange)' : 'var(--text-muted)',
                                    fontSize: '0.84rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                ⚡ Continuar sin registrar cliente
                            </button>
                        </div>

                        {/* Mode: Search Customer */}
                        {customerMode === 'search' && (
                            <div style={{ position: 'relative', marginBottom: '14px' }}>
                                <input
                                    type="text"
                                    value={customerSearchQuery}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setCustomerSearchQuery(val);
                                        if (!val.trim()) setCustomerResults([]);
                                    }}
                                    placeholder="Buscar cliente existente por nombre, correo o teléfono..."
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--input-bg)',
                                        border: '1.5px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: 'var(--input-text)',
                                        fontSize: '0.88rem',
                                    }}
                                />

                                {customerResults.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
                                        background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', marginTop: '4px',
                                        maxHeight: '200px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                                    }}>
                                        {customerResults.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => handleSelectCustomer(c)}
                                                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)' }}
                                            >
                                                <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{c.name}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.email} • {c.phone || 'Sin teléfono'}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Customer Info Badge if Selected */}
                        {selectedCustomer && (
                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1.5px solid #22c55e', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 800 }}>✓ CLIENTE SELECCIONADO</span>
                                    <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '0.95rem' }}>{selectedCustomer.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedCustomer.email} • {selectedCustomer.phone || 'Sin tel'}</div>
                                </div>
                                {hasKnownAddress && (
                                    <button
                                        type="button"
                                        onClick={() => handleApplyKnownAddress(selectedCustomer)}
                                        style={{ padding: '6px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        📍 Usar dirección habitual
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Customer Input Fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                                    Nombre del Cliente *
                                </label>
                                <input
                                    type="text"
                                    value={custName}
                                    onChange={e => setCustName(e.target.value)}
                                    placeholder="Ej: Pedro Pérez"
                                    style={{ width: '100%', padding: '9px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                                    Correo Electrónico {customerMode === 'guest' ? '(Opcional)' : '*'}
                                </label>
                                <input
                                    type="email"
                                    value={custEmail}
                                    onChange={e => setCustEmail(e.target.value)}
                                    placeholder="pedro@ejemplo.com"
                                    style={{ width: '100%', padding: '9px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                                    Teléfono / WhatsApp *
                                </label>
                                <input
                                    type="text"
                                    value={custPhone}
                                    onChange={e => setCustPhone(e.target.value)}
                                    placeholder="+51 999 000 000"
                                    style={{ width: '100%', padding: '9px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                                    Documento (DNI / RUC)
                                </label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <select
                                        value={custDocType}
                                        onChange={e => setCustDocType(e.target.value)}
                                        style={{ padding: '9px 8px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.8rem' }}
                                    >
                                        <option value="DNI">DNI</option>
                                        <option value="RUC">RUC</option>
                                        <option value="CE">CE</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={custDocNum}
                                        onChange={e => setCustDocNum(e.target.value)}
                                        placeholder="Número de documento..."
                                        style={{ flex: 1, padding: '9px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: CANAL Y VENDEDOR (ATTRIBUTION) */}
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '14px' }}>
                            📢 2. Canal de Venta y Vendedor
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Canal de Venta *</label>
                                <select
                                    value={source}
                                    onChange={e => setSource(e.target.value as 'online_store' | 'manual' | 'whatsapp' | 'instagram' | 'facebook' | 'phone' | 'pos' | 'other')}
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
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
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Referencia (Teléfono / @user)</label>
                                <input
                                    type="text"
                                    value={sourceReference}
                                    onChange={e => setSourceReference(e.target.value)}
                                    placeholder="+51 999 000 000 o @usuario_ig"
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Vendedor / Atendido por</label>
                                <select
                                    value={salesperson}
                                    onChange={e => setSalesperson(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                >
                                    <option value="Andrés Tate (Administrador)">Andrés Tate (Admin)</option>
                                    <option value="Vendedor 1 (SaaS)">Vendedor 1 (Equipo)</option>
                                    <option value="Sistema / Automático">Sistema / Automático</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: PRODUCTOS Y VARIANTES (CORAZÓN DE LA PANTALLA) */}
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>🛒 3. Selección de Productos y Variantes</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{selectedItems.length} ítems agregados</span>
                        </h3>

                        {/* Search Product Input */}
                        <div style={{ position: 'relative', marginBottom: '18px' }}>
                            <input
                                type="text"
                                value={productSearchQuery}
                                onChange={e => {
                                    const val = e.target.value;
                                    setProductSearchQuery(val);
                                    if (!val.trim()) setProductResults([]);
                                }}
                                placeholder="Escribe para buscar (ej: arepa, polo, zapatillas, audífonos, SKU...)"
                                style={{ width: '100%', padding: '12px 16px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '10px', color: 'var(--input-text)', fontSize: '0.92rem' }}
                            />
                            {isSearchingProducts && (
                                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Buscando catálogo...
                                </span>
                            )}

                            {/* Rich Search Results Dropdown */}
                            {productSearchQuery.trim().length > 0 && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 40,
                                    background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '12px', marginTop: '6px',
                                    maxHeight: '420px', overflowY: 'auto', boxShadow: '0 12px 30px rgba(0,0,0,0.2)'
                                }}>
                                    {productResults.length > 0 ? (
                                        productResults.map(p => (
                                            <div key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                {/* Product Item Main Card */}
                                                <div
                                                    onClick={() => handleAddProduct(p)}
                                                    style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.15s ease' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        {p.image ? (
                                                            <img
                                                                src={p.image}
                                                                alt={p.name}
                                                                style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1.5px solid var(--glass-border)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                                                            />
                                                        ) : (
                                                            <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                                                                🏷️
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '0.92rem' }}>{p.name}</div>
                                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SKU: {p.sku || 'N/A'} • Stock disponible: <strong>{p.stock_quantity}</strong></div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '1rem' }}>
                                                            {formatMoney(p.price_amount)}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleAddProduct(p); }}
                                                            style={{ padding: '6px 12px', background: 'var(--robotina-orange)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                                        >
                                                            + Agregar
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Variants sub-list */}
                                                {p.product_variants && p.product_variants.length > 0 && (
                                                    <div style={{ background: 'var(--input-bg)', padding: '8px 16px 12px 30px', borderTop: '1px dashed var(--glass-border)' }}>
                                                        <span style={{ fontSize: '0.74rem', color: 'var(--text-description)', fontWeight: 700 }}>Variantes de {p.name}:</span>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px', marginTop: '6px' }}>
                                                            {p.product_variants.map(v => (
                                                                <div
                                                                    key={v.id}
                                                                    onClick={() => handleAddProduct(p, v)}
                                                                    style={{
                                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                        padding: '6px 10px', borderRadius: '6px', cursor: v.stock_quantity > 0 ? 'pointer' : 'not-allowed',
                                                                        border: '1.5px solid var(--glass-border)', background: 'var(--card-bg)',
                                                                        opacity: v.stock_quantity > 0 ? 1 : 0.6
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <div style={{ fontSize: '0.8rem', color: 'var(--foreground)', fontWeight: 700 }}>↳ {v.name}</div>
                                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Stock: {v.stock_quantity}</div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#16a34a' }}>{formatMoney(v.price_amount)}</span>
                                                                        <button
                                                                            type="button"
                                                                            disabled={v.stock_quantity <= 0}
                                                                            onClick={(e) => { e.stopPropagation(); if (v.stock_quantity > 0) handleAddProduct(p, v); }}
                                                                            style={{ padding: '4px 8px', background: v.stock_quantity > 0 ? 'var(--gradient-main)' : '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                                                        >
                                                                            {v.stock_quantity > 0 ? '+ Agregar' : 'Agotado'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        !isSearchingProducts && (
                                            <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.88rem' }}>
                                                No se encontraron productos con &quot;<strong>{productSearchQuery}</strong>&quot;.
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selected Items Table */}
                        {selectedItems.length === 0 ? (
                            <div style={{ padding: '28px', color: 'var(--text-description)', textAlign: 'center', border: '1.5px dashed var(--glass-border)', borderRadius: '12px' }}>
                                📦 No has agregado productos al pedido. Utiliza el buscador para encontrar e insertar ítems.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {selectedItems.map((item, idx) => (
                                    <div key={idx} style={{ background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.productName}
                                                    style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1.5px solid var(--glass-border)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                                                />
                                            ) : (
                                                <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                                                    🏷️
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '0.95rem' }}>{item.productName}</div>
                                                {item.variantName && <div style={{ fontSize: '0.8rem', color: 'var(--robotina-orange)', fontWeight: 700 }}>Variante: {item.variantName}</div>}
                                                {item.sku && <div style={{ fontSize: '0.75rem', color: 'var(--text-description)' }}>SKU: {item.sku}</div>}
                                            </div>
                                        </div>

                                        {/* Price Adjustment */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                            <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.95rem' }}>
                                                {formatMoney(item.unitPriceAmount)}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Ajustar precio (S/)"
                                                onBlur={(e) => {
                                                    if (e.target.value) {
                                                        const reason = prompt('Razón del ajuste de precio (Ej: Promoción WhatsApp, Mayorista):');
                                                        if (reason) handlePriceAdjustment(idx, e.target.value, reason);
                                                    }
                                                }}
                                                style={{ width: '100px', padding: '3px 6px', fontSize: '0.75rem', background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '4px', color: 'var(--input-text)', textAlign: 'right' }}
                                            />
                                        </div>

                                        {/* Quantity Controls */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', padding: '5px 10px', borderRadius: '8px' }}>
                                            <button type="button" onClick={() => handleQuantityChange(idx, -1)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>-</button>
                                            <span style={{ fontWeight: 800, color: 'var(--foreground)', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                            <button type="button" onClick={() => handleQuantityChange(idx, 1)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>+</button>
                                        </div>

                                        {/* Subtotal Item */}
                                        <div style={{ fontWeight: 800, color: 'var(--foreground)', minWidth: '85px', textAlign: 'right', fontSize: '1rem' }}>
                                            {formatMoney(item.unitPriceAmount * item.quantity)}
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(idx)}
                                            title="Eliminar producto"
                                            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: MÉTODO DE ENTREGA Y ENVÍOS (CON PRESETS DEL MÓDULO) */}
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '14px' }}>
                            🚚 4. Método de Entrega y Envíos
                        </h3>

                        {/* Shipping Presets Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                            <button
                                type="button"
                                onClick={() => handleSelectShippingPreset('pickup')}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    border: shippingPreset === 'pickup' ? '2px solid var(--robotina-orange)' : '1.5px solid var(--glass-border)',
                                    background: shippingPreset === 'pickup' ? 'rgba(249, 115, 22, 0.12)' : 'var(--input-bg)',
                                    color: 'var(--foreground)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Recojo en tienda</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16a34a' }}>Gratis</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectShippingPreset('lima_cercado')}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    border: shippingPreset === 'lima_cercado' ? '2px solid var(--robotina-orange)' : '1.5px solid var(--glass-border)',
                                    background: shippingPreset === 'lima_cercado' ? 'rgba(249, 115, 22, 0.12)' : 'var(--input-bg)',
                                    color: 'var(--foreground)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Delivery Lima</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--foreground)' }}>S/ 10.00</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectShippingPreset('lima_metro')}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    border: shippingPreset === 'lima_metro' ? '2px solid var(--robotina-orange)' : '1.5px solid var(--glass-border)',
                                    background: shippingPreset === 'lima_metro' ? 'rgba(249, 115, 22, 0.12)' : 'var(--input-bg)',
                                    color: 'var(--foreground)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Envío Lima Metro</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--foreground)' }}>S/ 15.00</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectShippingPreset('national')}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    border: shippingPreset === 'national' ? '2px solid var(--robotina-orange)' : '1.5px solid var(--glass-border)',
                                    background: shippingPreset === 'national' ? 'rgba(249, 115, 22, 0.12)' : 'var(--input-bg)',
                                    color: 'var(--foreground)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Envío Nacional</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--foreground)' }}>S/ 25.00</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectShippingPreset('custom')}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    border: shippingPreset === 'custom' ? '2px solid var(--robotina-orange)' : '1.5px solid var(--glass-border)',
                                    background: shippingPreset === 'custom' ? 'rgba(249, 115, 22, 0.12)' : 'var(--input-bg)',
                                    color: 'var(--foreground)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Personalizado</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ingresar manual</div>
                            </button>
                        </div>

                        {/* Custom Fee Input if Personalizado selected */}
                        {shippingPreset === 'custom' && (
                            <div style={{ marginBottom: '14px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', padding: '12px 16px', borderRadius: '10px' }}>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Costo personalizado de envío (S/)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={shippingFeeInput}
                                    onChange={e => setShippingFeeInput(e.target.value)}
                                    placeholder="0.00"
                                    style={{ width: '180px', padding: '8px 12px', background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                />
                            </div>
                        )}

                        {/* Delivery Address Form */}
                        {deliveryType !== 'pickup' && deliveryType !== 'none' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', padding: '14px', borderRadius: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Nombre del Destinatario</label>
                                    <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Nombre del receptor" style={{ width: '100%', padding: '7px 10px', background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '6px', color: 'var(--input-text)' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Teléfono Destinatario</label>
                                    <input type="text" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder="Teléfono de entrega" style={{ width: '100%', padding: '7px 10px', background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '6px', color: 'var(--input-text)' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Empresa / Servicio Envío</label>
                                    <input type="text" value={shippingMethodName} onChange={e => setShippingMethodName(e.target.value)} style={{ width: '100%', padding: '7px 10px', background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '6px', color: 'var(--input-text)' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Departamento</label>
                                    <input type="text" value={shippingDepartment} onChange={e => setShippingDepartment(e.target.value)} style={{ width: '100%', padding: '7px 10px', background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '6px', color: 'var(--input-text)' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Provincia</label>
                                    <input type="text" value={shippingProvince} onChange={e => setShippingProvince(e.target.value)} style={{ width: '100%', padding: '7px 10px', background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '6px', color: 'var(--input-text)' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Distrito</label>
                                    <input type="text" value={shippingDistrict} onChange={e => setShippingDistrict(e.target.value)} style={{ width: '100%', padding: '7px 10px', background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '6px', color: 'var(--input-text)' }} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Dirección de Entrega</label>
                                    <input type="text" value={shippingAddressLine} onChange={e => setShippingAddressLine(e.target.value)} placeholder="Av. Principal 123, Dpto 402" style={{ width: '100%', padding: '7px 10px', background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '6px', color: 'var(--input-text)' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-description)', display: 'block' }}>Referencia</label>
                                    <input type="text" value={shippingReference} onChange={e => setShippingReference(e.target.value)} placeholder="Frente al parque..." style={{ width: '100%', padding: '7px 10px', background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '6px', color: 'var(--input-text)' }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 5: DESCUENTOS AUDITABLES */}
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '14px' }}>
                            🎟️ 5. Descuentos del Pedido
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Tipo de Descuento</label>
                                <select
                                    value={discountType}
                                    onChange={e => setDiscountType(e.target.value as 'none' | 'percentage' | 'fixed' | 'coupon')}
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                >
                                    <option value="none">Sin Descuento</option>
                                    <option value="percentage">Porcentaje (%)</option>
                                    <option value="fixed">Monto Fijo (S/)</option>
                                    <option value="coupon">Cupón Existente</option>
                                </select>
                            </div>

                            {discountType !== 'none' && (
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Valor Descuento</label>
                                    <input
                                        type="number"
                                        value={discountValue}
                                        onChange={e => setDiscountValue(e.target.value)}
                                        placeholder={discountType === 'percentage' ? '%' : 'S/'}
                                        style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                    />
                                </div>
                            )}

                            {discountType !== 'none' && (
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Motivo del Descuento (Auditoría)</label>
                                    <input
                                        type="text"
                                        value={discountReason}
                                        onChange={e => setDiscountReason(e.target.value)}
                                        placeholder="Ej: Cliente frecuente, Promoción WhatsApp"
                                        style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 6: PAGO Y NOTAS */}
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '14px' }}>
                            💳 6. Método de Pago e Instrucciones
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Método de Pago *</label>
                                <select
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value as 'yape' | 'plin' | 'bank_transfer' | 'cash_on_delivery' | 'external_payment_link' | 'cash' | 'other')}
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
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
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Estado Inicial del Pago *</label>
                                <select
                                    value={initialPaymentStatus}
                                    onChange={e => setInitialPaymentStatus(e.target.value as 'pending' | 'paid')}
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                >
                                    <option value="pending">Pago Pendiente</option>
                                    <option value="paid">Pagado (Marcar como Pagado)</option>
                                </select>
                            </div>
                        </div>

                        {/* Customer & Internal Notes */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Instrucciones del Cliente</label>
                                <input
                                    type="text"
                                    value={customerNotes}
                                    onChange={e => setCustomerNotes(e.target.value)}
                                    placeholder="Ej: Dejar en portería o llamar antes de llegar."
                                    style={{ width: '100%', padding: '9px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Notas Internas (Solo Administradores)</label>
                                <textarea
                                    rows={2}
                                    value={internalNotes}
                                    onChange={e => setInternalNotes(e.target.value)}
                                    placeholder="Ej: Cliente recurrente de WhatsApp, enviar bolsa promocional."
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 30% RIGHT COLUMN — STICKY COMPREHENSIVE SUMMARY CARD */}
                <div style={{ position: 'sticky', top: '24px' }}>
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '22px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '14px', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>RESUMEN DEL PEDIDO</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{selectedItems.reduce((a, b) => a + b.quantity, 0)} productos</span>
                        </h3>

                        {/* Itemized List Summary */}
                        <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '12px' }}>
                            {selectedItems.length === 0 ? (
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                                    Ningún producto seleccionado
                                </div>
                            ) : (
                                selectedItems.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', color: 'var(--foreground)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                            {item.image && (
                                                <img
                                                    src={item.image}
                                                    alt={item.productName}
                                                    style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, border: '1.5px solid var(--glass-border)' }}
                                                />
                                            )}
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                                                <span style={{ fontWeight: 700 }}>{item.productName}</span>
                                                {item.variantName && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> ({item.variantName})</span>}
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> × {item.quantity}</span>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, flexShrink: 0 }}>
                                            {formatMoney(item.unitPriceAmount * item.quantity)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Financial Totals */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                <span>Subtotal</span>
                                <span>{formatMoney(subtotalCents)}</span>
                            </div>

                            {discountCents > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontWeight: 600 }}>
                                    <span>Descuento</span>
                                    <span>-{formatMoney(discountCents)}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                <span>Envío ({shippingPreset === 'pickup' ? 'Recojo' : shippingPreset === 'custom' ? 'Personalizado' : shippingMethodName.split(' ')[0]})</span>
                                <span>{formatMoney(shippingCents)}</span>
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', color: 'var(--foreground)', fontWeight: 800, fontSize: '1.25rem',
                                borderTop: '1.5px solid var(--glass-border)', paddingTop: '10px', marginTop: '4px'
                            }}>
                                <span>TOTAL</span>
                                <span style={{ color: 'var(--robotina-orange)' }}>{formatMoney(totalCents)}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#16a34a', marginTop: '4px' }}>
                                <span>Pagado</span>
                                <span style={{ fontWeight: 700 }}>{formatMoney(paidCents)}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#d97706' }}>
                                <span>Saldo pendiente</span>
                                <span style={{ fontWeight: 700 }}>{formatMoney(balanceCents)}</span>
                            </div>
                        </div>

                        {/* Selected Payment Method & Initial Status Badges */}
                        <div style={{ background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '10px', padding: '10px 12px', marginBottom: '18px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Método:</span>
                                <strong style={{ color: 'var(--foreground)', textTransform: 'uppercase' }}>{paymentMethod}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Estado Pago:</span>
                                <strong style={{ color: initialPaymentStatus === 'paid' ? '#16a34a' : '#d97706' }}>
                                    {initialPaymentStatus === 'paid' ? 'PAGADO' : 'PENDIENTE DE PAGO'}
                                </strong>
                            </div>
                        </div>

                        {/* Confirmation Action Button */}
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
                                transition: 'var(--transition)'
                            }}
                        >
                            {isPending ? 'Procesando pedido...' : '✓ Confirmar pedido'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
