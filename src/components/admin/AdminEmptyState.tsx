import React from 'react';

interface AdminEmptyStateProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}

export default function AdminEmptyState({ title, description, icon = '📭', action }: AdminEmptyStateProps) {
    return (
        <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            margin: '16px 0',
        }}>
            <div style={{ fontSize: '2.5rem' }}>{icon}</div>
            <div style={{ maxWidth: '400px' }}>
                <h3 style={{ margin: '0 0 6px 0', color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>{title}</h3>
                <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.88rem', lineHeight: '1.5' }}>{description}</p>
            </div>
            {action && <div style={{ marginTop: '8px' }}>{action}</div>}
        </div>
    );
}
