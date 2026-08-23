'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { fetchCatalogProducts, getInstantProducts, CatalogProduct } from '@/modules/catalog/queries';
import { getCategoriesListAction, CategoryRecord } from '@/modules/categories/actions';
import { supabase } from '@/lib/supabase';
import { formatMoney, parseMoneyToCents } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminProductsList() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const urlCategory = searchParams?.get('categoria') || 'all';

    const [productsList, setProductsList] = useState<CatalogProduct[]>(() => getInstantProducts());
    const [dbCategories, setDbCategories] = useState<CategoryRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // View Mode (Default: 'list')
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('products_view_mode') as 'list' | 'grid';
            if (saved === 'grid' || saved === 'list') return saved;
        }
        return 'list';
    });

    // Filtering & Sorting State
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(urlCategory);
    const [statusFilter, setStatusFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [variantFilter, setVariantFilter] = useState('all');
    const [discountFilter, setDiscountFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'newest'>('newest');

    useEffect(() => {
        if (urlCategory && urlCategory !== 'all') {
            setCategoryFilter(urlCategory);
        }
    }, [urlCategory]);

    useEffect(() => {
        (async () => {
            const res = await getCategoriesListAction();
            if (res.success && res.categories) {
                setDbCategories(res.categories);
            }
        })();
    }, []);

    // Selection & Bulk Action State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Quick Inventory Modal State
    const [inventoryModalProduct, setInventoryModalProduct] = useState<CatalogProduct | null>(null);
    const [newStockInput, setNewStockInput] = useState<number>(0);

    // Import CSV Modal / Input
    const csvFileInputRef = useRef<HTMLInputElement>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    useEffect(() => {
        const handleOutsideClick = () => setOpenMenuId(null);
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    const refreshData = useCallback(async () => {
        setLoading(true);
        const instant = getInstantProducts();
        setProductsList(instant);

        const data = await fetchCatalogProducts();
        if (data.length > 0) {
            setProductsList(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (isMounted) {
                await refreshData();
            }
        })();

        window.addEventListener('storage', refreshData);
        window.addEventListener('products_updated', refreshData);
        window.addEventListener('focus', refreshData);
        return () => {
            isMounted = false;
            window.removeEventListener('storage', refreshData);
            window.removeEventListener('products_updated', refreshData);
            window.removeEventListener('focus', refreshData);
        };
    }, [pathname, refreshData]);

    // Categories list for filter dropdown
    const categoriesList = useMemo(() => {
        return Array.from(new Set(productsList.map(p => p.category))).filter(Boolean);
    }, [productsList]);

    // Helper to calculate exact Soles numerical price for sorting/discount
    const getProductNumericalPrice = (prod: CatalogProduct): { price: number; compare?: number } => {
        let price = 0;
        if (typeof prod.price_amount === 'number' && prod.price_amount > 0) {
            price = prod.price_amount / 100;
        } else if (typeof prod.price === 'number') {
            price = prod.price;
        } else {
            const clean = parseFloat(String(prod.price || '').replace(/[^0-9.]/g, ''));
            price = isNaN(clean) ? 0 : clean;
        }

        let compare: number | undefined = undefined;
        if (typeof prod.compare_at_amount === 'number' && prod.compare_at_amount > 0) {
            compare = prod.compare_at_amount / 100;
        } else if (prod.comparePrice) {
            const clean = parseFloat(String(prod.comparePrice).replace(/[^0-9.]/g, ''));
            if (!isNaN(clean) && clean > 0) compare = clean;
        }

        return { price, compare };
    };

    // Filter & Sort Logic
    const filteredProducts = useMemo(() => {
        return productsList.filter(prod => {
            const sku = `SKU-${prod.id.slice(-6).toUpperCase()}`;
            const matchesSearch = prod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prod.id.toLowerCase().includes(searchQuery.toLowerCase());

            const targetCat = dbCategories.find(c => c.id === categoryFilter || c.slug === categoryFilter || c.name.toLowerCase() === categoryFilter.toLowerCase());
            const targetCatName = targetCat ? targetCat.name.toLowerCase() : categoryFilter.toLowerCase();
            const prodCat = (prod.category || '').toLowerCase();
            const prodCatId = (prod.category_id || '').toLowerCase();

            const matchesCategory = categoryFilter === 'all' ||
                prodCatId === categoryFilter.toLowerCase() ||
                prodCat === targetCatName ||
                prodCat === categoryFilter.toLowerCase();
            const matchesStatus = statusFilter === 'all' || (prod.status || 'active').toLowerCase() === statusFilter.toLowerCase();

            const stock = prod.stock_quantity ?? 10;
            let matchesStock = true;
            if (stockFilter === 'normal') matchesStock = stock > 5;
            if (stockFilter === 'low') matchesStock = stock > 0 && stock <= 5;
            if (stockFilter === 'out') matchesStock = stock === 0;

            const hasVariants = Boolean(prod.variants && prod.variants.length > 0);
            let matchesVariants = true;
            if (variantFilter === 'with') matchesVariants = hasVariants;
            if (variantFilter === 'without') matchesVariants = !hasVariants;

            const { price, compare } = getProductNumericalPrice(prod);
            const hasDiscount = Boolean(compare && compare > price);
            let matchesDiscount = true;
            if (discountFilter === 'with') matchesDiscount = hasDiscount;
            if (discountFilter === 'without') matchesDiscount = !hasDiscount;

            return matchesSearch && matchesCategory && matchesStatus && matchesStock && matchesVariants && matchesDiscount;
        }).sort((a, b) => {
            const priceA = getProductNumericalPrice(a).price;
            const priceB = getProductNumericalPrice(b).price;
            const stockA = a.stock_quantity ?? 10;
            const stockB = b.stock_quantity ?? 10;

            if (sortBy === 'name_asc') return a.title.localeCompare(b.title);
            if (sortBy === 'name_desc') return b.title.localeCompare(a.title);
            if (sortBy === 'price_asc') return priceA - priceB;
            if (sortBy === 'price_desc') return priceB - priceA;
            if (sortBy === 'stock_asc') return stockA - stockB;
            if (sortBy === 'stock_desc') return stockB - stockA;
            return 0; // newest default order
        });
    }, [productsList, searchQuery, categoryFilter, statusFilter, stockFilter, variantFilter, discountFilter, sortBy]);

    // Pagination Calculation
    const totalCount = filteredProducts.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredProducts.slice(start, start + pageSize);
    }, [filteredProducts, currentPage, pageSize]);

    // Selection logic
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(paginatedProducts.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Single Product Actions
    const toggleStatus = async (productId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'active' ? 'draft' : 'active';
        setProductsList(prev => prev.map(p => p.id === productId ? { ...p, status: nextStatus } : p));
        
        try {
            const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedLocal = localSaved.map(p => p.id === productId ? { ...p, status: nextStatus } : p);
            localStorage.setItem('admin_products', JSON.stringify(updatedLocal));
            await supabase.from('products').update({ status: nextStatus }).eq('id', productId);
        } catch { }
    };

    const duplicateProduct = (prod: CatalogProduct) => {
        const duplicated: CatalogProduct = {
            ...prod,
            id: `prod-copy-${Date.now()}`,
            title: `${prod.title} (Copia)`,
            status: 'draft',
        };

        const updated = [duplicated, ...productsList];
        setProductsList(updated);

        try {
            const localSaved = JSON.parse(localStorage.getItem('admin_products') || '[]');
            localSaved.unshift(duplicated);
            localStorage.setItem('admin_products', JSON.stringify(localSaved));
        } catch { }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('products_updated'));
        }
    };

    const deleteProduct = async (productId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto del catálogo?')) return;
        
        setProductsList(prev => prev.filter(p => p.id !== productId));
        setSelectedIds(prev => prev.filter(id => id !== productId));
        
        try {
            const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedLocal = localSaved.filter(p => p.id !== productId);
            localStorage.setItem('admin_products', JSON.stringify(updatedLocal));
            await supabase.from('products').delete().eq('id', productId);
        } catch { }
    };

    // Bulk Actions Handlers
    const handleBulkStatusChange = async (nextStatus: 'active' | 'draft') => {
        setProductsList(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, status: nextStatus } : p));
        try {
            const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedLocal = localSaved.map(p => selectedIds.includes(p.id) ? { ...p, status: nextStatus } : p);
            localStorage.setItem('admin_products', JSON.stringify(updatedLocal));
            await supabase.from('products').update({ status: nextStatus }).in('id', selectedIds);
        } catch { }
        setSelectedIds([]);
    };

    const handleBulkCategoryChange = async () => {
        const newCat = prompt('Ingrese el nuevo nombre de categoría para los productos seleccionados:');
        if (!newCat || !newCat.trim()) return;

        const cleanCat = newCat.trim();
        setProductsList(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, category: cleanCat } : p));
        try {
            const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedLocal = localSaved.map(p => selectedIds.includes(p.id) ? { ...p, category: cleanCat } : p);
            localStorage.setItem('admin_products', JSON.stringify(updatedLocal));
        } catch { }
        setSelectedIds([]);
    };

    const handleBulkPriceUpdate = async () => {
        const inputPrice = prompt('Ingrese el nuevo precio en soles (S/) para los productos seleccionados (ej. 49.90):');
        if (!inputPrice) return;

        const numPrice = parseFloat(inputPrice.replace(/[^0-9.]/g, ''));
        if (isNaN(numPrice) || numPrice < 0) {
            alert('Precio inválido');
            return;
        }

        const cents = Math.round(numPrice * 100);
        const formattedPrice = `S/ ${numPrice.toFixed(2)}`;

        setProductsList(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, price: formattedPrice, price_amount: cents } : p));
        try {
            const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedLocal = localSaved.map(p => selectedIds.includes(p.id) ? { ...p, price: formattedPrice, price_amount: cents } : p);
            localStorage.setItem('admin_products', JSON.stringify(updatedLocal));
            await supabase.from('products').update({ price_amount: cents }).in('id', selectedIds);
        } catch { }
        setSelectedIds([]);
    };

    const handleBulkStockUpdate = async () => {
        const inputStock = prompt('Ingrese la cantidad de unidades en stock para los productos seleccionados:');
        if (inputStock === null) return;

        const stockNum = parseInt(inputStock, 10);
        if (isNaN(stockNum) || stockNum < 0) {
            alert('Stock inválido');
            return;
        }

        setProductsList(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, stock_quantity: stockNum } : p));
        try {
            const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedLocal = localSaved.map(p => selectedIds.includes(p.id) ? { ...p, stock_quantity: stockNum } : p);
            localStorage.setItem('admin_products', JSON.stringify(updatedLocal));
            await supabase.from('products').update({ stock_quantity: stockNum }).in('id', selectedIds);
        } catch { }
        setSelectedIds([]);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`¿Eliminar los ${selectedIds.length} productos seleccionados?`)) return;
        setProductsList(prev => prev.filter(p => !selectedIds.includes(p.id)));
        try {
            const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedLocal = localSaved.filter(p => !selectedIds.includes(p.id));
            localStorage.setItem('admin_products', JSON.stringify(updatedLocal));
            await supabase.from('products').delete().in('id', selectedIds);
        } catch { }
        setSelectedIds([]);
    };

    // Export CSV
    const handleExportCSV = () => {
        const targetList = selectedIds.length > 0 ? productsList.filter(p => selectedIds.includes(p.id)) : filteredProducts;
        const headers = 'ID,Titulo,Categoria,Precio,Stock,Estado\n';
        const rows = targetList.map(p => {
            const { price } = getProductNumericalPrice(p);
            return `"${p.id}","${p.title}","${p.category}","S/ ${price.toFixed(2)}",${p.stock_quantity ?? 10},"${p.status || 'active'}"`;
        }).join('\n');
        
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `codemarket_productos_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Import CSV File Handler
    const handleImportCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const content = evt.target?.result as string;
            if (!content) return;

            const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length <= 1) {
                alert('El archivo CSV está vacío o no contiene filas de datos.');
                return;
            }

            const importedProducts: CatalogProduct[] = [];
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(p => p.replace(/^"|"$/g, '').trim());
                if (parts.length >= 2) {
                    const title = parts[1] || parts[0] || `Producto Importado ${i}`;
                    const category = parts[2] || 'Físicos';
                    const rawPrice = parts[3] || '49.00';
                    const stock = parseInt(parts[4] || '10', 10) || 10;
                    const cents = parseMoneyToCents(rawPrice);

                    importedProducts.push({
                        id: `prod-imp-${Date.now()}-${i}`,
                        title,
                        category,
                        description: `Producto importado desde CSV (${title})`,
                        price: `S/ ${(cents / 100).toFixed(2)}`,
                        price_amount: cents,
                        features: ['Producto Físico'],
                        type: 'physical',
                        cta: 'Agregar al Carrito',
                        color: 'linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%)',
                        image: '/arepa-hero.jpg',
                        stock_quantity: stock,
                        track_inventory: true,
                        status: 'active',
                    });
                }
            }

            if (importedProducts.length > 0) {
                setProductsList(prev => [...importedProducts, ...prev]);
                try {
                    const localSaved = JSON.parse(localStorage.getItem('admin_products') || '[]');
                    const updated = [...importedProducts, ...localSaved];
                    localStorage.setItem('admin_products', JSON.stringify(updated));
                } catch { }
                alert(`✅ ¡Se importaron ${importedProducts.length} productos con éxito!`);
            }
        };
        reader.readAsText(file);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setCategoryFilter('all');
        setStatusFilter('all');
        setStockFilter('all');
        setVariantFilter('all');
        setDiscountFilter('all');
        setSortBy('newest');
        setCurrentPage(1);
    };

    // Save Stock Adjustment
    const handleSaveStockModal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inventoryModalProduct) return;
        
        const updatedList = productsList.map(p => p.id === inventoryModalProduct.id ? { ...p, stock_quantity: newStockInput } : p);
        setProductsList(updatedList);

        try {
            const localSaved: CatalogProduct[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedLocal = localSaved.map(p => p.id === inventoryModalProduct.id ? { ...p, stock_quantity: newStockInput } : p);
            localStorage.setItem('admin_products', JSON.stringify(updatedLocal));
            await supabase.from('products').update({ stock_quantity: newStockInput }).eq('id', inventoryModalProduct.id);
        } catch { }

        setInventoryModalProduct(null);
    };

    return (
        <div>
            <input
                type="file"
                ref={csvFileInputRef}
                accept=".csv"
                onChange={handleImportCSVFile}
                style={{ display: 'none' }}
            />

            <AdminPageHeader
                title={`Gestión de Productos (${totalCount})`}
                description="Administra el catálogo completo de productos físicos, precios en soles (S/), inventario por variantes y visibilidad."
                action={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => csvFileInputRef.current?.click()}
                            style={{
                                padding: '9px 15px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '10px',
                                color: 'var(--foreground)',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <span>📥</span> Importar CSV
                        </button>

                        <button
                            onClick={handleExportCSV}
                            style={{
                                padding: '9px 15px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '10px',
                                color: 'var(--foreground)',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <span>📤</span> Exportar CSV
                        </button>

                        <Link
                            href="/admin/productos/nuevo"
                            style={{
                                padding: '10px 18px',
                                background: 'var(--gradient-main)',
                                color: 'white',
                                borderRadius: '10px',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 14px rgba(255, 107, 0, 0.35)',
                            }}
                        >
                            <span>➕</span> Nuevo Producto
                        </Link>
                    </div>
                }
            />

            {/* Filter & Controls Panel */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '18px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar por nombre o SKU..."
                            style={{
                                width: '100%',
                                padding: '10px 14px 10px 38px',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '10px',
                                color: 'var(--input-text)',
                                fontSize: '0.88rem',
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* View mode switcher */}
                    <div style={{ display: 'flex', background: 'var(--input-bg)', padding: '3px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                        <button
                            onClick={() => { setViewMode('list'); localStorage.setItem('products_view_mode', 'list'); }}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '7px',
                                background: viewMode === 'list' ? 'var(--robotina-orange)' : 'transparent',
                                color: viewMode === 'list' ? '#ffffff' : 'var(--foreground)',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            ☰ Lista
                        </button>
                        <button
                            onClick={() => { setViewMode('grid'); localStorage.setItem('products_view_mode', 'grid'); }}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '7px',
                                background: viewMode === 'grid' ? 'var(--robotina-orange)' : 'transparent',
                                color: viewMode === 'grid' ? '#ffffff' : 'var(--foreground)',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            🎛️ Cuadrícula
                        </button>
                    </div>
                </div>

                {/* Dropdowns Row (Specific Filter Descriptions) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        style={{ padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.84rem', outline: 'none' }}
                    >
                        <option value="all">Todas las categorías</option>
                        {dbCategories.length > 0 ? (
                            dbCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.parent_id ? `  ↳ ${cat.name}` : cat.name}
                                </option>
                            ))
                        ) : (
                            categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)
                        )}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.84rem', outline: 'none' }}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="draft">Borradores</option>
                    </select>

                    <select
                        value={stockFilter}
                        onChange={e => setStockFilter(e.target.value)}
                        style={{ padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.84rem', outline: 'none' }}
                    >
                        <option value="all">Todo el inventario</option>
                        <option value="normal">Disponible (&gt;5 un.)</option>
                        <option value="low">Stock Bajo (&lt;=5 un.)</option>
                        <option value="out">Agotados (0 un.)</option>
                    </select>

                    <select
                        value={variantFilter}
                        onChange={e => setVariantFilter(e.target.value)}
                        style={{ padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.84rem', outline: 'none' }}
                    >
                        <option value="all">Todas las variantes</option>
                        <option value="with">Con variantes</option>
                        <option value="without">Sin variantes</option>
                    </select>

                    <select
                        value={discountFilter}
                        onChange={e => setDiscountFilter(e.target.value)}
                        style={{ padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.84rem', outline: 'none' }}
                    >
                        <option value="all">Todas las ofertas</option>
                        <option value="with">Con descuento (% OFF)</option>
                        <option value="without">Sin descuento</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as typeof sortBy)}
                        style={{ padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.84rem', outline: 'none', marginLeft: 'auto' }}
                    >
                        <option value="newest">Ordenar: Más Recientes</option>
                        <option value="name_asc">Nombre: A - Z</option>
                        <option value="name_desc">Nombre: Z - A</option>
                        <option value="price_asc">Precio: Menor a Mayor</option>
                        <option value="price_desc">Precio: Mayor a Menor</option>
                        <option value="stock_desc">Stock: Mayor a Menor</option>
                    </select>

                    {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || stockFilter !== 'all' || variantFilter !== 'all' || discountFilter !== 'all' || sortBy !== 'newest') && (
                        <button
                            onClick={clearFilters}
                            style={{ padding: '8px 12px', background: 'transparent', border: '1px dashed #ef4444', color: '#ef4444', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            🧹 Limpiar Filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Floating Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div
                    style={{
                        position: 'sticky',
                        top: '80px',
                        zIndex: 90,
                        background: 'var(--card-bg)',
                        border: '2px solid var(--robotina-orange)',
                        borderRadius: '14px',
                        padding: '14px 22px',
                        marginBottom: '20px',
                        boxShadow: '0 12px 35px rgba(255, 107, 0, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--robotina-orange)', fontSize: '0.95rem' }}>
                            ✓ {selectedIds.length} producto(s) seleccionado(s)
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => handleBulkStatusChange('active')}
                            style={{ padding: '7px 14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            🚀 Activar
                        </button>
                        <button
                            onClick={() => handleBulkStatusChange('draft')}
                            style={{ padding: '7px 14px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            👁️ Pasar a Borrador
                        </button>
                        <button
                            onClick={handleBulkCategoryChange}
                            style={{ padding: '7px 14px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            📁 Cambiar Categoría
                        </button>
                        <button
                            onClick={handleBulkPriceUpdate}
                            style={{ padding: '7px 14px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            💲 Actualizar Precio
                        </button>
                        <button
                            onClick={handleBulkStockUpdate}
                            style={{ padding: '7px 14px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            ⚡ Ajustar Inventario
                        </button>
                        <button
                            onClick={handleExportCSV}
                            style={{ padding: '7px 14px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            📤 Exportar
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            style={{ padding: '7px 14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State or Main List / Grid Content */}
            {filteredProducts.length === 0 && !loading ? (
                <AdminEmptyState
                    title="No se encontraron productos"
                    description="Prueba cambiando los filtros de búsqueda o agrega un nuevo producto."
                    action={
                        <button
                            onClick={clearFilters}
                            style={{ padding: '10px 18px', background: 'var(--robotina-orange)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Limpiar Filtros
                        </button>
                    }
                />
            ) : viewMode === 'list' ? (
                /* Table View Layout (Default) */
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--input-bg)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '14px 16px', width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0}
                                        onChange={handleSelectAll}
                                        style={{ accentColor: 'var(--robotina-orange)', cursor: 'pointer' }}
                                    />
                                </th>
                                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Producto / SKU</th>
                                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Categoría</th>
                                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Precio (S/)</th>
                                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Inventario</th>
                                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Estado</th>
                                <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProducts.map(prod => {
                                const isSelected = selectedIds.includes(prod.id);
                                const isMenuOpen = openMenuId === prod.id;
                                const sku = `SKU-${prod.id.slice(-6).toUpperCase()}`;
                                
                                const { price: numPrice, compare: numCompare } = getProductNumericalPrice(prod);
                                const discountPercent = (numCompare && numCompare > numPrice)
                                    ? Math.round(((numCompare - numPrice) / numCompare) * 100)
                                    : 0;

                                const stock = prod.stock_quantity ?? 10;
                                const isOut = stock === 0;
                                const isLow = stock > 0 && stock <= 5;
                                const variantCount = prod.variants ? prod.variants.length : 0;

                                return (
                                    <tr
                                        key={prod.id}
                                        style={{
                                            borderBottom: '1px solid var(--glass-border)',
                                            background: isSelected ? 'rgba(255, 107, 0, 0.05)' : 'transparent',
                                            transition: 'background 0.15s ease',
                                        }}
                                    >
                                        <td style={{ padding: '14px 16px' }}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectOne(prod.id)}
                                                style={{ accentColor: 'var(--robotina-orange)', cursor: 'pointer' }}
                                            />
                                        </td>

                                        {/* Product & SKU */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                                                    {prod.image ? (
                                                        <img src={prod.image} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>📦</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <Link href={`/admin/productos/${prod.id}`} title={prod.title} style={{ fontWeight: 800, color: 'var(--foreground)', textDecoration: 'none' }}>
                                                        {prod.title}
                                                    </Link>
                                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                                        <span>{sku}</span>
                                                        <span style={{ background: 'var(--glass-bg)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--glass-border)', fontWeight: 700, color: variantCount > 0 ? 'var(--robotina-orange)' : 'var(--text-muted)' }}>
                                                            {variantCount > 0 ? `🎨 ${variantCount} variantes` : 'Sin variantes'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Category */}
                                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            {prod.category}
                                        </td>

                                        {/* Price & Offer */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '0.92rem' }}>
                                                    {formatMoney(numPrice)}
                                                </span>
                                                {numCompare && numCompare > numPrice && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', marginTop: '2px' }}>
                                                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                                                            {formatMoney(numCompare)}
                                                        </span>
                                                        <span style={{ color: '#22c55e', fontWeight: 800 }}>
                                                            {discountPercent}% OFF
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Stock & Status Badge */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                fontWeight: 800,
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                background: isOut ? 'rgba(239, 68, 68, 0.15)' : (isLow ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.12)'),
                                                color: isOut ? '#ef4444' : (isLow ? '#f59e0b' : '#22c55e'),
                                                border: `1px solid ${isOut ? 'rgba(239, 68, 68, 0.3)' : (isLow ? 'rgba(245, 158, 11, 0.3)' : 'rgba(34, 197, 94, 0.3)')}`,
                                            }}>
                                                {isOut ? '❌ Agotado (0 un.)' : (isLow ? `⚠️ ${stock} un. — Stock bajo` : `🟢 ${stock} unidades`)}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <AdminStatusBadge status={prod.status || 'active'} />
                                        </td>

                                        {/* Actions Menu (⋮) */}
                                        <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(isMenuOpen ? null : prod.id);
                                                }}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: 'var(--glass-bg)',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '8px',
                                                    color: 'var(--foreground)',
                                                    fontSize: '1.1rem',
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                }}
                                                title="Opciones del producto"
                                            >
                                                ⋮
                                            </button>

                                            {isMenuOpen && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '16px',
                                                        top: '48px',
                                                        background: 'var(--card-bg)',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                                                        padding: '6px',
                                                        zIndex: 100,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '4px',
                                                        minWidth: '160px',
                                                        textAlign: 'left',
                                                    }}
                                                >
                                                    <Link
                                                        href={`/admin/productos/${prod.id}`}
                                                        style={{ padding: '8px 12px', borderRadius: '8px', color: 'var(--foreground)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                                                    >
                                                        ✏️ Editar
                                                    </Link>
                                                    <button
                                                        onClick={() => { duplicateProduct(prod); setOpenMenuId(null); }}
                                                        style={{ padding: '8px 12px', borderRadius: '8px', background: 'transparent', color: 'var(--foreground)', border: 'none', fontSize: '0.82rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                    >
                                                        📋 Duplicar
                                                    </button>
                                                    <button
                                                        onClick={() => { setInventoryModalProduct(prod); setNewStockInput(prod.stock_quantity ?? 10); setOpenMenuId(null); }}
                                                        style={{ padding: '8px 12px', borderRadius: '8px', background: 'transparent', color: 'var(--foreground)', border: 'none', fontSize: '0.82rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                    >
                                                        ⚡ Ajustar Stock
                                                    </button>
                                                    <Link
                                                        href={`/productos/${prod.id}`}
                                                        target="_blank"
                                                        style={{ padding: '8px 12px', borderRadius: '8px', color: 'var(--foreground)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                                                    >
                                                        👁️ Ver en tienda ↗
                                                    </Link>
                                                    <button
                                                        onClick={() => { toggleStatus(prod.id, prod.status || 'active'); setOpenMenuId(null); }}
                                                        style={{ padding: '8px 12px', borderRadius: '8px', background: 'transparent', color: 'var(--foreground)', border: 'none', fontSize: '0.82rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                    >
                                                        {prod.status === 'active' ? '📦 Pasar a Borrador' : '🚀 Publicar'}
                                                    </button>
                                                    <button
                                                        onClick={() => { deleteProduct(prod.id); setOpenMenuId(null); }}
                                                        style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontSize: '0.82rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                    >
                                                        🗑️ Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Grid View Layout (280px minwidth limits to 4-5 cards per row on wide screens) */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px 18px', paddingTop: '10px' }}>
                    {paginatedProducts.map(prod => {
                        const isSelected = selectedIds.includes(prod.id);
                        const isMenuOpen = openMenuId === prod.id;
                        const sku = `SKU-${prod.id.slice(-6).toUpperCase()}`;

                        const { price: numPrice, compare: numCompare } = getProductNumericalPrice(prod);
                        const discountPercent = (numCompare && numCompare > numPrice)
                            ? Math.round(((numCompare - numPrice) / numCompare) * 100)
                            : 0;

                        const stock = prod.stock_quantity ?? 10;
                        const isOut = stock === 0;
                        const isLow = stock > 0 && stock <= 5;
                        const variantCount = prod.variants ? prod.variants.length : 0;

                        return (
                            <div
                                key={prod.id}
                                style={{
                                    background: 'var(--card-bg)',
                                    border: isSelected ? '2px solid var(--robotina-orange)' : '1px solid var(--glass-border)',
                                    borderRadius: '16px',
                                    overflow: 'visible',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                }}
                            >
                                {/* Checkbox Top Left */}
                                <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 30, background: 'var(--card-bg)', padding: '4px', borderRadius: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleSelectOne(prod.id)}
                                        style={{ accentColor: 'var(--robotina-orange)', cursor: 'pointer', width: '16px', height: '16px' }}
                                    />
                                </div>

                                {/* Three Dots Menu Button (⋮) Top Right */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(isMenuOpen ? null : prod.id);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--glass-border)',
                                        boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
                                        color: 'var(--foreground)',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 30,
                                        fontSize: '1.1rem',
                                        fontWeight: 800,
                                    }}
                                    title="Opciones del producto"
                                >
                                    ⋮
                                </button>

                                {/* Floating Dropdown */}
                                {isMenuOpen && (
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            position: 'absolute',
                                            top: '46px',
                                            right: '10px',
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                                            padding: '6px',
                                            zIndex: 40,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                            minWidth: '150px',
                                        }}
                                    >
                                        <Link
                                            href={`/admin/productos/${prod.id}`}
                                            style={{ padding: '8px 12px', borderRadius: '8px', color: 'var(--foreground)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            ✏️ Editar
                                        </Link>
                                        <button
                                            onClick={() => { duplicateProduct(prod); setOpenMenuId(null); }}
                                            style={{ padding: '8px 12px', borderRadius: '8px', background: 'transparent', color: 'var(--foreground)', border: 'none', fontSize: '0.82rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            📋 Duplicar
                                        </button>
                                        <button
                                            onClick={() => { setInventoryModalProduct(prod); setNewStockInput(prod.stock_quantity ?? 10); setOpenMenuId(null); }}
                                            style={{ padding: '8px 12px', borderRadius: '8px', background: 'transparent', color: 'var(--foreground)', border: 'none', fontSize: '0.82rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            ⚡ Ajustar Stock
                                        </button>
                                        <Link
                                            href={`/productos/${prod.id}`}
                                            target="_blank"
                                            style={{ padding: '8px 12px', borderRadius: '8px', color: 'var(--foreground)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            👁️ Ver en tienda ↗
                                        </Link>
                                        <button
                                            onClick={() => { toggleStatus(prod.id, prod.status || 'active'); setOpenMenuId(null); }}
                                            style={{ padding: '8px 12px', borderRadius: '8px', background: 'transparent', color: 'var(--foreground)', border: 'none', fontSize: '0.82rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            {prod.status === 'active' ? '📦 Pasar a Borrador' : '🚀 Publicar'}
                                        </button>
                                        <button
                                            onClick={() => { deleteProduct(prod.id); setOpenMenuId(null); }}
                                            style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontSize: '0.82rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </div>
                                )}

                                {/* Card Header Image */}
                                <div style={{ height: '150px', width: '100%', background: 'var(--input-bg)', position: 'relative', overflow: 'hidden', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                                    {prod.image ? (
                                        <img src={prod.image} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem' }}>📦</div>
                                    )}

                                    {discountPercent > 0 && (
                                        <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: '#22c55e', color: 'white', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                                            {discountPercent}% OFF
                                        </span>
                                    )}
                                </div>

                                {/* Card Content Body */}
                                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            {prod.category}
                                        </span>
                                        <AdminStatusBadge status={prod.status || 'active'} />
                                    </div>

                                    <h3 title={prod.title} style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--foreground)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {prod.title}
                                    </h3>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sku}</div>

                                    <div style={{ fontSize: '0.75rem', color: variantCount > 0 ? 'var(--robotina-orange)' : 'var(--text-muted)', fontWeight: 700 }}>
                                        {variantCount > 0 ? `🎨 ${variantCount} variantes` : 'Sin variantes'}
                                    </div>

                                    <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div>
                                            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)', display: 'block' }}>
                                                {formatMoney(numPrice)}
                                            </span>
                                            {numCompare && numCompare > numPrice && (
                                                <span style={{ fontSize: '0.72rem', textDecoration: 'line-through', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                                                    {formatMoney(numCompare)}
                                                </span>
                                            )}
                                        </div>

                                        <span style={{
                                            fontSize: '0.74rem',
                                            fontWeight: 800,
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            background: isOut ? 'rgba(239, 68, 68, 0.15)' : (isLow ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.12)'),
                                            color: isOut ? '#ef4444' : (isLow ? '#f59e0b' : '#22c55e'),
                                            border: `1px solid ${isOut ? 'rgba(239, 68, 68, 0.3)' : (isLow ? 'rgba(245, 158, 11, 0.3)' : 'rgba(34, 197, 94, 0.3)')}`,
                                        }}>
                                            {isOut ? 'Agotado' : (isLow ? `⚠️ ${stock} bajo` : `🟢 ${stock} un.`)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {totalCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Mostrando {Math.min((currentPage - 1) * pageSize + 1, totalCount)}–{Math.min(currentPage * pageSize, totalCount)} de {totalCount} productos
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            style={{
                                padding: '6px 12px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--foreground)',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                opacity: currentPage === 1 ? 0.5 : 1,
                            }}
                        >
                            ← Anterior
                        </button>

                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    background: currentPage === page ? 'var(--robotina-orange)' : 'var(--card-bg)',
                                    color: currentPage === page ? 'white' : 'var(--foreground)',
                                    border: '1px solid var(--glass-border)',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            style={{
                                padding: '6px 12px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--foreground)',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                opacity: currentPage === totalPages ? 0.5 : 1,
                            }}
                        >
                            Siguiente →
                        </button>

                        <select
                            value={pageSize}
                            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                            style={{ padding: '6px 10px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.82rem', outline: 'none' }}
                        >
                            <option value={25}>25 por pág.</option>
                            <option value={50}>50 por pág.</option>
                            <option value={100}>100 por pág.</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Quick Inventory Stock Adjustment Modal */}
            {inventoryModalProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <form onSubmit={handleSaveStockModal} style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '18px', padding: '24px', maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)' }}>
                            ⚡ Ajustar Stock Rápidamente
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Producto: <strong>{inventoryModalProduct.title}</strong>
                        </p>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--foreground)' }}>
                                Cantidad en Stock (unidades)
                            </label>
                            <input
                                type="number"
                                required
                                value={newStockInput}
                                onChange={e => setNewStockInput(parseInt(e.target.value, 10) || 0)}
                                style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--input-text)', fontSize: '1rem', fontWeight: 800, outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                                type="submit"
                                style={{ flex: 1, padding: '10px', background: 'var(--gradient-main)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                Guardar Stock
                            </button>
                            <button
                                type="button"
                                onClick={() => setInventoryModalProduct(null)}
                                style={{ padding: '10px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
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
