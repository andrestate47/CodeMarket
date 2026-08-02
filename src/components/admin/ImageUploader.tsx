'use client';

import React from 'react';

interface ImageUploaderProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    maxSize?: number;
}

export default function ImageUploader({
    value,
    onChange,
    label = 'Imagen del Producto',
    maxSize = 400,
}: ImageUploaderProps) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const compressed = canvas.toDataURL('image/jpeg', 0.75);
                onChange(compressed);
            };
            if (typeof event.target?.result === 'string') {
                img.src = event.target.result;
            }
        };
        reader.readAsDataURL(file);
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
                        cursor: 'pointer',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--foreground)', marginBottom: '4px' }}>
                        Haz clic para subir imagen
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        PNG, JPG o WEBP (Formato optimizado automáticamente)
                    </span>
                    <input
                        type="file"
                        accept="image/*"
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
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)' }}>Imagen cargada</span>
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
                                    cursor: 'pointer',
                                }}
                            >
                                🔄 Cambiar
                                <input
                                    type="file"
                                    accept="image/*"
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
        </div>
    );
}
