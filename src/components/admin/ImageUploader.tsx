'use client';

import React, { useState } from 'react';
import { StorageService } from '@/lib/services/storageService';

interface ImageUploaderProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
}

export default function ImageUploader({
    value,
    onChange,
    label = 'Imagen del Producto',
}: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const res = await StorageService.uploadProductImage(file);
            if (res.success && res.url) {
                onChange(res.url);
            } else {
                setError(res.error || 'No se pudo subir la imagen.');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al procesar la imagen.';
            setError(msg);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {label && (
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--foreground)' }}>
                    {label}
                </label>
            )}

            {!value ? (
                <label
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '32px 20px',
                        border: '2px dashed var(--glass-border)',
                        borderRadius: '14px',
                        background: 'var(--input-bg)',
                        cursor: uploading ? 'wait' : 'pointer',
                        textAlign: 'center',
                        opacity: uploading ? 0.7 : 1,
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
                        {uploading ? '☁️' : '📸'}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--foreground)', marginBottom: '4px' }}>
                        {uploading ? 'Subiendo a Supabase Storage...' : 'Haz clic para subir imagen'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Optimización WebP automática & Carga directa en nube
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </label>
            ) : (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        background: 'var(--input-bg)',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        border: '1px solid var(--glass-border)',
                    }}
                >
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            border: '1px solid var(--glass-border)',
                            flexShrink: 0,
                        }}
                    >
                        <img src={value} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e' }}>
                            ✓ Imagen guardada en almacenamiento
                        </span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <label
                                style={{
                                    padding: '6px 12px',
                                    background: 'var(--glass-bg)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: 'var(--foreground)',
                                    cursor: uploading ? 'wait' : 'pointer',
                                }}
                            >
                                {uploading ? 'Subiendo...' : '🔄 Cambiar'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    disabled={uploading}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                style={{
                                    padding: '6px 12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                }}
                            >
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <span style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px' }}>
                    {error}
                </span>
            )}
        </div>
    );
}
