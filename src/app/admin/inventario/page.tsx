'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminFilters from '@/components/admin/AdminFilters';
import { getInstantProducts, CatalogProduct } from '@/modules/catalog/queries';
import { AdminProductService } from '@/lib/services/adminProductService';

export interface InventoryLog {
    id: string;
    product_id: string;
    product_title: string;
    sku: string;
    movement_type: 'stock_inicial' | 'ajuste_manual' | 'venta' | 'cancelacion' | 'devolucion' | 'reposicion';
    quantity_change: number;
    new_stock: number;
    reason: string;
    created_at: string;
}

export default function AdminInventoryPage() {
    const [products, setProducts] = useState<CatalogProduct[]>(() => getInstantProducts());
    const [logs, setLogs] = useState<InventoryLog[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                return JSON.parse(localStorage.getItem('admin_inventory_logs') || '[]');
            } catch {
                return [];
            }
        }
        return [];
    });

    const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // Adjustment Modal State
    const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
    const [movementType, setMovementType] = useState<InventoryLog['movement_type']>('ajuste_manual');
    const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    const categoriesList = useMemo(() => Array.from(new Set(products.map(p => p.category))).filter(Boolean), [products]);

    // Inventory Metrics Calculation
    const metrics = useMemo(() => {
        let totalUnits = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let normalStockCount = 0;

        products.forEach(p => {
            const stock = p.stock_quantity ?? 10;
            totalUnits += stock;
            if (stock === 0) outOfStockCount++;
            else if (stock <= 5) lowStockCount++;
            else normalStockCount++;
        });

        return {
            totalProducts: products.length,
            totalUnits,
            lowStockCount,
            outOfStockCount,
            normalStockCount,
        };
    }, [products]);

    // Filtered Products List
    const filteredProducts = useMemo(() => {
        return products.filter(prod => {
            const matchesSearch = prod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (prod.id && prod.id.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCat = selectedCategory === 'all' || prod.category.toLowerCase() === selectedCategory.toLowerCase();

            const stock = prod.stock_quantity ?? 10;
            let matchesStatus = true;
            if (selectedStatus === 'low') matchesStatus = stock > 0 && stock <= 5;
            if (selectedStatus === 'out') matchesStatus = stock === 0;
            if (selectedStatus === 'normal') matchesStatus = stock > 5;

            return matchesSearch && matchesCat && matchesStatus;
        });
    }, [products, searchQuery, selectedCategory, selectedStatus]);

    // Quick inline stock increment / decrement
    const handleQuickStockChange = async (prod: CatalogProduct, change: number) => {
        const currentStock = prod.stock_quantity ?? 10;
        const newStock = Math.max(0, currentStock + change);
        if (newStock === currentStock) return;

        // 1. Update state
        const updatedProds = products.map(p => p.id === prod.id ? { ...p, stock_quantity: newStock } : p);
        setProducts(updatedProds);

        // 2. Local storage
        try {
            const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedLocal = localSaved.map(p => p.id === prod.id ? { ...p, stock_quantity: newStock } : p);
            localStorage.setItem('admin_products', JSON.stringify(updatedLocal));
        } catch { }

        // 3. Log Movement
        const sku = `SKU-${prod.id.slice(-6).toUpperCase()}`;
        const newLog: InventoryLog = {
            id: `inv-${prod.id}-${Date.now()}`,
            product_id: prod.id,
            product_title: prod.title,
            sku,
            movement_type: change > 0 ? 'reposicion' : 'ajuste_manual',
            quantity_change: change,
            new_stock: newStock,
            reason: change > 0 ? 'Aumento rápido inline' : 'Disminución rápida inline',
            created_at: new Date().toISOString(),
        };

        const updatedLogs = [newLog, ...logs];
        setLogs(updatedLogs);
        try {
            localStorage.setItem('admin_inventory_logs', JSON.stringify(updatedLogs.slice(0, 100)));
        } catch { }

        // 4. Remote Sync
        try {
            await AdminProductService.updateStock(prod.id, newStock, change, newLog.reason);
        } catch { }
    };

    const handleOpenAdjustment = (prod: CatalogProduct) => {
        setSelectedProduct(prod);
        setMovementType('ajuste_manual');
        setAdjustmentAmount(0);
        setReason('');
    };

    const handleSaveAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || adjustmentAmount === 0) return;

        setSaving(true);
        const currentStock = selectedProduct.stock_quantity ?? 10;
        const newStock = Math.max(0, currentStock + adjustmentAmount);
        const sku = `SKU-${selectedProduct.id.slice(-6).toUpperCase()}`;

        // 1. Update local state
        const updatedProds = products.map(p => p.id === selectedProduct.id ? { ...p, stock_quantity: newStock } : p);
        setProducts(updatedProds);

        try {
            const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedLocal = localSaved.map(p => p.id === selectedProduct.id ? { ...p, stock_quantity: newStock } : p);
            localStorage.setItem('admin_products', JSON.stringify(updatedLocal));
        } catch { }

        // 2. Create Log
        const newLog: InventoryLog = {
            id: `inv-${selectedProduct.id}-${Date.now()}`,
            product_id: selectedProduct.id,
            product_title: selectedProduct.title,
            sku: sku,
            movement_type: movementType,
            quantity_change: adjustmentAmount,
            new_stock: newStock,
            reason: reason || getMovementLabel(movementType),
            created_at: new Date().toISOString(),
        };

        const updatedLogs = [newLog, ...logs];
        setLogs(updatedLogs);
        try {
            localStorage.setItem('admin_inventory_logs', JSON.stringify(updatedLogs.slice(0, 100)));
        } catch { }

        // 3. Supabase Sync
        try {
            await AdminProductService.updateStock(selectedProduct.id, newStock, adjustmentAmount, newLog.reason);
        } catch { }

        setSelectedProduct(null);
        setSaving(false);
    };

    function getMovementLabel(type: InventoryLog['movement_type']) {
        switch (type) {
            case 'stock_inicial': return 'Stock Inicial';
            case 'ajuste_manual': return 'Ajuste Manual';
            case 'venta': return 'Venta Comercial';
            case 'cancelacion': return 'Cancelación de Orden';
            case 'devolucion': return 'Devolución de Cliente';
            case 'reposicion': return 'Reposición de Inventario';
            default: return type;
        }
    }

    const stockColumns = [
        {
            header: 'Producto / SKU',
            cell: (prod: CatalogProduct) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                        {prod.image ? <img src={prod.image} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>📦</span>}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--foreground)' }}>{prod.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SKU-{prod.id.slice(-6).toUpperCase()}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Categoría',
            cell: (prod: CatalogProduct) => (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{prod.category}</span>
            ),
        },
        {
            header: 'Ajuste Rápido Inline',
            cell: (prod: CatalogProduct) => {
                const stock = prod.stock_quantity ?? 10;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            type="button"
                            onClick={() => handleQuickStockChange(prod, -1)}
                            disabled={stock <= 0}
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--foreground)',
                                fontWeight: 800,
                                fontSize: '1rem',
                                cursor: stock <= 0 ? 'not-allowed' : 'pointer',
                                opacity: stock <= 0 ? 0.4 : 1,
                            }}
                            title="Disminuir 1 unidad"
                        >
                            -
                        </button>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', minWidth: '36px', textAlign: 'center' }}>
                            {stock}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleQuickStockChange(prod, 1)}
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                background: 'var(--robotina-orange)',
                                border: 'none',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '1rem',
                                cursor: 'pointer',
                            }}
                            title="Aumentar 1 unidad"
                        >
                            +
                        </button>
                    </div>
                );
            }
        },
        {
            header: 'Estado Almacén',
            cell: (prod: CatalogProduct) => {
                const stock = prod.stock_quantity ?? 10;
                if (stock === 0) return <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '0.78rem' }}>⚠️ Agotado</span>;
                if (stock <= 5) return <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '0.78rem' }}>⚡ Bajo Stock</span>;
                return <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '0.78rem' }}>● Normal</span>;
            },
        },
        {
            header: 'Acción Detallada',
            cell: (prod: CatalogProduct) => (
                <button
                    onClick={() => handleOpenAdjustment(prod)}
                    style={{
                        padding: '6px 12px',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--foreground)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    📝 Ajuste con Motivo
                </button>
            ),
        },
    ];

    const logColumns = [
        {
            header: 'Fecha / Hora',
            cell: (log: InventoryLog) => (
                <span style={{ fontSize: '0.82rem', color: 'var(--foreground)', fontWeight: 600 }}>
                    {new Date(log.created_at).toLocaleString('es-PE')}
                </span>
            ),
        },
        {
            header: 'Producto / SKU',
            cell: (log: InventoryLog) => (
                <div>
                    <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{log.product_title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.sku}</div>
                </div>
            ),
        },
        {
            header: 'Tipo de Movimiento',
            cell: (log: InventoryLog) => (
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)', background: 'var(--glass-bg)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                    {getMovementLabel(log.movement_type)}
                </span>
            ),
        },
        {
            header: 'Ajuste',
            cell: (log: InventoryLog) => (
                <span style={{
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    color: log.quantity_change > 0 ? '#22c55e' : '#ef4444',
                }}>
                    {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change} un.
                </span>
            ),
        },
        {
            header: 'Stock Resultante',
            cell: (log: InventoryLog) => (
                <span style={{ fontWeight: 800, color: 'var(--foreground)' }}>
                    {log.new_stock} unidades
                </span>
            ),
        },
        {
            header: 'Motivo / Nota',
            cell: (log: InventoryLog) => (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {log.reason}
                </span>
            ),
        },
    ];

    return (
        <div style={{ paddingBottom: '60px' }}>
            <AdminPageHeader
                title="Gestión de Inventario y Almacén"
                description="Controla las existencias en tiempo real, alertas de bajo stock e historial de movimientos."
            />

            {/* Top KPI Metrics Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
            }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '16px 20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Productos</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--foreground)', marginTop: '4px' }}>{metrics.totalProducts}</div>
                </div>

                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '16px 20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stock Normal (&gt;5)</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#22c55e', marginTop: '4px' }}>{metrics.normalStockCount}</div>
                </div>

                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '16px 20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>⚡ Bajo Stock (≤ 5)</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>{metrics.lowStockCount}</div>
                </div>

                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '16px 20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>⚠️ Agotados (0 un.)</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>{metrics.outOfStockCount}</div>
                </div>

                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '16px 20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unidades Totales</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--robotina-orange)', marginTop: '4px' }}>{metrics.totalUnits} un.</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                <button
                    onClick={() => setActiveTab('stock')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        background: activeTab === 'stock' ? 'var(--gradient-main)' : 'transparent',
                        color: activeTab === 'stock' ? 'white' : 'var(--text-muted)',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                    }}
                >
                    🏬 Existencias Físicas ({filteredProducts.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        background: activeTab === 'history' ? 'var(--gradient-main)' : 'transparent',
                        color: activeTab === 'history' ? 'white' : 'var(--text-muted)',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                    }}
                >
                    📜 Historial de Movimientos ({logs.length})
                </button>
            </div>

            {/* STOCK TAB CONTENT */}
            {activeTab === 'stock' && (
                <div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: '260px' }}>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="🔍 Buscar por nombre de producto o SKU..."
                                style={{
                                    width: '100%',
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    color: 'var(--foreground)',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '10px',
                                padding: '10px 14px',
                                color: 'var(--foreground)',
                                outline: 'none',
                            }}
                        >
                            <option value="all">Todas las Categorías</option>
                            {categoriesList.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '10px',
                                padding: '10px 14px',
                                color: 'var(--foreground)',
                                outline: 'none',
                            }}
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="normal">● Normal (&gt; 5 un.)</option>
                            <option value="low">⚡ Bajo Stock (≤ 5 un.)</option>
                            <option value="out">⚠️ Agotados (0 un.)</option>
                        </select>
                    </div>

                    <AdminDataTable
                        columns={stockColumns}
                        data={filteredProducts}
                        keyExtractor={(item) => item.id}
                        emptyText="No se encontraron productos coincidentes en el inventario."
                    />
                </div>
            )}

            {/* HISTORY TAB CONTENT */}
            {activeTab === 'history' && (
                <div>
                    <AdminDataTable
                        columns={logColumns}
                        data={logs}
                        keyExtractor={(item) => item.id}
                        emptyText="No se han registrado movimientos de inventario todavía."
                    />
                </div>
            )}

            {/* ADJUSTMENT MODAL WITH REASON */}
            {selectedProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '28px', maxWidth: '480px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>
                            ⚡ Ajuste Manual con Motivo
                        </h3>
                        <p style={{ margin: '0 0 20px 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                            {selectedProduct.title} (Stock Actual: <strong>{selectedProduct.stock_quantity ?? 10} un.</strong>)
                        </p>

                        <form onSubmit={handleSaveAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--foreground)' }}>
                                    Tipo de Movimiento *
                                </label>
                                <select
                                    value={movementType}
                                    onChange={(e) => setMovementType(e.target.value as InventoryLog['movement_type'])}
                                    style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--input-text)', outline: 'none' }}
                                >
                                    <option value="reposicion">📦 Reposición de Inventario (+ Ingreso)</option>
                                    <option value="ajuste_manual">🛠️ Ajuste Manual de Corrección</option>
                                    <option value="devolucion">🔄 Devolución de Cliente (+ Ingreso)</option>
                                    <option value="venta">🛒 Venta Directa (- Salida)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--foreground)' }}>
                                    Variación de Unidades * (Ej: +10 o -5)
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={adjustmentAmount || ''}
                                    onChange={(e) => setAdjustmentAmount(parseInt(e.target.value, 10) || 0)}
                                    placeholder="Ingresa la cantidad (+ o -)"
                                    style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--input-text)', outline: 'none', fontWeight: 700, fontSize: '1rem' }}
                                />
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                    Resultado estimado: <strong>{Math.max(0, (selectedProduct.stock_quantity ?? 10) + adjustmentAmount)} unidades</strong>
                                </span>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--foreground)' }}>
                                    Motivo / Justificación
                                </label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Ej. Ingreso de lote semanal del proveedor"
                                    style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--input-text)', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedProduct(null)}
                                    style={{ padding: '10px 18px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--foreground)', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || adjustmentAmount === 0}
                                    style={{ padding: '10px 18px', background: 'var(--gradient-main)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: saving || adjustmentAmount === 0 ? 'not-allowed' : 'pointer' }}
                                >
                                    {saving ? 'Guardando...' : 'Confirmar Ajuste'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
