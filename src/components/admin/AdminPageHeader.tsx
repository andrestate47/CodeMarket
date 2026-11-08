import React from 'react';
import AdminBreadcrumbs from './AdminBreadcrumbs';

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    leftAction?: React.ReactNode;
    action?: React.ReactNode;
    showBreadcrumbs?: boolean;
}

export default function AdminPageHeader({ title, description, leftAction, action, showBreadcrumbs = true }: AdminPageHeaderProps) {
    const isGreeting = title?.trim().startsWith('¡Hola');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {showBreadcrumbs && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                    <AdminBreadcrumbs inline={false} marginBottom="0" />
                </div>
            )}
            {(isGreeting || description || leftAction || action) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        {(isGreeting || description) && (
                            <div>
                                {isGreeting && (
                                    <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                                        {title}
                                    </h1>
                                )}
                                {description && (
                                    <p style={{ color: 'var(--text-muted)', margin: isGreeting ? '4px 0 0 0' : 0, fontSize: '0.84rem' }}>
                                        {description}
                                    </p>
                                )}
                            </div>
                        )}
                        {leftAction}
                    </div>
                    {action && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
                            {action}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
