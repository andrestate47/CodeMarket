'use client';

import React, { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminFilters from '@/components/admin/AdminFilters';
import { getInstantProducts, CatalogProduct } from '@/modules/catalog/queries';
import { supabase } from '@/lib/supabase';

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

    const categoriesList = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

    // Filtered Products List
    const filteredProducts = products.filter(prod => {
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

        // 1. Update product stock in local state & localStorage
        const updatedProds = products.map(p => p.id === selectedProduct.id ? { ...p, stock_quantity: newStock } : p);
        setProducts(updatedProds);

        try {
            const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedLocal = localSaved.map(p => p.id === selectedProduct.id ? { ...p, stock_quantity: newStock } : p);
            localStorage.setItem('admin_products', JSON.stringify(updatedLocal));
        } catch { }

        // 2. Create Inventory Log
        const newLog: InventoryLog = {
            id: `inv-${selectedProduct.id}-${logs.length + 1}`,
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

        // 3. Sync with Supabase
        try {
            await supabase.from('products').update({ stock_quantity: newStock }).eq('id', selectedProduct.id);
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
            header: 'Stock Actual',
            cell: (prod: CatalogProduct) => {
                const stock = prod.stock_quantity ?? 10;
                const isOut = stock === 0;
                const isLow = stock > 0 && stock <= 5;
                return (
                    <span style={{
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        background: isOut ? 'rgba(239, 68, 68, 0.15)' : (isLow ? 'rgba(245, 158, 11, 0.15)' : 'var(--glass-bg)'),
                        color: isOut ? '#ef4444' : (isLow ? '#f59e0b' : 'var(--foreground)'),
                        border: `1px solid ${isOut ? 'rgba(239, 68, 68, 0.3)' : (isLow ? 'rgba(245, 158, 11, 0.3)' : 'var(--glass-border)')}`,
                    }}>
                        {isOut ? '⚠️ Agotado (0 un.)' : `${stock} unidades`}
                    </span>
                );
            },
        },
        {
            header: 'Estado Almacén',
            cell: (prod: CatalogProduct) => {
                const stock = prod.stock_quantity ?? 10;
                if (stock === 0) return <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.82rem' }}>Agotado</span>;
                if (stock <= 5) return <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.82rem' }}>Bajo Stock</span>;
                return <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.82rem' }}>Normal</span>;
            },
        },
        {
            header: 'Acción',
            cell: (prod: CatalogProduct) => (
                <button
                    onClick={() => handleOpenAdjustment(prod)}
                    style={{
                        padding: '6px 14px',
                        background: 'var(--robotina-orange)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(255, 107, 0, 0.25)',
                    }}
                >
                    ⚡ Ajustar Stock
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
                <span style={{ fontSize: '0.82rem', color: 'var(--text-description)' }}>
                    {log.reason}
                </span>
            ),
        },
    ];

    return (
        <div>
            <AdminPageHeader
                title="Control de Inventario"
                description="Monitoreo en tiempo real de unidades en stock, alertas de agotados y auditoría de movimientos."
                action={
                    <div style={{ display: 'flex', background: 'var(--glass-bg)', padding: '3px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                        <button
                            onClick={() => setActiveTab('stock')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '7px',
                                background: activeTab === 'stock' ? 'var(--robotina-orange)' : 'transparent',
                                color: activeTab === 'stock' ? '#ffffff' : 'var(--foreground)',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                            }}
                        >
                            📦 Stock por Producto
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '7px',
                                background: activeTab === 'history' ? 'var(--robotina-orange)' : 'transparent',
                                color: activeTab === 'history' ? '#ffffff' : 'var(--foreground)',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                            }}
                        >
                            📜 Historial de Movimientos ({logs.length})
                        </button>
                    </div>
                }
            />

            {/* Filter Bar */}
            {activeTab === 'stock' && (
                <AdminFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Buscar por nombre o SKU..."
                >
                    <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        style={{ padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--input-text)', fontSize: '0.88rem', outline: 'none' }}
                    >
                        <option value="all">Todas las categorías</option>
                        {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value)}
                        style={{ padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--input-text)', fontSize: '0.88rem', outline: 'none' }}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="normal">Stock Normal (&gt;5)</option>
                        <option value="low">Bajo Stock (&lt;=5)</option>
                        <option value="out">Agotados (0)</option>
                    </select>
                </AdminFilters>
            )}

            {/* Main Content Tables */}
            {activeTab === 'stock' ? (
                <AdminDataTable
                    columns={stockColumns}
                    data={filteredProducts}
                    keyExtractor={p => p.id}
                />
            ) : (
                <AdminDataTable
                    columns={logColumns}
                    data={logs}
                    keyExtractor={l => l.id}
                />
            )}

            {/* Adjustment Modal */}
            {selectedProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <form onSubmit={handleSaveAdjustment} style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '28px', maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>
                            ⚡ Ajustar Inventario de &quot;{selectedProduct.title}&quot;
                        </h3>

                        <div style={{ background: 'var(--input-bg)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                            Stock actual disponible: <strong style={{ color: 'var(--foreground)' }}>{selectedProduct.stock_quantity ?? 10} unidades</strong>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--foreground)' }}>Tipo de Movimiento *</label>
                            <select
                                value={movementType}
                                onChange={e => setMovementType(e.target.value as InventoryLog['movement_type'])}
                                style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--input-text)', outline: 'none' }}
                            >
                                <option value="ajuste_manual">Ajuste Manual (+ / -)</option>
                                <option value="reposicion">Reposición / Ingreso de Almacén (+)</option>
                                <option value="stock_inicial">Stock Inicial (+)</option>
                                <option value="devolucion">Devolución de Cliente (+)</option>
                                <option value="venta">Venta Directa (-)</option>
                                <option value="cancelacion">Cancelación de Producto (-)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--foreground)' }}>Cambio de Cantidad (positivo para agregar, negativo para restar) *</label>
                            <input
                                type="number"
                                required
                                value={adjustmentAmount}
                                onChange={e => setAdjustmentAmount(parseInt(e.target.value, 10) || 0)}
                                placeholder="Ej: +10 o -2"
                                style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--input-text)', outline: 'none', fontWeight: 800 }}
                            />
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                Nuevo stock resultante: <strong style={{ color: 'var(--robotina-orange)' }}>{Math.max(0, (selectedProduct.stock_quantity ?? 10) + adjustmentAmount)} unidades</strong>
                            </span>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--foreground)' }}>Motivo / Nota de Almacén</label>
                            <input
                                type="text"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Ej: Llegada de proveedor o conteo físico"
                                style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--input-text)', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                                type="submit"
                                disabled={saving || adjustmentAmount === 0}
                                style={{ flex: 1, padding: '12px', background: 'var(--gradient-main)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                {saving ? 'Guardando...' : 'Confirmar Ajuste'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedProduct(null)}
                                style={{ padding: '12px 18px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
