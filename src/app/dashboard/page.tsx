'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { formatMoney } from '@/lib/money';

import { User } from '@supabase/supabase-js';

interface UserOrder {
  id: string;
  order_number: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndFetchOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Fetch user's orders by customer email or user id
      const { data: userOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', session.user.email)
        .order('created_at', { ascending: false });

      setOrders(userOrders || []);
      setLoading(false);
    };

    checkUserAndFetchOrders();
  }, [router]);

  const handleLogout = async () => {
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando tu cuenta...</div>;
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
          padding: '32px',
        }}>
          <h2 style={{ marginBottom: '24px', fontSize: '1.4rem', fontWeight: 800 }}>Historial de Pedidos</h2>

          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                Aún no has realizado ningún pedido en CodeMarket. ¡Explora nuestros productos!
              </p>
              <button 
                onClick={() => router.push('/')}
                style={{
                  marginTop: '16px',
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Ir al Catálogo
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map((o) => (
                <div key={o.id} style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--robotina-orange)' }}>Pedido {o.order_number}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Fecha: {new Date(o.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{formatMoney(o.total_amount, o.currency)}</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', fontWeight: 700, color: o.payment_status === 'paid' ? '#22c55e' : '#facc15' }}>
                      {o.payment_status === 'paid' ? 'Pagado' : 'Pago Pendiente'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
