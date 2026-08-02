'use client';

import React, { useEffect, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminDataTable from '@/components/admin/AdminDataTable';
import { getInstantProducts } from '@/modules/catalog/queries';
import { supabase } from '@/lib/supabase';

export interface CategoryItem {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    count?: number;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
    { id: 'cat-1', name: 'Servicios', slug: 'servicios', icon: '💼', description: 'Desarrollo web, consultoría y automatización' },
    { id: 'cat-2', name: 'Físicos', slug: 'fisicos', icon: '📦', description: 'Productos físicos, comidas y envíos' },
    { id: 'cat-3', name: 'Digital', slug: 'digital', icon: '💻', description: 'Software, plantillas y archivos descargables' },
    { id: 'cat-4', name: 'Comidas & Bebidas', slug: 'comidas-bebidas', icon: '🍔', description: 'Alimentos, snacks y refrescos' },
];

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<CategoryItem[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('admin_categories');
                if (saved) return JSON.parse(saved);
            } catch {
                return DEFAULT_CATEGORIES;
            }
        }
        return DEFAULT_CATEGORIES;
    });
    const [isCreating, setIsCreating] = useState(false);

    // Calculate product counts per category dynamically
    const products = getInstantProducts();
    const categoriesWithCount = categories.map(cat => {
        const matchingCount = products.filter(p => p.category?.toLowerCase() === cat.name.toLowerCase()).length;
        return { ...cat, count: matchingCount };
    });

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        if (editingCategory) {
            const updated = categories.map(c => c.id === editingCategory.id ? { ...c, name, icon, description, slug } : c);
            setCategories(updated);
            localStorage.setItem('admin_categories', JSON.stringify(updated));
            try {
                await supabase.from('categories').update({ name, slug, description }).eq('id', editingCategory.id);
            } catch { }
        } else {
            const newCat: CategoryItem = {
                id: `cat-${slug}`,
                name,
                slug,
                icon: icon || '🏷️',
                description,
            };
            const updated = [newCat, ...categories];
            setCategories(updated);
            localStorage.setItem('admin_categories', JSON.stringify(updated));
            try {
                await supabase.from('categories').insert({ name, slug, description });
            } catch { }
        }

        resetForm();
    };

    const handleDelete = async (catId: string) => {
        if (!confirm('¿Deseas eliminar esta categoría?')) return;
        const updated = categories.filter(c => c.id !== catId);
        setCategories(updated);
        localStorage.setItem('admin_categories', JSON.stringify(updated));
        try {
            await supabase.from('categories').delete().eq('id', catId);
        } catch { }
    };

    const startEdit = (cat: CategoryItem) => {
        setEditingCategory(cat);
        setName(cat.name);
        setIcon(cat.icon || '🏷️');
        setDescription(cat.description || '');
        setIsCreating(true);
    };

    const resetForm = () => {
        setName('');
        setIcon('🏷️');
        setDescription('');
        setEditingCategory(null);
        setIsCreating(false);
    };

    const columns = [
        {
            header: 'Categoría',
            cell: (cat: CategoryItem) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        flexShrink: 0,
                    }}>
                        {cat.icon || '🏷️'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--foreground)' }}>{cat.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>/{cat.slug}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Descripción',
            cell: (cat: CategoryItem) => (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-description)' }}>
                    {cat.description || 'Sin descripción'}
                </span>
            ),
        },
        {
            header: 'Productos',
            cell: (cat: CategoryItem) => (
                <span style={{
                    fontWeight: 700,
                    color: 'var(--foreground)',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.82rem',
                }}>
                    📦 {cat.count || 0} productos
                </span>
            ),
        },
        {
            header: 'Acciones',
            cell: (cat: CategoryItem) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => startEdit(cat)}
                        style={{
                            padding: '6px 12px',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'var(--foreground)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        ✏️ Editar
                    </button>
                    <button
                        onClick={() => handleDelete(cat.id)}
                        style={{
                            padding: '6px 10px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        🗑️
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <AdminPageHeader
                title="Categorías de Productos"
                description="Organiza tus productos en categorías para que tus clientes filtren fácilmente en la tienda."
                action={
                    <button
                        onClick={() => { resetForm(); setIsCreating(!isCreating); }}
                        style={{
                            padding: '10px 18px',
                            background: 'var(--gradient-main)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(255, 107, 0, 0.35)',
                        }}
                    >
                        <span>{isCreating ? '✖️' : '➕'}</span> {isCreating ? 'Cerrar Formulario' : 'Nueva Categoría'}
                    </button>
                }
            />

            {/* Creation / Edit Form Modal Box */}
            {isCreating && (
                <form
                    onSubmit={handleSaveCategory}
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}
                >
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)' }}>
                        {editingCategory ? '✏️ Editar Categoría' : '➕ Crear Nueva Categoría'}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--foreground)' }}>Icono</label>
                            <input
                                type="text"
                                value={icon}
                                onChange={e => setIcon(e.target.value)}
                                style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px', textAlign: 'center', fontSize: '1.2rem', color: 'var(--input-text)', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--foreground)' }}>Nombre de la Categoría *</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ej. Comidas, Bebidas, Servicios"
                                style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--input-text)', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--foreground)' }}>Descripción</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Breve explicación de los productos agrupados"
                            style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--input-text)', outline: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button
                            type="submit"
                            style={{
                                padding: '10px 20px',
                                background: 'var(--robotina-orange)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            style={{
                                padding: '10px 16px',
                                background: 'var(--glass-bg)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--foreground)',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            <AdminDataTable
                columns={columns}
                data={categoriesWithCount}
                keyExtractor={c => c.id}
            />
        </div>
    );
}
