'use client';

import React from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    danger = false,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    maxWidth: '420px',
                    width: '100%',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    {title}
                </h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: 'var(--text-description)', lineHeight: 1.5 }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 16px',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'var(--foreground)',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '10px 18px',
                            background: danger ? '#ef4444' : 'var(--gradient-main)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: danger ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 14px rgba(255, 107, 0, 0.35)',
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
