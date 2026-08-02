'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default function AdminProfilePage() {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('admin');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setEmail(session.user.email || '');
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, role')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    setFullName(profile.full_name || '');
                    setRole(profile.role || 'admin');
                }
            }
            setLoading(false);
        })();
    }, []);

    return (
        <div style={{ maxWidth: '600px' }}>
            <AdminPageHeader
                title="Mi Perfil"
                description="Información de tu cuenta de administrador en CodeMarket."
            />

            {loading ? (
                <div style={{ padding: '32px', color: '#a1a1aa' }}>Cargando perfil...</div>
            ) : (
                <div style={{ background: '#0e0e14', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', color: 'white', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {(fullName || email || 'A').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>{fullName || 'Administrador'}</h3>
                            <span style={{ fontSize: '0.82rem', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rol: {role}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: '#71717a', fontWeight: 600, marginBottom: '6px' }}>Correo Electrónico</label>
                            <input
                                type="text"
                                readOnly
                                value={email}
                                style={{ width: '100%', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '0.9rem' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: '#71717a', fontWeight: 600, marginBottom: '6px' }}>Nombre Completo</label>
                            <input
                                type="text"
                                readOnly
                                value={fullName || 'Administrador Principal'}
                                style={{ width: '100%', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '0.9rem' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
