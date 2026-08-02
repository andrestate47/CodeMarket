'use client';

import React from 'react';

interface FormFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    description?: string;
    children: React.ReactNode;
}

export default function FormField({
    label,
    required = false,
    error,
    description,
    children,
}: FormFieldProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--foreground)' }}>
                {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>

            {children}

            {description && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {description}
                </span>
            )}

            {error && (
                <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>
                    {error}
                </span>
            )}
        </div>
    );
}
