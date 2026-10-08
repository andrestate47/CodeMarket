'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import TiendaVirLogo from '@/components/brand/TiendaVirLogo';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const getSanitizedRedirect = (defaultPath: string) => {
    if (typeof window === 'undefined') return defaultPath;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('redirect');
    if (!raw) return defaultPath;
    const cleaned = raw.replace(/[\}%7D]/g, '').trim();
    return cleaned.startsWith('/') ? cleaned : defaultPath;
  };

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
        router.push(getSanitizedRedirect('/admin'));
        return;
      }

      if (isLogin) {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          if (loginError.message.includes('Email not confirmed')) {
            setError('Tu cuenta fue creada, pero debes confirmar tu correo. Revisa tu bandeja de entrada y haz clic en el enlace de confirmación.');
          } else if (loginError.message === 'Invalid login credentials') {
            setError('Credenciales incorrectas o el usuario no existe.');
          } else {
            setError(`Error de acceso: ${loginError.message}`);
          }
          setLoading(false);
          return;
        }

        if (data?.session) {
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          window.location.href = getSanitizedRedirect('/admin');
        } else {
          setError('No se pudo establecer la sesión.');
        }

      } else {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden.');
          setLoading(false);
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setMessage('¡Registro exitoso! Ya puedes iniciar sesión (o revisa tu correo si la confirmación está activa).');
          setIsLogin(true); // Switch to login view
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Ocurrió un error inesperado al intentar conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .login-layout {
          display: flex;
          width: 100%;
          min-height: 100vh;
        }
        .login-promo {
          display: none;
          flex: 1.2;
          background: linear-gradient(135deg, #FF6B00 0%, #FF8A00 100%);
          color: white;
          padding: 60px;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 900px) {
          .login-promo {
            display: flex;
          }
        }
        .login-promo::after {
          content: '';
          position: absolute;
          width: 1200px;
          height: 1200px;
          background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%);
          top: -300px;
          left: -300px;
          border-radius: 50%;
          pointer-events: none;
        }
        .login-form-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          background: var(--background);
        }
      `}} />

      <div className="login-layout">
        
        {/* Lado Publicitario TiendaVir */}
        <div className="login-promo">
          <div style={{ position: 'relative', zIndex: 1, cursor: 'pointer', display: 'inline-block', filter: 'brightness(0) invert(1)' }} onClick={() => router.push('/')}>
            <TiendaVirLogo size="large" showTagline={false} />
          </div>
          
          <div style={{ position: 'relative', zIndex: 1, marginBottom: '40px' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              padding: '8px 16px',
              borderRadius: '30px',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginBottom: '24px'
            }}>
              🚀 Tu negocio en internet
            </div>
            <h2 style={{ fontSize: '3.8rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.03em' }}>
              Crea y escala tu tienda online.
            </h2>
            <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '500px', lineHeight: 1.6, marginBottom: '40px' }}>
              La plataforma de comercio electrónico diseñada para emprendedores. Gestiona tu catálogo, recibe pedidos y lleva tu negocio al siguiente nivel de manera simple y profesional.
            </p>
            
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '50%' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>Gestión Simple</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '50%' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>Vende 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado del Formulario */}
        <div className="login-form-container">
          {/* Botón para volver al inicio en móvil */}
          <button 
            onClick={() => router.push('/')}
            style={{
              position: 'absolute',
              top: '24px',
              left: '24px',
              background: 'var(--glass-bg, rgba(255,255,255,0.05))',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
              color: 'var(--foreground)',
              padding: '10px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              zIndex: 10
            }}
            className="mobile-back-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Volver
          </button>
          
          <style dangerouslySetInnerHTML={{__html: `
            @media (min-width: 900px) {
              .mobile-back-btn {
                display: none !important;
              }
            }
          `}} />

          {/* Background decorative elements */}
          <div style={{
            position: 'absolute',
            top: '-10%',
            left: '-5%',
            width: '50vw',
            height: '50vw',
            background: 'radial-gradient(circle, rgba(255,107,0,0.05) 0%, rgba(255,107,0,0) 70%)',
            borderRadius: '50%',
            zIndex: 0,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-5%',
            width: '40vw',
            height: '40vw',
            background: 'radial-gradient(circle, rgba(255,138,0,0.08) 0%, rgba(255,138,0,0) 70%)',
            borderRadius: '50%',
            zIndex: 0,
            pointerEvents: 'none',
          }} />

          <div style={{ 
            background: 'var(--glass-bg, rgba(255,255,255,0.03))', 
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', 
            borderRadius: '24px', 
            padding: '48px', 
            width: '100%', 
            maxWidth: '440px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.12)',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <h1 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '2rem', 
                fontWeight: 800,
                background: 'linear-gradient(135deg, var(--foreground) 0%, rgba(150,150,150,1) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}>
                {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
              </h1>
              <p style={{ margin: 0, color: 'var(--text-muted, #888)', fontSize: '0.95rem' }}>
                {isLogin ? 'Ingresa tus credenciales para acceder a tu panel' : 'Únete a Tienda Vir hoy mismo'}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.3s ease' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>Nombre Completo</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Tu nombre"
                      required={!isLogin}
                      style={{
                        width: '100%',
                        background: 'var(--background)',
                        border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                        borderRadius: '12px',
                        padding: '14px 14px 14px 42px',
                        color: 'var(--foreground)',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#FF6B00';
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,107,0,0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--glass-border, rgba(255,255,255,0.1))';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>Correo Electrónico</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    required
                    style={{
                      width: '100%',
                      background: 'var(--background)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                      borderRadius: '12px',
                      padding: '14px 14px 14px 42px',
                      color: 'var(--foreground)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#FF6B00';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,107,0,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--glass-border, rgba(255,255,255,0.1))';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>Contraseña</label>
                  {isLogin && (
                    <button type="button" style={{ background: 'none', border: 'none', color: '#FF6B00', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      background: 'var(--background)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                      borderRadius: '12px',
                      padding: '14px 42px 14px 42px',
                      color: 'var(--foreground)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#FF6B00';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,107,0,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--glass-border, rgba(255,255,255,0.1))';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#888',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '50%',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.3s ease' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>Confirmar Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required={!isLogin}
                      style={{
                        width: '100%',
                        background: 'var(--background)',
                        border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                        borderRadius: '12px',
                        padding: '14px 42px 14px 42px',
                        color: 'var(--foreground)',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#FF6B00';
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,107,0,0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--glass-border, rgba(255,255,255,0.1))';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#888',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '50%',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                      aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirmPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div style={{ 
                  color: '#ef4444', 
                  fontSize: '0.85rem', 
                  background: 'rgba(239, 68, 68, 0.08)', 
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '12px 14px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>{error}</span>
                </div>
              )}
              
              {message && (
                <div style={{ 
                  color: '#10b981', 
                  fontSize: '0.85rem', 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  padding: '12px 14px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  <span>{message}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #FF6B00 0%, #FF8A00 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '8px',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 8px 20px rgba(255, 107, 0, 0.25)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 107, 0, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 107, 0, 0.25)';
                  }
                }}
              >
                {loading ? (
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line></svg>
                ) : (
                  isLogin ? 'Iniciar Sesión' : 'Registrarme'
                )}
              </button>
            </form>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px',
              marginTop: '8px'
            }}>
              <div style={{ height: '1px', flex: 1, background: 'var(--glass-border, rgba(255,255,255,0.1))' }} />
              <span style={{ fontSize: '0.85rem', color: '#888' }}>o</span>
              <div style={{ height: '1px', flex: 1, background: 'var(--glass-border, rgba(255,255,255,0.1))' }} />
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted, #888)' }}>
              {isLogin ? '¿No tienes una cuenta? ' : '¿Ya tienes una cuenta? '}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#FF6B00', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  padding: '4px',
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
