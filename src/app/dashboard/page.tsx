'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;
  }

  if (!user) return null;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="container" style={{ padding: '60px 24px', flex: 1 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px 0' }}>Mi Cuenta</h1>
            <p style={{ color: 'var(--text-muted)' }}>Bienvenido, {user.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid var(--glass-border)',
              color: 'var(--foreground)',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Cerrar Sesión
          </button>
        </div>

        <div style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: 700 }}>Tus Productos Digitales</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Aún no has realizado ninguna compra profunda. ¡Explora nuestra tienda!
          </p>
          <button 
            onClick={() => router.push('/')}
            style={{
              marginTop: '24px',
              background: 'var(--foreground)',
              color: 'var(--background)',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Ir a la Tienda
          </button>
        </div>
      </div>
    </main>
  );
}
