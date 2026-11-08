'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const routeLabels: Record<string, string> = {
    admin: 'Inicio',
    pedidos: 'Pedidos',
    productos: 'Productos',
    nuevo: 'Nuevo',
    categorias: 'Categorías',
    inventario: 'Inventario',
    clientes: 'Clientes',
    apariencia: 'Apariencia',
    configuracion: 'Configuración',
    pagos: 'Métodos de Pago',
    envios: 'Envíos',
    usuarios: 'Usuarios y Permisos',
    perfil: 'Mi Perfil',
    reviews: 'Reseñas',
};

interface AdminBreadcrumbsProps {
    inline?: boolean;
    marginBottom?: string;
}

export default function AdminBreadcrumbs({ inline = false, marginBottom = '16px' }: AdminBreadcrumbsProps) {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length <= 1) {
        return null;
    }

    return (
        <nav
            aria-label="Breadcrumb"
            style={{
                marginBottom: inline ? 0 : marginBottom,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                lineHeight: 1,
            }}
        >
            {segments.map((segment, idx) => {
                const href = '/' + segments.slice(0, idx + 1).join('/');
                const isLast = idx === segments.length - 1;
                const label = routeLabels[segment] || (segment.length > 20 ? `${segment.slice(0, 8)}...` : segment);

                return (
                    <React.Fragment key={href}>
                        {idx > 0 && (
                            <span style={{ color: 'var(--text-description)', display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
                                /
                            </span>
                        )}
                        {isLast ? (
                            <span style={{ color: 'var(--foreground)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
                                {label}
                            </span>
                        ) : (
                            <Link
                                href={href}
                                style={{
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    minHeight: 'auto',
                                    lineHeight: 1,
                                }}
                            >
                                {label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
