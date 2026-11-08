'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { CatalogProduct } from '@/modules/catalog/queries';
import { getCategoriesListAction, CategoryRecord } from '@/modules/categories/actions';
import {
    getAdminProductsAction,
    updateProductsFieldsAction,
    duplicateProductAction,
    deleteProductsAction,
    createProductAction,
    ProductBulkPatch,
} from '@/modules/products/actions';
import { getAccessToken } from '@/lib/auth/session';
import { formatMoney, parseMoneyToCents } from '@/lib/money';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

export default function AdminProductsList() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const urlCategory = searchParams?.get('categoria') || 'all';

    const [productsList, setProductsList] = useState<CatalogProduct[]>([]);
    const [dbCategories, setDbCategories] = useState<CategoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // View Mode (Default: 'grid' para ver las cards de productos con su switch)
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('products_view_mode') as 'list' | 'grid';
            if (saved === 'grid' || saved === 'list') return saved;
        }
        return 'grid';
    });

    const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean; items: string[]}>({isOpen: false, items: []});

    // Filtering & Sorting State
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(urlCategory || 'all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [variantFilter, setVariantFilter] = useState('all');
    const [discountFilter, setDiscountFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'newest'>('newest');

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
        try {
            const token = await getAccessToken();
            const res = await getAdminProductsAction(token);
            if (res.success) {
                setProductsList(res.data);
                setLoadError(null);
            } else {
                setLoadError(res.error);
            }
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los productos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [pathname, refreshData]);

    /** Ejecuta una acción de admin en el servidor; si falla, recarga la lista y avisa. */
    const runAdminAction = async (fn: (token: string) => Promise<{ success: boolean; error?: string }>) => {
        try {
            const token = await getAccessToken();
            const res = await fn(token);
            if (!res.success) throw new Error(res.error || 'No se pudo guardar el cambio.');
            return true;
        } catch (err) {
            alert(`⚠️ ${err instanceof Error ? err.message : 'No se pudo guardar el cambio.'}`);
            await refreshData();
            return false;
        }
    };

    const patchProducts = (ids: string[], patch: ProductBulkPatch) =>
        runAdminAction(token => updateProductsFieldsAction(token, ids, patch));

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
            const stock = prod.stock_quantity ?? 10;
            const matchesStatus =
                statusFilter === 'all' ? true :
                statusFilter === 'out' ? stock === 0 :
                statusFilter === 'low' ? (stock > 0 && stock <= 5) :
                (prod.status || 'active').toLowerCase() === statusFilter.toLowerCase();

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
    }, [productsList, searchQuery, categoryFilter, statusFilter, stockFilter, variantFilter, discountFilter, sortBy, dbCategories]);

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
        await patchProducts([productId], { status: nextStatus });
    };

    const renderProductSwitch = (prod: CatalogProduct) => {
        const isActive = (prod.status || 'active') === 'active';
        return (
            <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleStatus(prod.id, prod.status || 'active');
                }}
                title={isActive ? 'Producto encendido en la tienda (Clic para apagar)' : 'Producto apagado y oculto en la tienda (Clic para encender)'}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '4px 8px 4px 6px',
                    borderRadius: '999px',
                    background: 'var(--card-bg)',
                    border: `1px solid ${isActive ? 'rgba(22, 163, 74, 0.35)' : 'var(--glass-border)'}`,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s ease',
                }}
            >
                <span
                    style={{
                        width: '34px',
                        height: '19px',
                        borderRadius: '999px',
                        background: isActive ? '#16a34a' : '#94a3b8',
                        position: 'relative',
                        transition: 'background 0.2s ease',
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            position: 'absolute',
                            top: '2px',
                            left: isActive ? '17px' : '2px',
                            width: '15px',
                            height: '15px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                            transition: 'left 0.2s ease',
                        }}
                    />
                </span>
                <span
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: isActive ? '#16a34a' : '#64748b',
                        letterSpacing: '0.02em',
                    }}
                >
                    {isActive ? 'ON' : 'OFF'}
                </span>
            </button>
        );
    };

    const duplicateProduct = async (prod: CatalogProduct) => {
        const token = await getAccessToken().catch(() => null);
        if (!token) return alert('Tu sesión expiró. Vuelve a iniciar sesión.');
        const res = await duplicateProductAction(token, prod.id);
        if (!res.success) return alert(`⚠️ ${res.error}`);
        setProductsList(prev => [res.data, ...prev]);
    };

    const deleteProduct = async (productId: string) => {
        setDeleteConfirm({ isOpen: true, items: [productId] });
    };

    // Bulk Actions Handlers
    const handleBulkStatusChange = async (nextStatus: 'active' | 'draft') => {
        const ids = [...selectedIds];
        setProductsList(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: nextStatus } : p));
        setSelectedIds([]);
        await patchProducts(ids, { status: nextStatus });
    };

    const handleBulkCategoryChange = async () => {
        if (dbCategories.length === 0) {
            alert('Primero crea categorías en el módulo de Categorías.');
            return;
        }
        const options = dbCategories.map(c => c.name).join(', ');
        const newCat = prompt(`Escribe la categoría para los productos seleccionados:\n(${options})`);
        if (!newCat || !newCat.trim()) return;

        const target = dbCategories.find(c => c.name.toLowerCase() === newCat.trim().toLowerCase());
        if (!target) {
            alert(`No existe la categoría "${newCat.trim()}". Opciones: ${options}`);
            return;
        }

        const ids = [...selectedIds];
        setProductsList(prev => prev.map(p => ids.includes(p.id) ? { ...p, category: target.name, category_id: target.id } : p));
        setSelectedIds([]);
        await patchProducts(ids, { category_id: target.id });
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
        const formattedPrice = formatMoney(numPrice);
        const ids = [...selectedIds];

        setProductsList(prev => prev.map(p => ids.includes(p.id) ? { ...p, price: formattedPrice, price_amount: cents } : p));
        setSelectedIds([]);
        await patchProducts(ids, { price_amount: cents });
    };

    const handleBulkStockUpdate = async () => {
        const inputStock = prompt('Ingrese la cantidad de unidades en stock para los productos seleccionados:');
        if (inputStock === null) return;

        const stockNum = parseInt(inputStock, 10);
        if (isNaN(stockNum) || stockNum < 0) {
            alert('Stock inválido');
            return;
        }

        const ids = [...selectedIds];
        setProductsList(prev => prev.map(p => ids.includes(p.id) ? { ...p, stock_quantity: stockNum } : p));
        setSelectedIds([]);
        await patchProducts(ids, { stock_quantity: stockNum });
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setDeleteConfirm({ isOpen: true, items: selectedIds });
    };

    const confirmDeleteItems = async () => {
        const ids = deleteConfirm.items;
        if (!ids.length) return;
        setDeleteConfirm({ isOpen: false, items: [] });
        setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
        setProductsList(prev => prev.filter(p => !ids.includes(p.id)));

        const token = await getAccessToken().catch(() => null);
        if (!token) return alert('Tu sesión expiró. Vuelve a iniciar sesión.');
        const res = await deleteProductsAction(token, ids);
        if (!res.success) {
            alert(`⚠️ ${res.error}`);
            await refreshData();
            return;
        }
        if (res.data.archived > 0) {
            alert(`ℹ️ ${res.data.archived} producto(s) tenían pedidos registrados, así que se archivaron (ya no se ven en la tienda) en lugar de borrarse para conservar tu historial de ventas.`);
        }
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

            const rows: { title: string; cents: number; stock: number; categoryName: string }[] = [];
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(p => p.replace(/^"|"$/g, '').trim());
                if (parts.length >= 2) {
                    rows.push({
                        title: parts[1] || parts[0] || `Producto Importado ${i}`,
                        categoryName: parts[2] || '',
                        cents: parseMoneyToCents(parts[3] || '0'),
                        stock: parseInt(parts[4] || '0', 10) || 0,
                    });
                }
            }
            if (rows.length === 0) return;

            (async () => {
                const token = await getAccessToken().catch(() => null);
                if (!token) return alert('Tu sesión expiró. Vuelve a iniciar sesión.');
                let ok = 0;
                const errors: string[] = [];
                for (const row of rows) {
                    const cat = dbCategories.find(c => c.name.toLowerCase() === row.categoryName.toLowerCase());
                    const res = await createProductAction(token, {
                        name: row.title,
                        short_description: `Producto importado desde CSV (${row.title})`,
                        price_amount: row.cents,
                        product_type: 'physical',
                        category_id: cat?.id || null,
                        status: 'draft',
                        track_inventory: true,
                        stock_quantity: row.stock,
                    });
                    if (res.success) ok++;
                    else errors.push(`${row.title}: ${res.error}`);
                }
                await refreshData();
                alert(`✅ Se importaron ${ok} de ${rows.length} productos como borrador. Agrega sus fotos y actívalos.${errors.length ? `\n\nErrores:\n${errors.slice(0, 5).join('\n')}` : ''}`);
            })();
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
        const id = inventoryModalProduct.id;

        setProductsList(prev => prev.map(p => p.id === id ? { ...p, stock_quantity: newStockInput } : p));
        setInventoryModalProduct(null);
        await patchProducts([id], { stock_quantity: newStockInput });
    };

    return (
        <div>
            <ConfirmDialog 
                isOpen={deleteConfirm.isOpen}
                title="Eliminar Productos"
                message={`¿Estás seguro de que deseas eliminar ${deleteConfirm.items.length === 1 ? 'este producto' : `los ${deleteConfirm.items.length} productos seleccionados`}? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                danger={true}
                onConfirm={confirmDeleteItems}
                onCancel={() => setDeleteConfirm({ isOpen: false, items: [] })}
            />

            <input
                type="file"
                ref={csvFileInputRef}
                accept=".csv"
                onChange={handleImportCSVFile}
                style={{ display: 'none' }}
            />

            <AdminPageHeader
                title={`Gestión de Productos (${totalCount})`}
                leftAction={
                    <Link
                        href="/admin/productos/nuevo"
                        style={{
                            padding: '8px 16px',
                            background: 'var(--robotina-orange, #ff6b00)',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)',
                        }}
                    >
                        + Nuevo Producto
                    </Link>
                }
                action={
                    <button
                        onClick={handleExportCSV}
                        title="Exportar CSV"
                        aria-label="Exportar CSV"
                        style={{
                            width: '38px',
                            height: '38px',
                            padding: 0,
                            background: 'var(--card-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'var(--foreground)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    </button>
                }
            />

            {/* Barra de Filtros y Vista (1 sola fila limpia) */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {/* Buscador */}
                    <div style={{ position: 'relative', flex: '1 1 240px' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍</span>
                        <input
                            type="search"
                            name="q_search_products"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar producto..."
                            style={{
                                width: '100%',
                                padding: '9px 14px 9px 36px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--input-text)',
                                fontSize: '0.86rem',
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* Categoría */}
                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        style={{ padding: '9px 12px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="all">Categoría: Todas</option>
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

                    {/* Estado + Stock unificados */}
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ padding: '9px 12px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="all">Estado: Todos</option>
                        <option value="active">Encendidos (ON)</option>
                        <option value="draft">Apagados (OFF)</option>
                        <option value="low">Stock bajo (≤5)</option>
                        <option value="out">Agotados (0)</option>
                    </select>

                    {/* Ordenar */}
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as typeof sortBy)}
                        style={{ padding: '9px 12px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="newest">Ordenar: Recientes</option>
                        <option value="price_asc">Precio: Menor a Mayor</option>
                        <option value="price_desc">Precio: Mayor a Menor</option>
                        <option value="name_asc">Nombre: A - Z</option>
                        <option value="stock_desc">Mayor Stock</option>
                    </select>

                    {/* Limpiar (solo cuando hay filtro activo) */}
                    {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'newest') && (
                        <button
                            onClick={clearFilters}
                            style={{ padding: '9px 12px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            ✕ Limpiar
                        </button>
                    )}

                    {/* Selector compacto de Vista (solo íconos) */}
                    <div style={{ display: 'flex', background: 'var(--card-bg)', padding: '3px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <button
                            onClick={() => { setViewMode('grid'); localStorage.setItem('products_view_mode', 'grid'); }}
                            title="Vista en Cuadrícula (Cards)"
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                background: viewMode === 'grid' ? 'var(--robotina-orange)' : 'transparent',
                                color: viewMode === 'grid' ? '#ffffff' : 'var(--foreground)',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            ⊞
                        </button>
                        <button
                            onClick={() => { setViewMode('list'); localStorage.setItem('products_view_mode', 'list'); }}
                            title="Vista en Lista"
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                background: viewMode === 'list' ? 'var(--robotina-orange)' : 'transparent',
                                color: viewMode === 'list' ? '#ffffff' : 'var(--foreground)',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            ☰
                        </button>
                    </div>
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

            {loadError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.88rem', fontWeight: 600 }}>
                    ⚠️ No se pudieron cargar los productos: {loadError}
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
                                const isActive = (prod.status || 'active') === 'active';

                                return (
                                    <tr
                                        key={prod.id}
                                        style={{
                                            borderBottom: '1px solid var(--glass-border)',
                                            background: !isActive
                                                ? 'rgba(148, 163, 184, 0.12)'
                                                : isSelected
                                                    ? 'rgba(255, 107, 0, 0.05)'
                                                    : 'transparent',
                                            transition: 'all 0.15s ease',
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
                                        <td style={{ padding: '14px 16px', filter: isActive ? 'none' : 'grayscale(100%)', opacity: isActive ? 1 : 0.55 }}>
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
                                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, opacity: isActive ? 1 : 0.55 }}>
                                            {prod.category}
                                        </td>

                                        {/* Price & Offer */}
                                        <td style={{ padding: '14px 16px', filter: isActive ? 'none' : 'grayscale(100%)', opacity: isActive ? 1 : 0.55 }}>
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
                                        <td style={{ padding: '14px 16px', filter: isActive ? 'none' : 'grayscale(100%)', opacity: isActive ? 1 : 0.55 }}>
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
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                {renderProductSwitch(prod)}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(isMenuOpen ? null : prod.id);
                                                    }}
                                                    style={{
                                                    width: '26px',
                                                    height: '26px',
                                                    minWidth: '26px',
                                                    minHeight: '26px',
                                                    padding: 0,
                                                    background: 'var(--glass-bg)',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '50%',
                                                    color: 'var(--foreground)',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    lineHeight: 1,
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
                                            </div>
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
                        const isActive = (prod.status || 'active') === 'active';

                        return (
                            <div
                                key={prod.id}
                                style={{
                                    background: isActive ? 'var(--card-bg)' : 'rgba(148, 163, 184, 0.14)',
                                    border: isSelected ? '2px solid var(--robotina-orange)' : '1px solid var(--glass-border)',
                                    borderRadius: '16px',
                                    overflow: 'visible',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.2s ease',
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

                                {/* Switch de Encendido / Apagado en la Card */}
                                <div style={{ position: 'absolute', top: '8px', right: '40px', zIndex: 30 }}>
                                    {renderProductSwitch(prod)}
                                </div>

                                {/* Three Dots Menu Button (⋮) Top Right */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(isMenuOpen ? null : prod.id);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        width: '26px',
                                        height: '26px',
                                        minWidth: '26px',
                                        minHeight: '26px',
                                        borderRadius: '50%',
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--glass-border)',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                                        color: 'var(--foreground)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 0,
                                        margin: 0,
                                        lineHeight: 1,
                                        zIndex: 30,
                                        fontSize: '0.9rem',
                                        fontWeight: 800,
                                        boxSizing: 'border-box',
                                        flexShrink: 0,
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
                                            top: '38px',
                                            right: '8px',
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
                                <div style={{ height: '150px', width: '100%', background: 'var(--input-bg)', position: 'relative', overflow: 'hidden', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', filter: isActive ? 'none' : 'grayscale(100%)', opacity: isActive ? 1 : 0.5 }}>
                                    {prod.image ? (
                                        <img src={prod.image} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem' }}>📦</div>
                                    )}

                                    {!isActive && (
                                        <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: '#334155', color: '#ffffff', fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                            Oculto en tienda
                                        </span>
                                    )}

                                    {discountPercent > 0 && isActive && (
                                        <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: '#22c55e', color: 'white', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                                            {discountPercent}% OFF
                                        </span>
                                    )}
                                </div>

                                {/* Card Content Body */}
                                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, filter: isActive ? 'none' : 'grayscale(100%)', opacity: isActive ? 1 : 0.58 }}>
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
