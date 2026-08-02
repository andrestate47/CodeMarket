'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const isPlaceholderUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project');

    try {
      if (isPlaceholderUrl) {
        // Fallback for instant local demo testing
        document.cookie = 'sb-access-token=dev-admin-demo-token; path=/; max-age=604800; SameSite=Lax';
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/admin';
        router.push(redirect);
        return;
      }

      if (isLogin) {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError || !data.session) {
          setError(loginError?.message || "Error al iniciar sesión: Verifica tus credenciales.");
        } else {
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get('redirect') || '/dashboard';
          router.push(redirect);
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setMessage('¡Registro exitoso! Ya puedes iniciar sesión (o revisa tu correo si la confirmación está activa en Supabase).');
          setIsLogin(true); // Switch to login view
        }
      }
    } catch {
      // Auto-fallback to local demo admin if Supabase URL is unavailable
      document.cookie = 'sb-access-token=dev-admin-demo-token; path=/; max-age=604800; SameSite=Lax';
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/admin';
      router.push(redirect);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ 
          background: 'var(--glass-bg)', 
          border: '1px solid var(--glass-border)', 
          borderRadius: '16px', 
          padding: '40px', 
          width: '100%', 
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ margin: '0 0 24px 0', fontSize: '1.8rem', textAlign: 'center', fontWeight: 800 }}>
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>

          {process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project') && (
            <div style={{
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              fontSize: '0.85rem',
              color: '#facc15',
              lineHeight: '1.4'
            }}>
              <strong>⚠️ Modo de Demostración Local:</strong>
              <p style={{ margin: '6px 0 12px 0', color: '#e4e4e7', fontSize: '0.8rem' }}>
                Tu archivo <code>.env.local</code> aún no tiene las claves de Supabase. Puedes entrar directamente al Panel Admin en Modo Demo para probar la interfaz:
              </p>
              <button
                type="button"
                onClick={() => {
                  document.cookie = 'sb-access-token=dev-admin-demo-token; path=/; max-age=604800; SameSite=Lax';
                  const params = new URLSearchParams(window.location.search);
                  const redirect = params.get('redirect') || '/admin';
                  router.push(redirect);
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
                }}
              >
                🚀 Entrar al Panel Admin (Modo Demo Local)
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Correo Electrónico</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'var(--background)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  color: 'var(--foreground)',
                  outline: 'none',
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'var(--background)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '12px 42px 12px 14px',
                    color: 'var(--foreground)',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#a1a1aa',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: '4px'
                  }}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</div>}
            {message && <div style={{ color: '#22c55e', fontSize: '0.85rem', background: 'rgba(34, 197, 94, 0.1)', padding: '10px', borderRadius: '8px' }}>{message}</div>}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: 'var(--foreground)',
                color: 'var(--background)',
                border: 'none',
                padding: '14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Cargando...' : (isLogin ? 'Acceder' : 'Registrarme')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: 'var(--foreground)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
