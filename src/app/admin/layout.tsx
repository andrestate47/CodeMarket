'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import AdminMobileDrawer from '@/components/admin/AdminMobileDrawer';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';

import { checkAdminAccessAction } from '@/modules/products/actions';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [adminName, setAdminName] = useState('Administrador');
    const [adminEmail, setAdminEmail] = useState('admin@codemarket.com');
    const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const isPlaceholderUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project');
                if (isPlaceholderUrl) {
                    // Modo demo local sin Supabase configurado
                    if (isMounted) setAuthorized(true);
                    return;
                }

                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    if (isMounted) router.replace('/login?redirect=/admin');
                    return;
                }

                // Verificación en el servidor: solo correos en ADMIN_EMAILS
                const access = await checkAdminAccessAction(session.access_token);
                if (!access.isAdmin) {
                    if (isMounted) router.replace('/dashboard?error=no-admin');
                    return;
                }

                const { count: pendingCount } = await supabase
                    .from('orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('payment_status', 'pending');

                if (isMounted) {
                    setAdminEmail(access.email || session.user.email || '');
                    setAdminName(access.name || 'Administrador');
                    setPendingOrdersCount(pendingCount || 0);
                    setAuthorized(true);
                }
            } catch {
                if (isMounted) {
                    router.replace('/login');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        })();

        return () => { isMounted = false; };
    }, [router]);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/login');
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--background)',
                color: 'var(--foreground)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(255, 107, 0, 0.2)',
                        borderTopColor: 'var(--robotina-orange)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px auto',
                    }} />
                    <p style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Verificando permisos de administrador...</p>
                </div>
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!authorized) {
        return null;
    }

    return (
        <div style={{ minHeight: '100vh', width: '100%', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', transition: 'var(--transition)' }}>
            {/* Desktop Fixed Sidebar */}
            <AdminSidebar
                onLogout={handleLogout}
                pendingOrdersCount={pendingOrdersCount}
            />

            {/* Mobile Drawer */}
            <AdminMobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
                <AdminSidebar
                    onLogout={handleLogout}
                    pendingOrdersCount={pendingOrdersCount}
                    onNavItemClick={() => setMobileMenuOpen(false)}
                    isMobileDrawer
                />
            </AdminMobileDrawer>

            {/* Main Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>
                <AdminTopbar
                    adminName={adminName}
                    adminEmail={adminEmail}
                    onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
                    onLogout={handleLogout}
                />

                <main className="admin-main-wrapper">
                    {children}
                </main>
            </div>
            <style jsx>{`
                .admin-main-wrapper {
                    flex: 1;
                    padding: 24px 32px 48px 32px;
                    width: 100%;
                    max-width: 100vw;
                    box-sizing: border-box;
                }
                @media (max-width: 768px) {
                    .admin-main-wrapper {
                        padding: 16px 14px 32px 14px !important;
                    }
                }
            `}</style>
        </div>
    );
}
