'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default function AdminProfilePage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('admin');
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
                setEmail(session.user.email || '');

                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, phone, role')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (profile) {
                        setFullName(profile.full_name || '');
                        setPhone(profile.phone || '');
                        setRole(profile.role || 'admin');
                    } else {
                        // Read from metadata
                        const meta = session.user.user_metadata || {};
                        setFullName(meta.full_name || 'Administrador');
                        setPhone(meta.phone || '');
                    }
                } catch {
                    // Fallback to metadata
                    const meta = session.user.user_metadata || {};
                    setFullName(meta.full_name || 'Administrador');
                }
            }
            setLoading(false);
        })();
    }, []);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);

        try {
            if (userId) {
                // Update Supabase profiles table
                await supabase.from('profiles').upsert({
                    id: userId,
                    full_name: fullName,
                    phone: phone,
                    role: role,
                    updated_at: new Date().toISOString(),
                });

                // Update auth metadata
                await supabase.auth.updateUser({
                    data: { full_name: fullName, phone: phone }
                });
            }

            setMsg({ type: 'success', text: '¡Perfil actualizado correctamente!' });
        } catch (err: unknown) {
            const errorText = err instanceof Error ? err.message : 'Error al guardar cambios';
            setMsg({ type: 'error', text: errorText });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) return;
        setMsg(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login`,
            });
            if (error) throw error;
            setMsg({ type: 'success', text: 'Se ha enviado un correo para restablecer tu contraseña.' });
        } catch (err: unknown) {
            const text = err instanceof Error ? err.message : 'Error al enviar correo';
            setMsg({ type: 'error', text });
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        document.cookie = 'dev-admin-demo-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/login');
    };

    return (
        <div style={{ maxWidth: '650px' }}>
            <AdminPageHeader
                title="Mi Perfil"
                description="Información personal y credenciales de acceso como administrador."
            />

            {loading ? (
                <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Cargando datos del perfil...</div>
            ) : (
                <form onSubmit={handleSaveProfile} style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gradient-main)', color: 'white', fontWeight: 800, fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(255,107,0,0.3)' }}>
                            {(fullName || email || 'A').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--foreground)', fontSize: '1.2rem', fontWeight: 800 }}>{fullName || 'Administrador'}</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--robotina-orange)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rol: {role}</span>
                        </div>
                    </div>

                    {msg && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            background: msg.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: msg.type === 'success' ? '#22c55e' : '#ef4444',
                            border: `1px solid ${msg.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        }}>
                            {msg.text}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--foreground)', fontWeight: 700, marginBottom: '6px' }}>Correo Electrónico</label>
                            <input
                                type="email"
                                readOnly
                                value={email}
                                style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.9rem', outline: 'none' }}
                            />
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>El correo electrónico principal de acceso no se puede modificar directamente.</span>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--foreground)', fontWeight: 700, marginBottom: '6px' }}>Nombre Completo *</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px 16px', color: 'var(--input-text)', fontSize: '0.9rem', outline: 'none' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--foreground)', fontWeight: 700, marginBottom: '6px' }}>Teléfono de Contacto</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="+51 987654321"
                                style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px 16px', color: 'var(--input-text)', fontSize: '0.9rem', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--foreground)' }}>Seguridad y Cuenta</h4>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={handlePasswordReset}
                                style={{
                                    padding: '10px 16px',
                                    background: 'var(--glass-bg)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    color: 'var(--foreground)',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                }}
                            >
                                🔑 Restablecer Contraseña por Email
                            </button>

                            <button
                                type="button"
                                onClick={handleLogout}
                                style={{
                                    padding: '10px 16px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    color: '#ef4444',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                }}
                            >
                                🚪 Cerrar Sesión
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: 'var(--gradient-main)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 14px rgba(255, 107, 0, 0.35)',
                            }}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios del Perfil'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
