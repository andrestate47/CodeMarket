'use client';

import React from 'react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminEditProductPage() {
    return (
        <div>
            <AdminPageHeader
                title="Editar Producto"
                description="Gestión de detalles, precio y stock de producto individual."
                action={
                    <Link
                        href="/admin/productos"
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
                        ← Volver a Productos
                    </Link>
                }
            />

            <AdminEmptyState
                icon="🚧"
                title="Módulo en preparación"
                description="La edición avanzada de variantes de productos e imágenes múltiples estará disponible en la siguiente actualización."
                action={
                    <Link
                        href="/admin/productos"
                        style={{
                            padding: '10px 16px',
                            background: '#a855f7',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: 700,
                        }}
                    >
                        Ver Catálogo de Productos
                    </Link>
                }
            />
        </div>
    );
}
