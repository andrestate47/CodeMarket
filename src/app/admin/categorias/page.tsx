'use client';

import React from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminCategoriesPage() {
    return (
        <div>
            <AdminPageHeader
                title="Categorías de Productos"
                description="Organiza tus productos en categorías y etiquetas de navegación."
            />

            <AdminEmptyState
                icon="🏷️"
                title="Módulo en preparación"
                description="La gestión personalizada de árboles de categorías y filtros dinámicos se encuentra en desarrollo."
            />
        </div>
    );
}
