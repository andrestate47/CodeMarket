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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {showBreadcrumbs && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AdminBreadcrumbs inline />
                        <span style={{ color: 'var(--text-description)', fontSize: '0.85rem' }}>/</span>
                    </div>
                )}
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.3px', display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
                    {title}
                </h1>
            </div>

            {action && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {action}
                </div>
            )}

            {description && (
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.84rem' }}>
                    {description}
                </p>
            )}
        </div>
    );
}
