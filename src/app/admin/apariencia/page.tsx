'use client';

import React from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminAppearancePage() {
    return (
        <div>
            <AdminPageHeader
                title="Apariencia de la Tienda"
                description="Personalización del logo, colores, banners y disposición del ecommerce."
            />

            <AdminEmptyState
                icon="🎨"
                title="Módulo en preparación"
                description="El editor de temas visuales para modificar colores y banners de la portada se implementará en la Fase 2."
            />
        </div>
    );
}
