import React from 'react';

export type StatusType = 'pending' | 'paid' | 'fulfilled' | 'unfulfilled' | 'cancelled' | 'active' | 'draft';

interface AdminStatusBadgeProps {
    status: StatusType | string;
    label?: string;
}

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', label: 'Pendiente' },
    paid: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', label: 'Pagado' },
    fulfilled: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', label: 'Entregado' },
    unfulfilled: { bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', label: 'No entregado' },
    cancelled: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', label: 'Cancelado' },
    active: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', label: 'Activo' },
    draft: { bg: 'rgba(113, 113, 122, 0.2)', color: '#a1a1aa', label: 'Borrador' },
};

export default function AdminStatusBadge({ status, label }: AdminStatusBadgeProps) {
    const config = statusConfig[status.toLowerCase()] || {
        bg: 'rgba(255, 255, 255, 0.1)',
        color: '#d4d4d8',
        label: status,
    };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: config.bg,
            color: config.color,
            border: `1px solid ${config.color}30`,
            whiteSpace: 'nowrap',
        }}>
            {label || config.label}
        </span>
    );
}
