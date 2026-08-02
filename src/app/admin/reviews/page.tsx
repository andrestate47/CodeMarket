'use client';

import React from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminReviewsPage() {
    return (
        <div>
            <AdminPageHeader
                title="Moderación de Reseñas"
                description="Revisa y aprueba los comentarios de los clientes antes de ser publicados en la tienda."
            />

            <AdminEmptyState
                icon="⭐"
                title="Módulo en preparación"
                description="La moderación de calificaciones y opiniones de compradores estará disponible tras la integración de la API de reseñas."
            />
        </div>
    );
}
