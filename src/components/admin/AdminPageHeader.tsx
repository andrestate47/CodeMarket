import React from 'react';

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export default function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
                    {title}
                </h1>
                {description && (
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.92rem' }}>
                        {description}
                    </p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
