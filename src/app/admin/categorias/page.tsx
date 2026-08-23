'use client';

import React, { useEffect, useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { getInstantProducts } from '@/modules/catalog/queries';
import { supabase } from '@/lib/supabase';
import {
    CategoryRecord,
    CategoryPayload,
    getCategoriesListAction,
    createCategoryAction,
    updateCategoryAction,
    deleteCategoryAction,
    duplicateCategoryAction,
    reorderCategoriesAction,
} from '@/modules/categories/actions';
import { generateSlug, isDescendant } from '@/modules/categories/utils';

export default function AdminCategoriesPage() {
    const router = useRouter();

    const [categories, setCategories] = useState<CategoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // UI & Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'hidden'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [parentId, setParentId] = useState<string>('');
    const [imageUrl, setImageUrl] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [slug, setSlug] = useState('');
    const [isSlugAuto, setIsSlugAuto] = useState(true);
    const [sortOrder, setSortOrder] = useState(0);
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDescription, setSeoDescription] = useState('');
    const [activeFormTab, setActiveFormTab] = useState<'general' | 'seo'>('general');

    // Notification toast
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Deletion Modal State
    const [deleteModalCat, setDeleteModalCat] = useState<CategoryRecord | null>(null);
    const [deleteOption, setDeleteOption] = useState<'orphan' | 'reassign'>('orphan');
    const [targetReassignId, setTargetReassignId] = useState<string>('');

    // Open Action Menu dropdown state
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Image upload state
    const [uploadingImage, setUploadingImage] = useState(false);

    // Load Categories
    const loadCategories = async () => {
        setLoading(true);
        const res = await getCategoriesListAction();
        if (res.success && res.categories) {
            setCategories(res.categories);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    // Products list for counting
    const products = useMemo(() => {
        const instant = getInstantProducts();
        if (typeof window !== 'undefined') {
            try {
                const local = JSON.parse(localStorage.getItem('admin_products') || '[]');
                return [...instant, ...local];
            } catch {
                return instant;
            }
        }
        return instant;
    }, []);

    // Calculate real product counts for each category
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};

        categories.forEach(cat => {
            let count = 0;
            products.forEach(p => {
                const pCategory = p.category || '';
                const pCategoryId = p.category_id || '';
                if (
                    pCategoryId === cat.id ||
                    pCategory.toLowerCase() === cat.name.toLowerCase() ||
                    pCategory.toLowerCase() === cat.slug.toLowerCase()
                ) {
                    count++;
                }
            });
            counts[cat.id] = count;
        });

        return counts;
    }, [categories, products]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    // Auto generate slug on name change if slug wasn't manually overridden
    const handleNameChange = (val: string) => {
        setName(val);
        if (isSlugAuto) {
            setSlug(generateSlug(val));
        }
    };

    const handleSlugChange = (val: string) => {
        setSlug(val);
        setIsSlugAuto(false);
    };

    const openCreateModal = () => {
        setEditingCategory(null);
        setName('');
        setDescription('');
        setParentId('');
        setImageUrl('');
        setIsActive(true);
        setSlug('');
        setIsSlugAuto(true);
        setSortOrder(categories.length + 1);
        setSeoTitle('');
        setSeoDescription('');
        setActiveFormTab('general');
        setFormError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (cat: CategoryRecord) => {
        setEditingCategory(cat);
        setName(cat.name);
        setDescription(cat.description || '');
        setParentId(cat.parent_id || '');
        setImageUrl(cat.image_url || '');
        setIsActive(cat.is_active);
        setSlug(cat.slug);
        setIsSlugAuto(false);
        setSortOrder(cat.sort_order || 0);
        setSeoTitle(cat.seo_title || '');
        setSeoDescription(cat.seo_description || '');
        setActiveFormTab('general');
        setFormError(null);
        setIsModalOpen(true);
        setOpenMenuId(null);
    };

    // Form Save
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!name.trim()) {
            setFormError('El nombre de la categoría es obligatorio.');
            return;
        }

        const payload: CategoryPayload = {
            name: name.trim(),
            description: description.trim(),
            parent_id: parentId || null,
            image_url: imageUrl.trim() || undefined,
            is_active: isActive,
            slug: slug.trim() || generateSlug(name),
            sort_order: Number(sortOrder) || 0,
            seo_title: seoTitle.trim() || undefined,
            seo_description: seoDescription.trim() || undefined,
        };

        startTransition(async () => {
            if (editingCategory) {
                const res = await updateCategoryAction(editingCategory.id, payload);
                if (res.success) {
                    showToast(`Categoría "${name}" actualizada correctamente.`);
                    setIsModalOpen(false);
                    await loadCategories();
                } else {
                    setFormError(res.error || 'Error al actualizar categoría.');
                }
            } else {
                const res = await createCategoryAction(payload);
                if (res.success) {
                    showToast(`Categoría "${name}" creada correctamente.`);
                    setIsModalOpen(false);
                    await loadCategories();
                } else {
                    setFormError(res.error || 'Error al crear categoría.');
                }
            }
        });
    };

    // Duplicate Handler
    const handleDuplicate = async (cat: CategoryRecord) => {
        setOpenMenuId(null);
        startTransition(async () => {
            const res = await duplicateCategoryAction(cat.id);
            if (res.success) {
                showToast(`Se duplicó la categoría "${cat.name}".`);
                await loadCategories();
            } else {
                showToast(`Error: ${res.error}`);
            }
        });
    };

    // Toggle Active Handler
    const handleToggleActive = async (cat: CategoryRecord) => {
        setOpenMenuId(null);
        startTransition(async () => {
            const res = await updateCategoryAction(cat.id, {
                name: cat.name,
                is_active: !cat.is_active,
                slug: cat.slug,
                parent_id: cat.parent_id,
            });
            if (res.success) {
                showToast(`Categoría "${cat.name}" ahora está ${!cat.is_active ? 'Activa' : 'Oculta'}.`);
                await loadCategories();
            }
        });
    };

    // Open Safe Delete Modal
    const handleOpenDeleteModal = (cat: CategoryRecord) => {
        setOpenMenuId(null);
        setDeleteModalCat(cat);
        setDeleteOption('orphan');
        const firstAvailableTarget = categories.find(c => c.id !== cat.id)?.id || '';
        setTargetReassignId(firstAvailableTarget);
    };

    // Confirm Delete
    const handleConfirmDelete = async () => {
        if (!deleteModalCat) return;

        startTransition(async () => {
            const count = categoryCounts[deleteModalCat.id] || 0;
            const res = await deleteCategoryAction(deleteModalCat.id, {
                productOption: count > 0 ? deleteOption : 'orphan',
                targetCategoryId: deleteOption === 'reassign' ? targetReassignId : undefined,
            });

            if (res.success) {
                showToast(`Categoría "${deleteModalCat.name}" eliminada.`);
                setDeleteModalCat(null);
                await loadCategories();
            } else {
                showToast(`Error al eliminar: ${res.error}`);
            }
        });
    };

    // Reorder Handlers
    const handleMoveOrder = async (cat: CategoryRecord, direction: 'up' | 'down') => {
        // Find siblings (same parent_id)
        const siblings = categories.filter(c => (c.parent_id || null) === (cat.parent_id || null));
        const index = siblings.findIndex(c => c.id === cat.id);
        if (index === -1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= siblings.length) return;

        const other = siblings[targetIndex];
        const updated = [
            { id: cat.id, sort_order: other.sort_order || targetIndex },
            { id: other.id, sort_order: cat.sort_order || index }
        ];

        startTransition(async () => {
            await reorderCategoriesAction(updated);
            await loadCategories();
        });
    };

    // Image Upload helper using Supabase Storage
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const isPlaceholderUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project');

            if (!isPlaceholderUrl) {
                const fileExt = file.name.split('.').pop();
                const fileName = `category-${Date.now()}.${fileExt}`;
                const filePath = `categories/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, file);

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from('product-images')
                        .getPublicUrl(filePath);

                    if (urlData?.publicUrl) {
                        setImageUrl(urlData.publicUrl);
                        setUploadingImage(false);
                        return;
                    }
                }
            }

            // Local fallback preview if Supabase Storage is offline
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImageUrl(event.target.result as string);
                }
                setUploadingImage(false);
            };
            reader.readAsDataURL(file);
        } catch {
            setUploadingImage(false);
        }
    };

    // Format Singular / Plural product count (Section 14)
    const formatProductCount = (count: number) => {
        if (count === 1) return '1 producto';
        return `${count} productos`;
    };

    // Filter categories by search and tab
    const filteredCategories = useMemo(() => {
        return categories.filter(cat => {
            const matchesTab =
                activeTab === 'all' ? true :
                    activeTab === 'active' ? cat.is_active :
                        !cat.is_active;

            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                cat.name.toLowerCase().includes(q) ||
                (cat.description && cat.description.toLowerCase().includes(q)) ||
                cat.slug.toLowerCase().includes(q);

            return matchesTab && matchesSearch;
        });
    }, [categories, activeTab, searchQuery]);

    // Build hierarchical tree structure for table rendering (Root categories -> indented children)
    const structuredCategoryRows = useMemo(() => {
        const rootCategories = filteredCategories.filter(c => !c.parent_id);

        const result: { category: CategoryRecord; depth: number; isLastChild?: boolean }[] = [];

        const addCategoryAndChildren = (cat: CategoryRecord, depth: number) => {
            result.push({ category: cat, depth });
            const children = filteredCategories.filter(c => c.parent_id === cat.id);
            children.forEach((child, idx) => {
                addCategoryAndChildren(child, depth + 1);
            });
        };

        rootCategories.forEach(root => {
            addCategoryAndChildren(root, 0);
        });

        // Add orphan children (whose parent was filtered out by search/tab)
        const addedIds = new Set(result.map(r => r.category.id));
        filteredCategories.forEach(cat => {
            if (!addedIds.has(cat.id)) {
                result.push({ category: cat, depth: cat.parent_id ? 1 : 0 });
            }
        });

        return result;
    }, [filteredCategories]);

    // Options for Parent Category Selector (excluding self and descendants to prevent cycles)
    const parentCategoryOptions = useMemo(() => {
        if (!editingCategory) {
            return categories;
        }
        return categories.filter(c => !isDescendant(categories, editingCategory.id, c.id));
    }, [categories, editingCategory]);

    return (
        <div style={{ paddingBottom: '60px' }}>
            {/* PAGE HEADER */}
            <AdminPageHeader
                title="Categorías de Productos"
                description="Organiza tu catálogo para que tus clientes encuentren los productos fácilmente."
                action={
                    <button
                        onClick={openCreateModal}
                        style={{
                            padding: '10px 18px',
                            background: 'var(--robotina-orange)',
                            color: '#ffffff',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(255, 107, 0, 0.3)',
                        }}
                    >
                        <span>+</span> Nueva Categoría
                    </button>
                }
            />

            {/* NOTIFICATION TOAST */}
            {toastMessage && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    background: 'var(--card-bg)',
                    color: 'var(--foreground)',
                    padding: '14px 22px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--robotina-orange)',
                    fontWeight: 700,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                }}>
                    💬 {toastMessage}
                </div>
            )}

            {/* BARRA SUPERIOR CON COUNTER, FILTROS Y BUSCADOR */}
            <div style={{
                background: 'var(--card-bg)',
                border: '1.5px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                {/* Counter */}
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    Categorías de Productos <span style={{ color: 'var(--robotina-orange)' }}>({categories.length})</span>
                </div>

                {/* Filter Tabs & Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: '600px', justifyContent: 'flex-end' }}>
                    {/* Status Tabs */}
                    <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: '8px', padding: '3px', border: '1px solid var(--glass-border)' }}>
                        <button
                            onClick={() => setActiveTab('all')}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: activeTab === 'all' ? 'var(--card-bg)' : 'transparent',
                                color: activeTab === 'all' ? 'var(--foreground)' : 'var(--text-muted)',
                            }}
                        >
                            Todas ({categories.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('active')}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: activeTab === 'active' ? 'var(--card-bg)' : 'transparent',
                                color: activeTab === 'active' ? '#16a34a' : 'var(--text-muted)',
                            }}
                        >
                            Activas ({categories.filter(c => c.is_active).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('hidden')}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: activeTab === 'hidden' ? 'var(--card-bg)' : 'transparent',
                                color: activeTab === 'hidden' ? '#d97706' : 'var(--text-muted)',
                            }}
                        >
                            Ocultas ({categories.filter(c => !c.is_active).length})
                        </button>
                    </div>

                    {/* Search Input */}
                    <div style={{ position: 'relative', minWidth: '220px', flexGrow: 1 }}>
                        <input
                            type="text"
                            placeholder="Buscar categoría..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 34px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--input-bg)',
                                color: 'var(--foreground)',
                                fontSize: '0.85rem',
                                outline: 'none',
                            }}
                        />
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '0.85rem' }}>
                            🔍
                        </span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* TABLA PRINCIPAL DE CATEGORÍAS */}
            <div style={{
                background: 'var(--card-bg)',
                border: '1.5px solid var(--glass-border)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Cargando categorías de la tienda...
                    </div>
                ) : structuredCategoryRows.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📂</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
                            {searchQuery ? 'No se encontraron categorías' : 'No hay categorías creadas'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '18px' }}>
                            {searchQuery ? 'Intenta con otro término de búsqueda.' : 'Crea la primera categoría para estructurar tu catálogo comercial.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={openCreateModal}
                                style={{
                                    padding: '9px 16px',
                                    background: 'var(--robotina-orange)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                + Nueva Categoría
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1.5px solid var(--glass-border)', color: 'var(--text-muted)', background: 'var(--input-bg)' }}>
                                    <th style={{ padding: '12px 16px', width: '40%' }}>Categoría</th>
                                    <th style={{ padding: '12px 16px', width: '15%' }}>Estado</th>
                                    <th style={{ padding: '12px 16px', width: '20%' }}>Productos</th>
                                    <th style={{ padding: '12px 16px', width: '10%', textAlign: 'center' }}>Orden</th>
                                    <th style={{ padding: '12px 16px', width: '15%', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {structuredCategoryRows.map(({ category: cat, depth }) => {
                                    const pCount = categoryCounts[cat.id] || 0;
                                    const isSubcategory = depth > 0;

                                    return (
                                        <tr
                                            key={cat.id}
                                            style={{
                                                borderBottom: '1px solid var(--glass-border)',
                                                background: isSubcategory ? 'rgba(255,255,255,0.015)' : 'transparent',
                                                transition: 'background 0.15s ease',
                                            }}
                                        >
                                            {/* CATEGORÍA (Con Indentación para Subcategorías) */}
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: `${depth * 28}px` }}>
                                                    {isSubcategory && (
                                                        <span style={{ color: 'var(--robotina-orange)', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                                                            ↳
                                                        </span>
                                                    )}

                                                    {/* Thumbnail Image or Emoji Icon */}
                                                    <div style={{
                                                        width: isSubcategory ? '36px' : '44px',
                                                        height: isSubcategory ? '36px' : '44px',
                                                        borderRadius: '10px',
                                                        background: 'var(--input-bg)',
                                                        border: '1px solid var(--glass-border)',
                                                        overflow: 'hidden',
                                                        flexShrink: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        {cat.image_url ? (
                                                            <img
                                                                src={cat.image_url}
                                                                alt={cat.name}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <span style={{ fontSize: isSubcategory ? '1rem' : '1.2rem' }}>
                                                                {isSubcategory ? '🏷️' : '📦'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: isSubcategory ? '0.88rem' : '0.94rem' }}>
                                                            {cat.name}
                                                        </div>
                                                        {cat.description && (
                                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-description)', marginTop: '2px', lineHeight: 1.3 }}>
                                                                {cat.description}
                                                            </div>
                                                        )}
                                                        <div style={{ fontSize: '0.74rem', color: '#2563eb', fontFamily: 'monospace', marginTop: '1px' }}>
                                                            /{cat.slug}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* ESTADO (Activa / Oculta) */}
                                            <td style={{ padding: '14px 16px' }}>
                                                {cat.is_active ? (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        background: 'rgba(34, 197, 94, 0.12)',
                                                        border: '1px solid rgba(34, 197, 94, 0.3)',
                                                        color: '#16a34a',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 700,
                                                    }}>
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                                                        Activa
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        background: 'rgba(245, 158, 11, 0.12)',
                                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                                        color: '#d97706',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 700,
                                                    }}>
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706' }} />
                                                        Oculta
                                                    </span>
                                                )}
                                            </td>

                                            {/* PRODUCTOS (Contador Clicable) */}
                                            <td style={{ padding: '14px 16px' }}>
                                                <button
                                                    onClick={() => router.push(`/admin/productos?categoria=${encodeURIComponent(cat.id)}`)}
                                                    title={`Ver productos de la categoría ${cat.name}`}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        padding: 0,
                                                        color: pCount > 0 ? 'var(--robotina-orange)' : 'var(--text-muted)',
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem',
                                                        cursor: 'pointer',
                                                        textDecoration: pCount > 0 ? 'underline' : 'none',
                                                    }}
                                                >
                                                    {formatProductCount(pCount)}
                                                </button>
                                            </td>

                                            {/* ORDEN (Botones Reordenar) */}
                                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <button
                                                        onClick={() => handleMoveOrder(cat, 'up')}
                                                        title="Subir posición"
                                                        style={{
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            border: '1px solid var(--glass-border)',
                                                            background: 'var(--input-bg)',
                                                            color: 'var(--foreground)',
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        ▲
                                                    </button>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: '20px', textAlign: 'center' }}>
                                                        {cat.sort_order}
                                                    </span>
                                                    <button
                                                        onClick={() => handleMoveOrder(cat, 'down')}
                                                        title="Bajar posición"
                                                        style={{
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            border: '1px solid var(--glass-border)',
                                                            background: 'var(--input-bg)',
                                                            color: 'var(--foreground)',
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        ▼
                                                    </button>
                                                </div>
                                            </td>

                                            {/* ACCIONES (Menú Tres Puntos) */}
                                            <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === cat.id ? null : cat.id)}
                                                    style={{
                                                        padding: '6px 10px',
                                                        background: 'var(--input-bg)',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: '8px',
                                                        color: 'var(--foreground)',
                                                        fontWeight: 800,
                                                        cursor: 'pointer',
                                                        fontSize: '1rem',
                                                    }}
                                                >
                                                    ⋮
                                                </button>

                                                {openMenuId === cat.id && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        right: '16px',
                                                        top: '46px',
                                                        zIndex: 100,
                                                        background: 'var(--card-bg)',
                                                        border: '1.5px solid var(--glass-border)',
                                                        borderRadius: '12px',
                                                        padding: '6px 0',
                                                        width: '170px',
                                                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                                        textAlign: 'left',
                                                    }}>
                                                        <button
                                                            onClick={() => openEditModal(cat)}
                                                            style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: 'var(--foreground)', fontSize: '0.83rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                        >
                                                            ✏️ Editar
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                router.push(`/admin/productos?categoria=${encodeURIComponent(cat.id)}`);
                                                            }}
                                                            style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: 'var(--foreground)', fontSize: '0.83rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                        >
                                                            📦 Ver productos
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleActive(cat)}
                                                            style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: cat.is_active ? '#d97706' : '#16a34a', fontSize: '0.83rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                        >
                                                            {cat.is_active ? '👁️‍🗨️ Ocultar' : '👁️ Activar'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDuplicate(cat)}
                                                            style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: 'var(--foreground)', fontSize: '0.83rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                        >
                                                            📋 Duplicar
                                                        </button>
                                                        <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />
                                                        <button
                                                            onClick={() => handleOpenDeleteModal(cat)}
                                                            style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.83rem', fontWeight: 700, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
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
                )}
            </div>

            {/* FORMULARIO MODAL DE CREAR / EDITAR CATEGORÍA */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9990,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}>
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1.5px solid var(--glass-border)',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '620px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '28px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    }}>
                        {/* Header Modal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>
                                {editingCategory ? `Editar Categoría: ${editingCategory.name}` : 'Nueva Categoría'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        {formError && (
                            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600 }}>
                                ⚠️ {formError}
                            </div>
                        )}

                        {/* Pestañas del Formulario */}
                        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px' }}>
                            <button
                                type="button"
                                onClick={() => setActiveFormTab('general')}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderBottom: activeFormTab === 'general' ? '2.5px solid var(--robotina-orange)' : '2.5px solid transparent',
                                    background: 'none',
                                    color: activeFormTab === 'general' ? 'var(--foreground)' : 'var(--text-muted)',
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Información General
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveFormTab('seo')}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderBottom: activeFormTab === 'seo' ? '2.5px solid var(--robotina-orange)' : '2.5px solid transparent',
                                    background: 'none',
                                    color: activeFormTab === 'seo' ? 'var(--foreground)' : 'var(--text-muted)',
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    cursor: 'pointer',
                                }}
                            >
                                SEO (Opcional)
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            {activeFormTab === 'general' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* Nombre */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
                                            Nombre de la Categoría *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="ej. Dispositivos"
                                            value={name}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 14px',
                                                borderRadius: '10px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--input-bg)',
                                                color: 'var(--foreground)',
                                                fontSize: '0.9rem',
                                            }}
                                        />
                                    </div>

                                    {/* Categoría Superior (Parent ID) */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
                                            Categoría Superior (Padre)
                                        </label>
                                        <select
                                            value={parentId}
                                            onChange={(e) => setParentId(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 14px',
                                                borderRadius: '10px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--input-bg)',
                                                color: 'var(--foreground)',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            <option value="">Sin categoría superior (Categoría Raíz)</option>
                                            {parentCategoryOptions.map(pCat => (
                                                <option key={pCat.id} value={pCat.id}>
                                                    {pCat.parent_id ? `  ↳ ${pCat.name}` : pCat.name}
                                                </option>
                                            ))}
                                        </select>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                            Si seleccionas una categoría superior, esta categoría se convertirá en subcategoría.
                                        </span>
                                    </div>

                                    {/* Descripción */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
                                            Descripción Comercial
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="ej. Equipos y dispositivos de vapeo para el catálogo..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 14px',
                                                borderRadius: '10px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--input-bg)',
                                                color: 'var(--foreground)',
                                                fontSize: '0.9rem',
                                                resize: 'vertical',
                                            }}
                                        />
                                    </div>

                                    {/* Imagen de Categoría (Subir / URL / Preview) */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
                                            Imagen de Categoría (Opcional)
                                        </label>
                                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                            <div style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '12px',
                                                border: '1.5px solid var(--glass-border)',
                                                background: 'var(--input-bg)',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>🖼️</span>
                                                )}
                                            </div>

                                            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <input
                                                    type="url"
                                                    placeholder="https://ejemplo.com/imagen.jpg"
                                                    value={imageUrl}
                                                    onChange={(e) => setImageUrl(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--glass-border)',
                                                        background: 'var(--input-bg)',
                                                        color: 'var(--foreground)',
                                                        fontSize: '0.85rem',
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <label style={{
                                                        padding: '5px 12px',
                                                        background: 'var(--input-bg)',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: '6px',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        color: 'var(--foreground)',
                                                    }}>
                                                        {uploadingImage ? 'Subiendo...' : '📤 Subir imagen'}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                            style={{ display: 'none' }}
                                                        />
                                                    </label>
                                                    {imageUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setImageUrl('')}
                                                            style={{ padding: '5px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                                        >
                                                            Quitar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Estado (Activa / Oculta) */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
                                            Estado de Visibilidad
                                        </label>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                                                <input
                                                    type="radio"
                                                    name="is_active"
                                                    checked={isActive}
                                                    onChange={() => setIsActive(true)}
                                                />
                                                <span style={{ fontWeight: 700, color: '#16a34a' }}>● Activa</span> (Visible en tienda pública)
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                                                <input
                                                    type="radio"
                                                    name="is_active"
                                                    checked={!isActive}
                                                    onChange={() => setIsActive(false)}
                                                />
                                                <span style={{ fontWeight: 700, color: '#d97706' }}>○ Oculta</span> (Solo administración)
                                            </label>
                                        </div>
                                    </div>

                                    {/* Slug & Orden */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '14px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
                                                URL / Slug
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="dispositivos"
                                                value={slug}
                                                onChange={(e) => handleSlugChange(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '9px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'var(--input-bg)',
                                                    color: 'var(--foreground)',
                                                    fontSize: '0.85rem',
                                                    fontFamily: 'monospace',
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
                                                Posición
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={sortOrder}
                                                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                                                style={{
                                                    width: '100%',
                                                    padding: '9px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'var(--input-bg)',
                                                    color: 'var(--foreground)',
                                                    fontSize: '0.85rem',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* PESTAÑA SEO (OPCIONAL) */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
                                            Título SEO
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={name ? `${name} | Nombre de tu Tienda` : 'ej. Dispositivos de Vapeo | TuTienda'}
                                            value={seoTitle}
                                            onChange={(e) => setSeoTitle(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 14px',
                                                borderRadius: '10px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--input-bg)',
                                                color: 'var(--foreground)',
                                                fontSize: '0.9rem',
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
                                            Descripción SEO Meta
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="Descripción que aparecerá en resultados de Google..."
                                            value={seoDescription}
                                            onChange={(e) => setSeoDescription(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 14px',
                                                borderRadius: '10px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--input-bg)',
                                                color: 'var(--foreground)',
                                                fontSize: '0.9rem',
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Botones Guardar / Cancelar */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ padding: '9px 18px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    style={{ padding: '9px 22px', background: 'var(--robotina-orange)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    {isPending ? 'Guardando...' : editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE ELIMINACIÓN SEGURA */}
            {deleteModalCat && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9995,
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}>
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1.5px solid var(--glass-border)',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '520px',
                        padding: '26px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '10px' }}>
                            ¿Eliminar la categoría &quot;{deleteModalCat.name}&quot;?
                        </h3>

                        {/* Check product count */}
                        {(categoryCounts[deleteModalCat.id] || 0) > 0 ? (
                            <div>
                                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: '10px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 700, marginBottom: '14px' }}>
                                    ⚠️ Esta categoría contiene {formatProductCount(categoryCounts[deleteModalCat.id])}. Antes de eliminarla debes decidir qué hacer con ellos.
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="del_opt"
                                            checked={deleteOption === 'reassign'}
                                            onChange={() => setDeleteOption('reassign')}
                                        />
                                        <span>Mover productos a otra categoría</span>
                                    </label>

                                    {deleteOption === 'reassign' && (
                                        <select
                                            value={targetReassignId}
                                            onChange={(e) => setTargetReassignId(e.target.value)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--input-bg)',
                                                color: 'var(--foreground)',
                                                fontSize: '0.85rem',
                                                marginLeft: '24px',
                                            }}
                                        >
                                            {categories.filter(c => c.id !== deleteModalCat.id).map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    )}

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="del_opt"
                                            checked={deleteOption === 'orphan'}
                                            onChange={() => setDeleteOption('orphan')}
                                        />
                                        <span>Dejar productos sin categoría (Sin categoría)</span>
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-description)', fontSize: '0.88rem', marginBottom: '20px' }}>
                                Esta acción no se puede deshacer. La categoría será removida permanentemente del catálogo.
                            </p>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setDeleteModalCat(null)}
                                style={{ padding: '9px 16px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--foreground)', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isPending}
                                style={{ padding: '9px 18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                {isPending ? 'Eliminando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
