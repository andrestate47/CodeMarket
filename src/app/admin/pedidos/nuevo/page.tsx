'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatMoney, parseMoneyToCents } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import CustomerSearchAutocomplete, { CustomerOption } from '@/components/admin/CustomerSearchAutocomplete';
import {
    createManualOrderAction,
    updateManualOrderAction,
    getSingleOrderAction,
    getSavedCustomersForAutocompleteAction,
    SavedCustomerRecord
} from '@/modules/orders/actions';
import { fetchCatalogProducts } from '@/modules/catalog/queries';
import { CouponService, Coupon } from '@/lib/services/couponService';

export type { CustomerOption };

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

    // ─── PASOS (NUEVO DISEÑO POS) ──────────────────────────────
    const [step, setStep] = useState<1 | 2>(1);
    
    // Categorías y Productos Globales (para el Grid POS)
    const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('todos');
    const [allProducts, setAllProducts] = useState<(ProductSearchResult & { category_id?: string; category_name?: string; has_promo?: boolean })[]>([]);

    useEffect(() => {
        // Fetch categories and initial products for POS step 1
        const fetchInitialData = async () => {
            try {
                // Obtenemos categorías de DB
                const { data: cats } = await supabase.from('categories').select('*').eq('is_active', true);
                if (cats) setCategories(cats);

                // Usamos fetchCatalogProducts que combina DB + Demo products
                const catalogProducts = await fetchCatalogProducts();
                
                // Mapeamos a ProductSearchResult incluyendo categoría y promoción
                const formattedProds = catalogProducts.map(p => ({
                    id: p.id,
                    name: p.title,
                    sku: p.id,
                    price_amount: p.price_amount || 0,
                    stock_quantity: p.stock_quantity ?? 20,
                    track_inventory: p.track_inventory ?? true,
                    image: p.image || '/web-basica-hero.png',
                    category_id: p.category_id || '',
                    category_name: p.category || '',
                    has_promo: Boolean((p.compare_at_amount && p.compare_at_amount > (p.price_amount || 0)) || p.comparePrice),
                    product_variants: p.variants?.map(v => ({
                        id: v.id,
                        name: v.name,
                        price_amount: parseFloat(v.price.replace(/[^0-9.-]+/g, '')) * 100 || 0,
                        stock_quantity: v.stock
                    })) || []
                }));

                setAllProducts(formattedProds);
            } catch (err) {
                console.error("Error fetching initial POS data", err);
            }
        };
        fetchInitialData();
    }, []);

    // ─── STEP 1: CLIENTE STATE & MODES ─────────────────────────────
    const [customerMode, setCustomerMode] = useState<'search' | 'new' | 'guest'>('search');
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

    // Form inputs
    const [custName, setCustName] = useState('');
    const [custLastName, setCustLastName] = useState('');
    const [custEmail, setCustEmail] = useState('');
    const [custPhone, setCustPhone] = useState('');
    const [custDocType, setCustDocType] = useState('DNI');
    const [custDocNum, setCustDocNum] = useState('');

    // Country dial code selector (default: Peru +51)
    const COUNTRY_DIAL_CODES = React.useMemo(() => [
        { iso: 'pe', name: 'Perú', dial: '+51' },
        { iso: 'cl', name: 'Chile', dial: '+56' },
        { iso: 'co', name: 'Colombia', dial: '+57' },
        { iso: 'ec', name: 'Ecuador', dial: '+593' },
        { iso: 'bo', name: 'Bolivia', dial: '+591' },
        { iso: 'ar', name: 'Argentina', dial: '+54' },
        { iso: 'mx', name: 'México', dial: '+52' },
        { iso: 'us', name: 'Estados Unidos', dial: '+1' },
        { iso: 'es', name: 'España', dial: '+34' },
        { iso: 'br', name: 'Brasil', dial: '+55' },
        { iso: 'uy', name: 'Uruguay', dial: '+598' },
        { iso: 'py', name: 'Paraguay', dial: '+595' },
        { iso: 've', name: 'Venezuela', dial: '+58' },
        { iso: 'pa', name: 'Panamá', dial: '+507' },
        { iso: 'cr', name: 'Costa Rica', dial: '+506' },
        { iso: 'gt', name: 'Guatemala', dial: '+502' },
        { iso: 'sv', name: 'El Salvador', dial: '+503' },
        { iso: 'hn', name: 'Honduras', dial: '+504' },
        { iso: 'ni', name: 'Nicaragua', dial: '+505' },
        { iso: 'do', name: 'Rep. Dominicana', dial: '+1' },
        { iso: 'pr', name: 'Puerto Rico', dial: '+1' },
        { iso: 'ca', name: 'Canadá', dial: '+1' },
        { iso: 'gb', name: 'Reino Unido', dial: '+44' },
        { iso: 'it', name: 'Italia', dial: '+39' },
        { iso: 'fr', name: 'Francia', dial: '+33' },
        { iso: 'de', name: 'Alemania', dial: '+49' },
    ], []);
    const [selectedPhoneCountry, setSelectedPhoneCountry] = useState({ iso: 'pe', name: 'Perú', dial: '+51' });
    const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const countryPickerRef = React.useRef<HTMLDivElement>(null);

    // Predictive autocomplete state for customer fields
    const [savedCustomers, setSavedCustomers] = useState<SavedCustomerRecord[]>([]);
    const [activeField, setActiveField] = useState<'phone' | 'name' | 'lastName' | 'doc' | 'email' | null>(null);
    const customerCardRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        getSavedCustomersForAutocompleteAction().then(res => {
            if (res.success && res.customers) {
                try {
                    const localRaw = localStorage.getItem('tiendavir_saved_customers');
                    const localList: SavedCustomerRecord[] = localRaw ? JSON.parse(localRaw) : [];
                    const merged = [...localList, ...res.customers].filter(
                        (c, idx, self) => idx === self.findIndex(x => (x.phone && x.phone === c.phone) || (x.fullName.toLowerCase() === c.fullName.toLowerCase()))
                    );
                    setSavedCustomers(merged);
                } catch {
                    setSavedCustomers(res.customers);
                }
            }
        });
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (customerCardRef.current && !customerCardRef.current.contains(e.target as Node)) {
                setActiveField(null);
            }
            if (countryPickerRef.current && !countryPickerRef.current.contains(e.target as Node)) {
                setCountryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getFilteredPredictions = (): SavedCustomerRecord[] => {
        if (activeField !== 'name') return [];
        const q = custName.trim().toLowerCase();
        if (!q) return [];

        return savedCustomers.filter(c =>
            c.firstName.toLowerCase().includes(q) ||
            c.lastName.toLowerCase().includes(q) ||
            c.fullName.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q)
        ).slice(0, 5);
    };

    const handleAutocompleteSelect = (c: SavedCustomerRecord) => {
        setCustPhone(c.phone || '');
        setCustName(c.firstName || c.fullName || '');
        setCustLastName(c.lastName || '');
        setCustDocType(c.documentType || 'DNI');
        setCustDocNum(c.documentNumber || '');
        setCustEmail(c.email || '');
        setSelectedCustomer({
            id: c.id,
            name: c.fullName,
            email: c.email,
            phone: c.phone,
            document_type: c.documentType,
            document_number: c.documentNumber,
            department: c.department,
            province: c.province,
            district: c.district,
            address_line: c.addressLine,
            reference: c.reference,
        });
        setRecipientName(c.fullName);
        setRecipientPhone(c.phone || '');
        if (c.department) setShippingDepartment(c.department);
        if (c.province) setShippingProvince(c.province);
        if (c.district) setShippingDistrict(c.district);
        if (c.addressLine) setShippingAddressLine(c.addressLine);
        if (c.reference) setShippingReference(c.reference);
        setHasKnownAddress(Boolean(c.addressLine || c.district));
        setErrorMessage(null);
        setActiveField(null);
    };

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

    // ─── STEP 5: DESCUENTOS AUDITABLES Y CUPONES ─────────────────────
    const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed' | 'coupon'>('none');
    const [discountValue, setDiscountValue] = useState<string>('');
    const [discountReason, setDiscountReason] = useState('');
    const [activePromoTab, setActivePromoTab] = useState<'none' | 'discount' | 'coupon'>('none');
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
    const [couponFeedback, setCouponFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
    const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

    useEffect(() => {
        CouponService.getCoupons().then(list => {
            setAvailableCoupons(list.filter(c => c.is_active));
        }).catch(() => {});
    }, []);

    // ─── STEP 6: PAGO Y NOTAS ───────────────────────────────────────
    const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin' | 'bank_transfer' | 'cash_on_delivery' | 'external_payment_link' | 'cash' | 'other'>('yape');
    const [initialPaymentStatus, setInitialPaymentStatus] = useState<'pending' | 'paid'>('pending');

    const [customerNotes, setCustomerNotes] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [editOrderId, setEditOrderId] = useState<string | null>(null);
    const [editOrderNumber, setEditOrderNumber] = useState<string | null>(null);

    // Cargar datos si venimos de "ir un paso atrás para modificar un dato" (?edit=<orderId>)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        if (!editId) return;

        setEditOrderId(editId);
        setStep(2);

        getSingleOrderAction(editId).then(res => {
            if (res.success && res.order) {
                const ord = res.order;
                setEditOrderNumber(ord.order_number);

                const parts = (ord.customer_name || '').trim().split(/\s+/);
                if (parts.length > 1) {
                    setCustName(parts.slice(0, -1).join(' '));
                    setCustLastName(parts.slice(-1).join(' '));
                } else {
                    setCustName(ord.customer_name || '');
                    setCustLastName('');
                }

                setCustPhone((ord.customer_phone || '').replace(/^\+?51\s*/, ''));
                setCustEmail(ord.customer_email && !ord.customer_email.includes('cliente.ocasional@') ? ord.customer_email : '');
                setCustDocType(ord.document_type || 'DNI');
                setCustDocNum(ord.document_number || '');

                if (ord.delivery_type === 'pickup') {
                    setShippingPreset('pickup');
                    setDeliveryType('pickup');
                    setShippingFeeInput('0.00');
                } else {
                    setShippingPreset('lima_metro');
                    setDeliveryType('local_delivery');
                    const loadedShip = ord.shipping_amount !== undefined && ord.shipping_amount !== null ? Number(ord.shipping_amount) : 10;
                    setShippingFeeInput(loadedShip.toFixed(2));
                }

                setShippingDepartment(ord.shipping_department || 'Lima');
                setShippingProvince(ord.shipping_province || 'Lima');
                setShippingDistrict(ord.shipping_district || '');
                setShippingAddressLine(ord.shipping_address_line || '');
                setShippingReference(ord.shipping_reference || '');

                if (res.items && res.items.length > 0) {
                    setSelectedItems(
                        res.items.map(it => ({
                            productId: it.product_id || it.id,
                            variantId: it.variant_id,
                            productName: it.product_name,
                            variantName: it.variant_name,
                            sku: it.sku,
                            image: it.image || it.image_url,
                            originalUnitPriceAmount: Math.round(Number(it.unit_price_amount || 0) * 100),
                            unitPriceAmount: Math.round(Number(it.unit_price_amount || 0) * 100),
                            quantity: Number(it.quantity || 1),
                            availableStock: 99,
                        }))
                    );
                }
            }
        });
    }, []);

    // ─── PRODUCT SEARCH (instantaneous in-memory via filteredStep1Products) ───

    // ─── HANDLERS ────────────────────────────────────────────────────
    const handleSelectCustomer = (c: CustomerOption) => {
        setSelectedCustomer(c);
        setCustName(c.name);
        setCustEmail(c.email);
        setCustPhone(c.phone || '');
        setCustDocType(c.document_type || 'DNI');
        setCustDocNum(c.document_number || '');

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
            setShippingMethodName('Recojo en tienda');
        } else {
            setDeliveryType('local_delivery');
            if (parseFloat(shippingFeeInput) === 0 || !shippingFeeInput) {
                setShippingFeeInput('10.00');
            }
            setShippingMethodName('Delivery');
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
        discountCents = Math.round((parseFloat(String(discountValue).replace(',', '.')) || 0) * 100);
    }

    const shippingCents = deliveryType === 'pickup' || deliveryType === 'none'
        ? 0
        : Math.round((parseFloat(String(shippingFeeInput).replace(',', '.')) || 0) * 100);
    const totalCents = Math.max(0, subtotalCents + shippingCents - discountCents);

    const paidCents = initialPaymentStatus === 'paid' ? totalCents : 0;
    const balanceCents = Math.max(0, totalCents - paidCents);

    // ─── SUBMIT ORDER ────────────────────────────────────────────────
    const handleSubmit = () => {
        setErrorMessage(null);

        const fullCustName = `${custName.trim()} ${custLastName.trim()}`.trim();
        if (!fullCustName) {
            setErrorMessage('Por favor ingrese el nombre del cliente.');
            return;
        }

        if (selectedItems.length === 0) {
            setErrorMessage('Debe agregar al menos un producto al pedido.');
            return;
        }

        // Save customer in localStorage for future instant predictions
        try {
            const newSaved: SavedCustomerRecord = {
                id: selectedCustomer?.id || `local-${Date.now()}`,
                firstName: custName.trim(),
                lastName: custLastName.trim(),
                fullName: fullCustName,
                phone: custPhone.trim(),
                email: custEmail.trim(),
                documentType: custDocType,
                documentNumber: custDocNum.trim(),
                department: shippingDepartment,
                province: shippingProvince,
                district: shippingDistrict,
                addressLine: shippingAddressLine,
                reference: shippingReference,
            };
            const localRaw = localStorage.getItem('tiendavir_saved_customers');
            const localList: SavedCustomerRecord[] = localRaw ? JSON.parse(localRaw) : [];
            const updatedLocal = [newSaved, ...localList.filter(x => x.phone !== newSaved.phone && x.fullName.toLowerCase() !== newSaved.fullName.toLowerCase())].slice(0, 30);
            localStorage.setItem('tiendavir_saved_customers', JSON.stringify(updatedLocal));
        } catch {
            // ignore
        }

        startTransition(async () => {
            const payload = {
                customerId: selectedCustomer?.id,
                customerName: fullCustName,
                customerEmail: custEmail.trim() || 'cliente.ocasional@codemarket.pe',
                customerPhone: custPhone.trim(),
                documentType: custDocType,
                documentNumber: custDocNum.trim(),
                source,
                sourceReference: `${salesperson ? `Vendedor: ${salesperson} • ` : ''}${sourceReference.trim()}`,
                deliveryType: deliveryType === 'custom' ? 'local_delivery' : deliveryType,
                shippingMethodName: deliveryType === 'pickup' ? 'Recojo en tienda' : shippingMethodName,
                shippingAmount: shippingCents / 100,
                recipientName: recipientName.trim() || fullCustName,
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
                initialOrderStatus: 'new' as const,
                customerNotes: customerNotes.trim(),
                internalNotes: `${discountReason ? `[Motivo Descuento]: ${discountReason}\n` : ''}${internalNotes.trim()}`,
                items: selectedItems.map(i => ({
                    ...i,
                    unitPriceAmount: i.unitPriceAmount / 100,
                    originalUnitPriceAmount: i.originalUnitPriceAmount / 100,
                })),
            };

            const res = editOrderId
                ? await updateManualOrderAction(editOrderId, payload)
                : await createManualOrderAction(payload);
            if (res.success && res.orderId) {
                router.push(`/admin/pedidos/${res.orderId}/generado`);
            } else {
                setErrorMessage(res.error || 'Error al guardar el pedido.');
            }
        });
    };

    return (
        <div>
            {/* ─── PASO 1: POS / GRID DE PRODUCTOS ─── */}
            {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '80px' }}>
                    {/* Layout Split POS */}
                    <div className="admin-split-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
                        {/* Izquierda: Buscador + Filtros + Productos */}
                        <div>
                            {/* Barra unificada de Buscador y Categorías */}
                            <div style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--structural-border, var(--glass-border))',
                                borderRadius: '14px',
                                padding: '16px 18px',
                                marginBottom: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                boxShadow: 'var(--shadow-sm)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Link
                                        href="/admin/pedidos"
                                        title="Volver a Pedidos"
                                        style={{
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '8px',
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--structural-border, var(--glass-border))',
                                            color: 'var(--foreground)',
                                            textDecoration: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            fontSize: '1.1rem',
                                            flexShrink: 0,
                                        }}
                                    >
                                        ←
                                    </Link>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem', color: 'var(--text-muted)' }}>🔍</span>
                                        <input
                                            type="search"
                                            name="pos_product_search"
                                            autoComplete="off"
                                            placeholder="Buscar producto por nombre..."
                                            value={productSearchQuery}
                                            onChange={(e) => setProductSearchQuery(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '9px 14px 9px 36px',
                                                background: 'var(--card-bg)',
                                                border: '1px solid var(--structural-border, var(--glass-border))',
                                                borderRadius: '8px',
                                                fontSize: '0.88rem',
                                                color: 'var(--input-text)',
                                                outline: 'none',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Botones de filtro funcionales y limpios */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {[
                                        { id: 'todos', name: 'Todos' },
                                        ...categories,
                                        { id: 'promociones', name: 'Promociones' },
                                    ].map((cat) => {
                                        const isActive = selectedCategory === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setSelectedCategory(cat.id)}
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '8px',
                                                    border: isActive
                                                        ? '1.5px solid var(--robotina-orange, #ff6b00)'
                                                        : '1px solid var(--structural-border, var(--glass-border))',
                                                    background: isActive
                                                        ? 'var(--robotina-orange, #ff6b00)'
                                                        : 'var(--card-bg)',
                                                    color: isActive ? '#ffffff' : 'var(--foreground)',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                }}
                                            >
                                                {cat.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Grid de Productos filtrados */}
                            {(() => {
                                const selectedCatObj = categories.find(c => c.id === selectedCategory);
                                const selectedCatName = selectedCatObj?.name.toLowerCase() || '';
                                const q = productSearchQuery.trim().toLowerCase();

                                const filteredPosProducts = allProducts.filter(p => {
                                    const matchesQuery = !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
                                    if (!matchesQuery) return false;

                                    if (selectedCategory === 'todos') return true;
                                    if (selectedCategory === 'promociones') return Boolean(p.has_promo);

                                    return (
                                        p.category_id === selectedCategory ||
                                        (p.category_name && p.category_name.toLowerCase() === selectedCatName) ||
                                        (p.category_name && p.category_name.toLowerCase() === selectedCategory.toLowerCase())
                                    );
                                });

                                if (filteredPosProducts.length === 0) {
                                    return (
                                        <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            No hay productos en esta categoría o búsqueda.
                                        </div>
                                    );
                                }

                                return (
                                    <div className="admin-pos-products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                                        {filteredPosProducts.map(p => (
                                            <div key={p.id} style={{
                                                background: 'var(--card-bg)',
                                                border: '1px solid var(--structural-border, var(--glass-border))',
                                                borderRadius: '14px',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                boxShadow: 'var(--shadow-sm)',
                                                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                            }}>
                                                <div style={{ height: '150px', width: '100%', background: 'var(--input-bg)' }}>
                                                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                    <div style={{ fontSize: '0.86rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '6px', color: 'var(--foreground)' }}>{p.name}</div>
                                                    <div style={{ fontSize: '0.92rem', color: 'var(--foreground)', fontWeight: 800, marginTop: 'auto', marginBottom: '12px' }}>{formatMoney(p.price_amount / 100)}</div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddProduct(p)}
                                                        style={{ width: '100%', padding: '9px', border: '1.5px solid var(--robotina-orange, #ff6b00)', borderRadius: '8px', background: 'var(--card-bg)', color: 'var(--robotina-orange, #ff6b00)', fontWeight: 800, cursor: 'pointer', fontSize: '0.78rem', transition: 'all 0.15s ease' }}
                                                    >
                                                        + AGREGAR
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Derecha: Resumen de Carrito */}
                        <div id="pos-cart-summary" className="admin-sticky-card" style={{
                            background: 'var(--card-bg)',
                            border: '1.5px solid var(--structural-border, var(--glass-border))',
                            borderRadius: '16px',
                            padding: '22px',
                            position: 'sticky',
                            top: '20px',
                            boxShadow: 'var(--shadow-md)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>Resumen de Productos</h3>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontWeight: 700 }}>
                                    {selectedItems.reduce((acc, item) => acc + item.quantity, 0)} {selectedItems.reduce((acc, item) => acc + item.quantity, 0) === 1 ? 'producto' : 'productos'}
                                </span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                                {selectedItems.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>El carrito está vacío.</div>
                                ) : (
                                    selectedItems.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingBottom: '14px', borderBottom: idx < selectedItems.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                                            <img src={item.image || '/web-basica-hero.png'} alt={item.productName} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--glass-border)', flexShrink: 0 }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                    <div style={{ fontSize: '0.86rem', fontWeight: 700, lineHeight: 1.3, color: 'var(--foreground)' }}>{item.productName}</div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(idx)}
                                                        title="Quitar producto"
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                                    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(idx, -1)}
                                                            style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '7px',
                                                                border: '1.5px solid var(--structural-border, #94a3b8)',
                                                                background: 'var(--background)',
                                                                color: 'var(--foreground)',
                                                                cursor: 'pointer',
                                                                fontSize: '1.05rem',
                                                                fontWeight: 800,
                                                                lineHeight: 1,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            −
                                                        </button>
                                                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--foreground)', minWidth: '20px', textAlign: 'center' }}>
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(idx, 1)}
                                                            style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '7px',
                                                                border: '1.5px solid var(--robotina-orange, #ff6b00)',
                                                                background: 'rgba(255, 107, 0, 0.1)',
                                                                color: 'var(--robotina-orange, #ff6b00)',
                                                                cursor: 'pointer',
                                                                fontSize: '1.05rem',
                                                                fontWeight: 800,
                                                                lineHeight: 1,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--foreground)' }}>
                                                        {formatMoney((item.unitPriceAmount * item.quantity) / 100)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {selectedItems.length > 0 && (
                                <>
                                    {/* Botones Añadir Descuento y Cupón */}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (activePromoTab === 'discount') {
                                                    setActivePromoTab('none');
                                                } else {
                                                    setActivePromoTab('discount');
                                                    if (discountType === 'none' || discountType === 'coupon') {
                                                        setDiscountType('percentage');
                                                        setAppliedCouponCode(null);
                                                        setCouponFeedback(null);
                                                    }
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '9px 10px',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                border: activePromoTab === 'discount' || (discountCents > 0 && !appliedCouponCode)
                                                    ? '1.5px solid var(--robotina-orange, #ff6b00)'
                                                    : '1.5px solid var(--structural-border, var(--glass-border))',
                                                background: activePromoTab === 'discount' || (discountCents > 0 && !appliedCouponCode)
                                                    ? 'rgba(255, 107, 0, 0.09)'
                                                    : 'var(--background)',
                                                color: activePromoTab === 'discount' || (discountCents > 0 && !appliedCouponCode)
                                                    ? 'var(--robotina-orange, #ff6b00)'
                                                    : 'var(--foreground)',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            {discountCents > 0 && !appliedCouponCode ? '✓ Descuento activo' : 'Añadir Descuento'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActivePromoTab(prev => prev === 'coupon' ? 'none' : 'coupon');
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '9px 10px',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                border: activePromoTab === 'coupon' || Boolean(appliedCouponCode)
                                                    ? '1.5px solid var(--robotina-orange, #ff6b00)'
                                                    : '1.5px solid var(--structural-border, var(--glass-border))',
                                                background: activePromoTab === 'coupon' || Boolean(appliedCouponCode)
                                                    ? 'rgba(255, 107, 0, 0.09)'
                                                    : 'var(--background)',
                                                color: activePromoTab === 'coupon' || Boolean(appliedCouponCode)
                                                    ? 'var(--robotina-orange, #ff6b00)'
                                                    : 'var(--foreground)',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            {appliedCouponCode ? `✓ ${appliedCouponCode}` : 'Cupón'}
                                        </button>
                                    </div>

                                    {/* Panel interactivo de Descuento (% o $) */}
                                    {activePromoTab === 'discount' && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            background: 'var(--background)',
                                            border: '1.5px solid var(--structural-border, var(--glass-border))',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--foreground)' }}>
                                                    Tipo de descuento
                                                </span>
                                                {(parseFloat(discountValue) > 0) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDiscountType('none');
                                                            setDiscountValue('');
                                                            setDiscountReason('');
                                                            setActivePromoTab('none');
                                                        }}
                                                        style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                                                    >
                                                        Quitar descuento
                                                    </button>
                                                )}
                                            </div>

                                            {/* Selector % / $ y campo de monto en una sola línea */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button
                                                    type="button"
                                                    title="Descuento en porcentaje (%)"
                                                    onClick={() => {
                                                        setDiscountType('percentage');
                                                        setAppliedCouponCode(null);
                                                    }}
                                                    style={{
                                                        width: '38px',
                                                        height: '38px',
                                                        flexShrink: 0,
                                                        borderRadius: '8px',
                                                        fontWeight: 900,
                                                        fontSize: '1rem',
                                                        cursor: 'pointer',
                                                        border: discountType === 'percentage'
                                                            ? '1.5px solid var(--robotina-orange, #ff6b00)'
                                                            : '1.5px solid var(--structural-border, var(--glass-border))',
                                                        background: discountType === 'percentage' ? 'var(--robotina-orange, #ff6b00)' : 'var(--card-bg)',
                                                        color: discountType === 'percentage' ? '#ffffff' : 'var(--foreground)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    %
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Descuento en dinero ($)"
                                                    onClick={() => {
                                                        setDiscountType('fixed');
                                                        setAppliedCouponCode(null);
                                                    }}
                                                    style={{
                                                        width: '38px',
                                                        height: '38px',
                                                        flexShrink: 0,
                                                        borderRadius: '8px',
                                                        fontWeight: 900,
                                                        fontSize: '1rem',
                                                        cursor: 'pointer',
                                                        border: discountType === 'fixed'
                                                            ? '1.5px solid var(--robotina-orange, #ff6b00)'
                                                            : '1.5px solid var(--structural-border, var(--glass-border))',
                                                        background: discountType === 'fixed' ? 'var(--robotina-orange, #ff6b00)' : 'var(--card-bg)',
                                                        color: discountType === 'fixed' ? '#ffffff' : 'var(--foreground)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    $
                                                </button>

                                                <div style={{
                                                    flex: 1,
                                                    height: '38px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    background: 'var(--card-bg)',
                                                    border: '1.5px solid var(--structural-border, var(--glass-border))',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={discountType === 'percentage' ? '100' : undefined}
                                                        step={discountType === 'percentage' ? '1' : '0.50'}
                                                        placeholder={discountType === 'percentage' ? 'Ej: 10%' : 'Ej: 15.00'}
                                                        value={discountValue}
                                                        onChange={e => {
                                                            setAppliedCouponCode(null);
                                                            if (discountType === 'none' || discountType === 'coupon') {
                                                                setDiscountType('percentage');
                                                            }
                                                            setDiscountValue(e.target.value);
                                                        }}
                                                        style={{
                                                            border: 'none',
                                                            background: 'transparent',
                                                            padding: '0 12px',
                                                            width: '100%',
                                                            height: '100%',
                                                            outline: 'none',
                                                            fontSize: '0.9rem',
                                                            fontWeight: 700,
                                                            color: 'var(--foreground)',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Panel interactivo de Cupón */}
                                    {activePromoTab === 'coupon' && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            background: 'var(--background)',
                                            border: '1.5px solid var(--structural-border, var(--glass-border))',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--foreground)' }}>
                                                    Código de cupón
                                                </span>
                                                {appliedCouponCode && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAppliedCouponCode(null);
                                                            setCouponCodeInput('');
                                                            setCouponFeedback(null);
                                                            setDiscountType('none');
                                                            setDiscountValue('');
                                                            setDiscountReason('');
                                                        }}
                                                        style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                                                    >
                                                        Quitar cupón
                                                    </button>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: OFERTA10"
                                                    value={couponCodeInput}
                                                    onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px 10px',
                                                        borderRadius: '8px',
                                                        border: '1.5px solid var(--structural-border, var(--glass-border))',
                                                        background: 'var(--card-bg)',
                                                        fontSize: '0.84rem',
                                                        fontWeight: 700,
                                                        color: 'var(--foreground)',
                                                        outline: 'none',
                                                        textTransform: 'uppercase',
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const res = await CouponService.validateCoupon(couponCodeInput, subtotalCents);
                                                        if (res.valid && res.coupon) {
                                                            setAppliedCouponCode(res.coupon.code);
                                                            if (res.coupon.discount_type === 'percentage') {
                                                                setDiscountType('percentage');
                                                                setDiscountValue(String(res.coupon.discount_value));
                                                            } else {
                                                                setDiscountType('fixed');
                                                                setDiscountValue(String((res.coupon.discount_value / 100).toFixed(2)));
                                                            }
                                                            setDiscountReason(`Cupón ${res.coupon.code}`);
                                                            setCouponFeedback({ ok: true, msg: res.message });
                                                        } else {
                                                            setCouponFeedback({ ok: false, msg: res.message });
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '8px 14px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: 'var(--robotina-orange, #ff6b00)',
                                                        color: '#ffffff',
                                                        fontWeight: 800,
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Aplicar
                                                </button>
                                            </div>

                                            {availableCoupons.length > 0 && (
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Disponibles:</span>
                                                    {availableCoupons.slice(0, 4).map(cp => (
                                                        <button
                                                            key={cp.id}
                                                            type="button"
                                                            onClick={async () => {
                                                                setCouponCodeInput(cp.code);
                                                                const res = await CouponService.validateCoupon(cp.code, subtotalCents);
                                                                if (res.valid && res.coupon) {
                                                                    setAppliedCouponCode(res.coupon.code);
                                                                    if (res.coupon.discount_type === 'percentage') {
                                                                        setDiscountType('percentage');
                                                                        setDiscountValue(String(res.coupon.discount_value));
                                                                    } else {
                                                                        setDiscountType('fixed');
                                                                        setDiscountValue(String((res.coupon.discount_value / 100).toFixed(2)));
                                                                    }
                                                                    setDiscountReason(`Cupón ${res.coupon.code}`);
                                                                    setCouponFeedback({ ok: true, msg: res.message });
                                                                } else {
                                                                    setCouponFeedback({ ok: false, msg: res.message });
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '3px 8px',
                                                                borderRadius: '6px',
                                                                border: '1px solid var(--structural-border, var(--glass-border))',
                                                                background: 'var(--card-bg)',
                                                                color: 'var(--foreground)',
                                                                fontSize: '0.72rem',
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            {cp.code} ({cp.discount_type === 'percentage' ? `${cp.discount_value}%` : `S/ ${(cp.discount_value / 100).toFixed(0)}`})
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {couponFeedback && (
                                                <div style={{
                                                    fontSize: '0.76rem',
                                                    fontWeight: 700,
                                                    color: couponFeedback.ok ? '#16a34a' : '#dc2626',
                                                }}>
                                                    {couponFeedback.msg}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div style={{ marginTop: '20px', background: 'var(--background)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Subtotal</span>
                                            <span style={{ fontWeight: 700 }}>{formatMoney(subtotalCents / 100)}</span>
                                        </div>
                                        {discountCents > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#16a34a', fontWeight: 700 }}>
                                                <span>
                                                    Descuento {appliedCouponCode ? `(${appliedCouponCode})` : discountType === 'percentage' ? `(${discountValue}%)` : ''}
                                                </span>
                                                <span>-{formatMoney(discountCents / 100)}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, paddingTop: '6px', borderTop: '1px solid var(--glass-border)' }}>
                                            <span>Total</span>
                                            <span>{formatMoney( Math.max(0, subtotalCents - discountCents) / 100 )}</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setStep(2)}
                                        style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'var(--robotina-orange, #ff6b00)', color: '#ffffff', border: 'none', fontWeight: 800, fontSize: '0.95rem', marginTop: '20px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)' }}
                                    >
                                        Continuar →
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Barra flotante inferior en móviles para ir directo al Paso 2 */}
                    {selectedItems.length > 0 && (
                        <div
                            className="admin-mobile-only"
                            style={{
                                position: 'fixed',
                                bottom: '12px',
                                left: '12px',
                                right: '12px',
                                zIndex: 90,
                                background: 'var(--card-bg)',
                                border: '1.5px solid var(--robotina-orange, #ff6b00)',
                                borderRadius: '14px',
                                padding: '12px 16px',
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.28)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                        {selectedItems.reduce((acc, item) => acc + item.quantity, 0)} {selectedItems.reduce((acc, item) => acc + item.quantity, 0) === 1 ? 'producto' : 'productos'}
                                    </div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--foreground)' }}>
                                        {formatMoney(Math.max(0, subtotalCents - discountCents) / 100)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            document.getElementById('pos-cart-summary')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--structural-border, var(--glass-border))',
                                            background: 'var(--background)',
                                            color: 'var(--foreground)',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                        }}
                                    >
                                        Ver carrito
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: 'var(--robotina-orange, #ff6b00)',
                                            color: '#ffffff',
                                            fontWeight: 800,
                                            fontSize: '0.86rem',
                                            boxShadow: '0 4px 12px rgba(255, 107, 0, 0.3)',
                                        }}
                                    >
                                        Continuar →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── PASO 2: FORMULARIO ESTRUCTURADO Y CON RELIEVE ─── */}
            <div style={{ display: step === 2 ? 'block' : 'none', paddingBottom: '48px' }}>
                {/* Barra superior con botón a la izquierda */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            title="Volver a Productos"
                            style={{
                                padding: '9px 14px',
                                background: 'var(--card-bg)',
                                border: '1.5px solid var(--structural-border, var(--glass-border))',
                                borderRadius: '10px',
                                color: 'var(--foreground)',
                                fontSize: '0.86rem',
                                cursor: 'pointer',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
                                flexShrink: 0,
                            }}
                        >
                            <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>←</span>
                            <span className="admin-desktop-only">Volver a Productos</span>
                        </button>
                        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.3 }}>
                            Completa los datos del cliente, canal y entrega para finalizar el pedido.
                        </span>
                    </div>
                    {editOrderId && (
                        <Link
                            href={`/admin/pedidos/${editOrderId}`}
                            style={{
                                padding: '9px 16px',
                                background: 'var(--card-bg)',
                                border: '1.5px solid var(--structural-border, var(--glass-border))',
                                borderRadius: '10px',
                                color: 'var(--foreground)',
                                fontSize: '0.86rem',
                                textDecoration: 'none',
                                fontWeight: 700,
                            }}
                        >
                            Cancelar edición
                        </Link>
                    )}
                </div>

                {errorMessage && (
                    <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.12)', border: '1.5px solid #ef4444', borderRadius: '12px', color: '#dc2626', marginBottom: '20px', fontWeight: 700 }}>
                        ⚠️ {errorMessage}
                    </div>
                )}

                {/* 70% LEFT FORM / 30% STICKY SUMMARY LAYOUT */}
                <div className="admin-split-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '24px', alignItems: 'start' }}>

                {/* 70% LEFT COLUMN — FORM SECTIONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* SECTION 1: INFORMACIÓN DEL CLIENTE */}
                    <div
                        ref={customerCardRef}
                        style={{
                            background: 'var(--card-bg)',
                            border: '1.5px solid var(--structural-border, var(--glass-border))',
                            borderRadius: '14px',
                            overflow: 'visible',
                            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                            position: 'relative',
                        }}
                    >
                        {/* Header de la tarjeta */}
                        <div style={{
                            padding: '16px 22px',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <span style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 107, 0, 0.12)',
                                    color: 'var(--robotina-orange, #ff6b00)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                }}>
                                    1
                                </span>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                                    Información del Cliente
                                </h3>
                                {selectedCustomer && (
                                    <span style={{
                                        fontSize: '0.74rem',
                                        background: 'rgba(22, 163, 74, 0.12)',
                                        color: '#15803d',
                                        border: '1px solid rgba(22, 163, 74, 0.3)',
                                        padding: '3px 10px',
                                        borderRadius: '6px',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}>
                                        ✓ Autocompletado ({selectedCustomer.name})
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedCustomer(null);
                                                setCustPhone('');
                                                setCustName('');
                                                setCustLastName('');
                                                setCustDocNum('');
                                                setCustEmail('');
                                            }}
                                            style={{ background: 'transparent', border: 'none', color: '#15803d', cursor: 'pointer', fontWeight: 800, fontSize: '0.74rem', padding: 0, marginLeft: '2px' }}
                                            title="Limpiar campos"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                )}
                            </div>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Datos de contacto para el pedido
                            </span>
                        </div>

                        {/* Cuerpo del formulario en cuadrícula de 2 columnas con relieve */}
                        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                            {/* Fila 1: Nombres y Apellidos */}
                            <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                                        Nombres <span style={{ color: 'var(--robotina-orange, #ff6b00)' }}>*</span>
                                    </label>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'var(--background)',
                                        border: activeField === 'name'
                                            ? '1.5px solid var(--robotina-orange, #ff6b00)'
                                            : '1.5px solid var(--structural-border, var(--glass-border))',
                                        boxShadow: activeField === 'name' ? '0 0 0 3px rgba(255, 107, 0, 0.12)' : 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
                                        borderRadius: '10px',
                                        padding: '10px 12px',
                                        transition: 'all 0.15s ease',
                                    }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>🔍</span>
                                        <input
                                            type="text"
                                            placeholder="Busca o escribe el nombre..."
                                            value={custName}
                                            onFocus={() => setActiveField('name')}
                                            onChange={e => {
                                                setCustName(e.target.value);
                                                setActiveField('name');
                                            }}
                                            style={{ border: 'none', background: 'transparent', flex: 1, outline: 'none', fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 500 }}
                                        />
                                    </div>

                                    {/* Popover compacto de sugerencias (solo al escribir el nombre) */}
                                    {activeField === 'name' && (() => {
                                        const predictions = getFilteredPredictions();
                                        if (predictions.length === 0) return null;
                                        return (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 'calc(100% + 6px)',
                                                    left: 0,
                                                    width: '100%',
                                                    background: 'var(--card-bg)',
                                                    border: '1.5px solid var(--structural-border, var(--glass-border))',
                                                    borderRadius: '10px',
                                                    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.14)',
                                                    zIndex: 130,
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <div style={{ maxHeight: '190px', overflowY: 'auto' }}>
                                                    {predictions.map((c, pIdx) => (
                                                        <button
                                                            key={c.id}
                                                            type="button"
                                                            onClick={() => handleAutocompleteSelect(c)}
                                                            style={{
                                                                width: '100%',
                                                                textAlign: 'left',
                                                                padding: '8px 12px',
                                                                background: 'transparent',
                                                                border: 'none',
                                                                borderBottom: pIdx < predictions.length - 1 ? '1px solid var(--glass-border)' : 'none',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                minHeight: 'auto',
                                                            }}
                                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--background)')}
                                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                        >
                                                            <div style={{ minWidth: 0 }}>
                                                                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {c.firstName} {c.lastName}
                                                                </div>
                                                                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {[c.phone ? `+51 ${c.phone}` : null, c.district].filter(Boolean).join(' · ')}
                                                                </div>
                                                            </div>
                                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--robotina-orange, #ff6b00)', flexShrink: 0 }}>
                                                                Elegir
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                                        Apellidos
                                    </label>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'var(--background)',
                                        border: activeField === 'lastName'
                                            ? '1.5px solid var(--robotina-orange, #ff6b00)'
                                            : '1.5px solid var(--structural-border, var(--glass-border))',
                                        boxShadow: activeField === 'lastName' ? '0 0 0 3px rgba(255, 107, 0, 0.12)' : 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
                                        borderRadius: '10px',
                                        padding: '10px 12px',
                                        transition: 'all 0.15s ease',
                                    }}>
                                        <input
                                            type="text"
                                            placeholder="Apellidos del cliente..."
                                            value={custLastName}
                                            onFocus={() => setActiveField('lastName')}
                                            onChange={e => {
                                                setCustLastName(e.target.value);
                                                setActiveField('lastName');
                                            }}
                                            style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 500 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Fila 2: Teléfono y Documento de Identidad */}
                            <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div ref={countryPickerRef} style={{ position: 'relative' }}>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                                        Número telefónico <span style={{ color: 'var(--robotina-orange, #ff6b00)' }}>*</span>
                                    </label>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'var(--background)',
                                        border: activeField === 'phone' || countryDropdownOpen
                                            ? '1.5px solid var(--robotina-orange, #ff6b00)'
                                            : '1.5px solid var(--structural-border, var(--glass-border))',
                                        boxShadow: activeField === 'phone' || countryDropdownOpen ? '0 0 0 3px rgba(255, 107, 0, 0.12)' : 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
                                        borderRadius: '10px',
                                        padding: '7px 12px 7px 8px',
                                        transition: 'all 0.15s ease',
                                    }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCountryDropdownOpen(prev => !prev);
                                                setCountrySearch('');
                                            }}
                                            title={`${selectedPhoneCountry.name} (${selectedPhoneCountry.dial})`}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 8px',
                                                borderRadius: '7px',
                                                background: 'var(--card-bg)',
                                                border: '1px solid var(--structural-border, var(--glass-border))',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                color: 'var(--foreground)',
                                                flexShrink: 0,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <img
                                                src={`https://flagcdn.com/w40/${selectedPhoneCountry.iso}.png`}
                                                alt={selectedPhoneCountry.name}
                                                style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }}
                                            />
                                            <span>{selectedPhoneCountry.dial}</span>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>▾</span>
                                        </button>
                                        <input
                                            type="text"
                                            placeholder="Ej: 987 654 321"
                                            value={custPhone}
                                            onFocus={() => setActiveField('phone')}
                                            onChange={e => {
                                                setCustPhone(e.target.value);
                                                setActiveField('phone');
                                            }}
                                            style={{ border: 'none', background: 'transparent', flex: 1, outline: 'none', fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 500 }}
                                        />
                                    </div>

                                    {/* Menú desplegable de países con bandera y buscador */}
                                    {countryDropdownOpen && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 6px)',
                                            left: 0,
                                            width: '280px',
                                            maxWidth: 'calc(100vw - 48px)',
                                            background: 'var(--card-bg)',
                                            border: '1.5px solid var(--structural-border, var(--glass-border))',
                                            borderRadius: '10px',
                                            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.16)',
                                            zIndex: 120,
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{ padding: '8px', borderBottom: '1px solid var(--glass-border)', background: 'var(--background)' }}>
                                                <input
                                                    type="search"
                                                    autoComplete="off"
                                                    placeholder="Buscar país o código (+51)..."
                                                    value={countrySearch}
                                                    onChange={e => setCountrySearch(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '7px 10px',
                                                        borderRadius: '7px',
                                                        border: '1px solid var(--structural-border, var(--glass-border))',
                                                        background: 'var(--card-bg)',
                                                        fontSize: '0.8rem',
                                                        color: 'var(--foreground)',
                                                        outline: 'none',
                                                    }}
                                                />
                                            </div>
                                            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                                {COUNTRY_DIAL_CODES.filter(c => {
                                                    const q = countrySearch.trim().toLowerCase();
                                                    if (!q) return true;
                                                    return c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.iso.includes(q);
                                                }).map((c) => {
                                                    const isSelected = c.iso === selectedPhoneCountry.iso;
                                                    return (
                                                        <button
                                                            key={c.iso}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedPhoneCountry(c);
                                                                setCountryDropdownOpen(false);
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                padding: '8px 12px',
                                                                border: 'none',
                                                                borderBottom: '1px solid var(--glass-border)',
                                                                background: isSelected ? 'rgba(255, 107, 0, 0.08)' : 'transparent',
                                                                color: isSelected ? 'var(--robotina-orange, #ff6b00)' : 'var(--foreground)',
                                                                fontWeight: isSelected ? 700 : 500,
                                                                fontSize: '0.84rem',
                                                                cursor: 'pointer',
                                                                textAlign: 'left',
                                                            }}
                                                        >
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                                <img
                                                                    src={`https://flagcdn.com/w40/${c.iso}.png`}
                                                                    alt={c.name}
                                                                    style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }}
                                                                />
                                                                <span>{c.name}</span>
                                                            </span>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? 'var(--robotina-orange, #ff6b00)' : 'var(--text-muted)' }}>
                                                                {c.dial}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                                        Documento de identidad <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>(opcional)</span>
                                    </label>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'var(--background)',
                                        border: activeField === 'doc'
                                            ? '1.5px solid var(--robotina-orange, #ff6b00)'
                                            : '1.5px solid var(--structural-border, var(--glass-border))',
                                        boxShadow: activeField === 'doc' ? '0 0 0 3px rgba(255, 107, 0, 0.12)' : 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
                                        borderRadius: '10px',
                                        padding: '10px 12px',
                                        transition: 'all 0.15s ease',
                                    }}>
                                        <input
                                            type="text"
                                            placeholder="DNI o RUC..."
                                            value={custDocNum}
                                            onFocus={() => setActiveField('doc')}
                                            onChange={e => {
                                                setCustDocNum(e.target.value);
                                                setActiveField('doc');
                                            }}
                                            style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 500 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Fila 3: Correo electrónico */}
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                                    Correo electrónico
                                </label>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'var(--background)',
                                    border: activeField === 'email'
                                        ? '1.5px solid var(--robotina-orange, #ff6b00)'
                                        : '1.5px solid var(--structural-border, var(--glass-border))',
                                    boxShadow: activeField === 'email' ? '0 0 0 3px rgba(255, 107, 0, 0.12)' : 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
                                    borderRadius: '10px',
                                    padding: '10px 12px',
                                    transition: 'all 0.15s ease',
                                }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>✉️</span>
                                    <input
                                        type="email"
                                        placeholder="correo@ejemplo.com"
                                        value={custEmail}
                                        onFocus={() => setActiveField('email')}
                                        onChange={e => {
                                            setCustEmail(e.target.value);
                                            setActiveField('email');
                                        }}
                                        style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 500 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: CANAL Y VENDEDOR */}
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1.5px solid var(--structural-border, var(--glass-border))',
                        borderRadius: '14px',
                        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '15px 22px',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}>
                            <span style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '8px',
                                background: 'rgba(255, 107, 0, 0.12)',
                                color: 'var(--robotina-orange, #ff6b00)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                            }}>
                                2
                            </span>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                                Canal de Venta y Vendedor
                            </h3>
                        </div>
                        <div className="admin-grid-3" style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                                    Canal de Venta <span style={{ color: 'var(--robotina-orange, #ff6b00)' }}>*</span>
                                </label>
                                <select
                                    value={source}
                                    onChange={e => setSource(e.target.value as 'online_store' | 'manual' | 'whatsapp' | 'instagram' | 'facebook' | 'phone' | 'pos' | 'other')}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: 'var(--background)',
                                        border: '1.5px solid var(--structural-border, var(--glass-border))',
                                        borderRadius: '10px',
                                        color: 'var(--foreground)',
                                        fontSize: '0.88rem',
                                        fontWeight: 600,
                                        outline: 'none',
                                    }}
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
                                <label style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                                    Referencia (Teléfono / @usuario)
                                </label>
                                <input
                                    type="text"
                                    value={sourceReference}
                                    onChange={e => setSourceReference(e.target.value)}
                                    placeholder="+51 999 000 000 o @usuario"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: 'var(--background)',
                                        border: '1.5px solid var(--structural-border, var(--glass-border))',
                                        borderRadius: '10px',
                                        color: 'var(--foreground)',
                                        fontSize: '0.88rem',
                                        fontWeight: 500,
                                        outline: 'none',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                                    Vendedor / Atendido por
                                </label>
                                <select
                                    value={salesperson}
                                    onChange={e => setSalesperson(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: 'var(--background)',
                                        border: '1.5px solid var(--structural-border, var(--glass-border))',
                                        borderRadius: '10px',
                                        color: 'var(--foreground)',
                                        fontSize: '0.88rem',
                                        fontWeight: 600,
                                        outline: 'none',
                                    }}
                                >
                                    <option value="Andrés Tate (Administrador)">Andrés Tate (Admin)</option>
                                    <option value="Vendedor 1 (SaaS)">Vendedor 1 (Equipo)</option>
                                    <option value="Sistema / Automático">Sistema / Automático</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: MÉTODO DE ENTREGA Y DIRECCIÓN */}
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1.5px solid var(--structural-border, var(--glass-border))',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                    }}>
                        <div style={{
                            padding: '15px 22px',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}>
                            <span style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '8px',
                                background: 'rgba(255, 107, 0, 0.12)',
                                color: 'var(--robotina-orange, #ff6b00)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                            }}>
                                3
                            </span>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                                Método de Entrega
                            </h3>
                        </div>

                        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Tarjetas de selección de modalidad en 2 columnas */}
                            <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    padding: '14px 16px',
                                    background: shippingPreset === 'pickup' ? 'rgba(255, 107, 0, 0.07)' : 'var(--background)',
                                    border: shippingPreset === 'pickup'
                                        ? '1.5px solid var(--robotina-orange, #ff6b00)'
                                        : '1.5px solid var(--structural-border, var(--glass-border))',
                                    borderRadius: '12px',
                                    transition: 'all 0.15s ease',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            border: shippingPreset === 'pickup' ? '6px solid var(--robotina-orange, #ff6b00)' : '2px solid var(--text-muted)',
                                            background: '#ffffff',
                                            flexShrink: 0,
                                        }} />
                                        <div>
                                            <div style={{ fontSize: '0.92rem', color: 'var(--foreground)', fontWeight: 800 }}>
                                                🏪 Recoger en tienda
                                            </div>
                                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                El cliente recoge su pedido en el local
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                                        Gratis
                                    </span>
                                    <input
                                        type="radio"
                                        name="shippingMethod"
                                        checked={shippingPreset === 'pickup'}
                                        onChange={() => handleSelectShippingPreset('pickup')}
                                        style={{ display: 'none' }}
                                    />
                                </label>

                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    padding: '14px 16px',
                                    background: shippingPreset !== 'pickup' ? 'rgba(255, 107, 0, 0.07)' : 'var(--background)',
                                    border: shippingPreset !== 'pickup'
                                        ? '1.5px solid var(--robotina-orange, #ff6b00)'
                                        : '1.5px solid var(--structural-border, var(--glass-border))',
                                    borderRadius: '12px',
                                    transition: 'all 0.15s ease',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            border: shippingPreset !== 'pickup' ? '6px solid var(--robotina-orange, #ff6b00)' : '2px solid var(--text-muted)',
                                            background: '#ffffff',
                                            flexShrink: 0,
                                        }} />
                                        <div>
                                            <div style={{ fontSize: '0.92rem', color: 'var(--foreground)', fontWeight: 800 }}>
                                                🚚 Delivery a domicilio
                                            </div>
                                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                Envío a dirección en Lima o provincia
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--robotina-orange, #ff6b00)', background: 'rgba(255, 107, 0, 0.12)', padding: '4px 8px', borderRadius: '6px' }}>
                                        S/ {Number(shippingFeeInput || 0).toFixed(2)}
                                    </span>
                                    <input
                                        type="radio"
                                        name="shippingMethod"
                                        checked={shippingPreset !== 'pickup'}
                                        onChange={() => handleSelectShippingPreset('lima_metro')}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>

                            {/* FORMULARIO DE DIRECCIÓN Y COSTO CUANDO SE ELIGE DELIVERY */}
                            {shippingPreset !== 'pickup' && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    paddingTop: '14px',
                                    borderTop: '1px solid var(--glass-border)',
                                }}>
                                    {/* Dirección exacta */}
                                    <div>
                                        <label style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                                            Dirección de entrega <span style={{ color: 'var(--robotina-orange, #ff6b00)' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Av. Larco 450, Dpto 302"
                                            value={shippingAddressLine}
                                            onChange={e => setShippingAddressLine(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: 'var(--background)',
                                                border: '1.5px solid var(--structural-border, var(--glass-border))',
                                                borderRadius: '10px',
                                                fontSize: '0.9rem',
                                                color: 'var(--foreground)',
                                                fontWeight: 500,
                                                outline: 'none',
                                            }}
                                        />
                                    </div>

                                    {/* Departamento, Provincia y Distrito */}
                                    <div className="admin-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: '14px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                                                Departamento
                                            </label>
                                            <input
                                                type="text"
                                                value={shippingDepartment}
                                                onChange={e => setShippingDepartment(e.target.value)}
                                                placeholder="Lima"
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    background: 'var(--background)',
                                                    border: '1.5px solid var(--structural-border, var(--glass-border))',
                                                    borderRadius: '10px',
                                                    fontSize: '0.9rem',
                                                    color: 'var(--foreground)',
                                                    fontWeight: 600,
                                                    outline: 'none',
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                                                Provincia
                                            </label>
                                            <input
                                                type="text"
                                                value={shippingProvince}
                                                onChange={e => setShippingProvince(e.target.value)}
                                                placeholder="Lima"
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    background: 'var(--background)',
                                                    border: '1.5px solid var(--structural-border, var(--glass-border))',
                                                    borderRadius: '10px',
                                                    fontSize: '0.9rem',
                                                    color: 'var(--foreground)',
                                                    fontWeight: 600,
                                                    outline: 'none',
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                                                Distrito <span style={{ color: 'var(--robotina-orange, #ff6b00)' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                list="lima-districts-list"
                                                value={shippingDistrict}
                                                onChange={e => setShippingDistrict(e.target.value)}
                                                placeholder="Ej: Miraflores, Surco..."
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    background: 'var(--background)',
                                                    border: '1.5px solid var(--structural-border, var(--glass-border))',
                                                    borderRadius: '10px',
                                                    fontSize: '0.9rem',
                                                    color: 'var(--foreground)',
                                                    fontWeight: 500,
                                                    outline: 'none',
                                                }}
                                            />
                                            <datalist id="lima-districts-list">
                                                <option value="Miraflores" />
                                                <option value="San Isidro" />
                                                <option value="Santiago de Surco" />
                                                <option value="San Borja" />
                                                <option value="La Molina" />
                                                <option value="Barranco" />
                                                <option value="Jesús María" />
                                                <option value="Lince" />
                                                <option value="Magdalena del Mar" />
                                                <option value="Pueblo Libre" />
                                                <option value="San Miguel" />
                                                <option value="Cercado de Lima" />
                                                <option value="La Victoria" />
                                                <option value="Breña" />
                                                <option value="Chorrillos" />
                                                <option value="Surquillo" />
                                                <option value="Los Olivos" />
                                                <option value="San Martín de Porres" />
                                                <option value="Independencia" />
                                                <option value="Comas" />
                                                <option value="San Juan de Lurigancho" />
                                                <option value="San Juan de Miraflores" />
                                                <option value="Villa María del Triunfo" />
                                                <option value="Villa El Salvador" />
                                                <option value="Ate" />
                                                <option value="Santa Anita" />
                                                <option value="Callao" />
                                            </datalist>
                                        </div>
                                    </div>

                                    {/* Referencia */}
                                    <div>
                                        <label style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                                            Referencia de ubicación <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>(opcional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Frente al parque, edificio gris, portón negro..."
                                            value={shippingReference}
                                            onChange={e => setShippingReference(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: 'var(--background)',
                                                border: '1.5px solid var(--structural-border, var(--glass-border))',
                                                borderRadius: '10px',
                                                fontSize: '0.9rem',
                                                color: 'var(--foreground)',
                                                fontWeight: 500,
                                                outline: 'none',
                                            }}
                                        />
                                    </div>

                                    {/* Tarifa de Delivery integrada */}
                                    <div style={{
                                        background: 'var(--background)',
                                        border: '1.5px solid var(--structural-border, var(--glass-border))',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '14px',
                                        flexWrap: 'wrap',
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--foreground)' }}>
                                                Costo de Delivery
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Elige una tarifa rápida o escribe el monto exacto
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            {['0', '8', '10', '12', '15', '20'].map(presetVal => {
                                                const isSelected = parseFloat(shippingFeeInput || '0') === parseFloat(presetVal);
                                                return (
                                                    <button
                                                        key={presetVal}
                                                        type="button"
                                                        onClick={() => setShippingFeeInput(Number(presetVal).toFixed(2))}
                                                        style={{
                                                            padding: '6px 11px',
                                                            borderRadius: '8px',
                                                            fontSize: '0.78rem',
                                                            fontWeight: 700,
                                                            cursor: 'pointer',
                                                            border: isSelected
                                                                ? '1.5px solid var(--robotina-orange, #ff6b00)'
                                                                : '1px solid var(--structural-border, var(--glass-border))',
                                                            background: isSelected ? 'var(--robotina-orange, #ff6b00)' : 'var(--card-bg)',
                                                            color: isSelected ? '#ffffff' : 'var(--foreground)',
                                                            transition: 'all 0.15s ease',
                                                        }}
                                                    >
                                                        {presetVal === '0' ? 'Gratis' : `S/ ${presetVal}`}
                                                    </button>
                                                );
                                            })}

                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                background: 'var(--card-bg)',
                                                border: '1.5px solid var(--structural-border, var(--glass-border))',
                                                borderRadius: '8px',
                                                padding: '6px 10px',
                                                width: '115px',
                                            }}>
                                                <span style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-muted)' }}>S/</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.50"
                                                    value={shippingFeeInput}
                                                    onChange={e => setShippingFeeInput(e.target.value)}
                                                    placeholder="10.00"
                                                    style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.9rem', fontWeight: 800, color: 'var(--foreground)' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 30% RIGHT COLUMN — STICKY COMPREHENSIVE SUMMARY CARD */}
                <div className="admin-sticky-card" style={{ position: 'sticky', top: '24px' }}>
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1.5px solid var(--structural-border, var(--glass-border))',
                        borderRadius: '14px',
                        padding: '22px',
                        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '14px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>RESUMEN DEL PEDIDO</span>
                            <span style={{ fontSize: '0.76rem', color: 'var(--robotina-orange, #ff6b00)', background: 'rgba(255, 107, 0, 0.1)', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                {selectedItems.reduce((a, b) => a + b.quantity, 0)} productos
                            </span>
                        </h3>

                        {/* Itemized List Summary */}
                        <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
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
                                                    style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--glass-border)' }}
                                                />
                                            )}
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                                                <span style={{ fontWeight: 700 }}>{item.productName}</span>
                                                {item.variantName && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> ({item.variantName})</span>}
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> × {item.quantity}</span>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, flexShrink: 0 }}>
                                            {formatMoney((item.unitPriceAmount * item.quantity) / 100)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Financial Totals */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                <span>Subtotal</span>
                                <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{formatMoney(subtotalCents / 100)}</span>
                            </div>

                            {discountCents > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--foreground)', fontWeight: 600 }}>
                                    <span>Descuento</span>
                                    <span>-{formatMoney(discountCents / 100)}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                <span>{shippingPreset === 'pickup' ? 'Recojo en tienda' : 'Delivery'}</span>
                                <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{formatMoney(shippingCents / 100)}</span>
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', color: 'var(--foreground)', fontWeight: 800, fontSize: '1.25rem',
                                borderTop: '1px solid var(--glass-border)', paddingTop: '10px', marginTop: '4px'
                            }}>
                                <span>TOTAL</span>
                                <span style={{ color: 'var(--foreground)' }}>{formatMoney(totalCents / 100)}</span>
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
                                background: 'var(--robotina-orange, #ff6b00)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)',
                                transition: 'var(--transition)'
                            }}
                        >
                            {isPending ? 'Procesando pedido...' : 'Aceptar'}
                        </button>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}
