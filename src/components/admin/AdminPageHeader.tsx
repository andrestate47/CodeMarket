import React from 'react';
import AdminBreadcrumbs from './AdminBreadcrumbs';

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    showBreadcrumbs?: boolean;
}

export default function AdminPageHeader({ title, description, action, showBreadcrumbs = true }: AdminPageHeaderProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {showBreadcrumbs && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                    <AdminBreadcrumbs inline={false} marginBottom="0" />
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ minWidth: 0 }}>
                    <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                        {title}
                    </h1>
                    {description && (
                        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.84rem' }}>
                            {description}
                        </p>
                    )}
                </div>
                {action && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
}
