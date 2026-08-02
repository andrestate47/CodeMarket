import React from 'react';

export type StatusType = 'pending' | 'paid' | 'fulfilled' | 'unfulfilled' | 'cancelled' | 'active' | 'draft';

interface AdminStatusBadgeProps {
    status: StatusType | string;
    label?: string;
}

const statusConfig: Record<string, { bg: string; color: string; border: string; label: string }> = {
    pending: { bg: 'rgba(234, 179, 8, 0.12)', color: '#d97706', border: 'rgba(217, 119, 6, 0.3)', label: 'Pendiente' },
    paid: { bg: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', border: 'rgba(22, 163, 74, 0.3)', label: 'Pagado' },
    fulfilled: { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', border: 'rgba(37, 99, 235, 0.3)', label: 'Entregado' },
    unfulfilled: { bg: 'rgba(249, 115, 22, 0.12)', color: '#ea580c', border: 'rgba(234, 88, 12, 0.3)', label: 'No entregado' },
    cancelled: { bg: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', border: 'rgba(220, 38, 38, 0.3)', label: 'Cancelado' },
    active: { bg: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', border: 'rgba(22, 163, 74, 0.3)', label: 'Activo' },
    draft: { bg: 'rgba(100, 116, 139, 0.15)', color: '#475569', border: 'rgba(71, 85, 105, 0.3)', label: 'Borrador' },
};

export default function AdminStatusBadge({ status, label }: AdminStatusBadgeProps) {
    const config = statusConfig[status ? status.toLowerCase() : 'active'] || {
        bg: 'rgba(34, 197, 94, 0.12)',
        color: '#16a34a',
        border: 'rgba(22, 163, 74, 0.3)',
        label: status || 'Activo',
    };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            background: config.bg,
            color: config.color,
            border: `1px solid ${config.border}`,
            whiteSpace: 'nowrap',
        }}>
            {label || config.label}
        </span>
    );
}
