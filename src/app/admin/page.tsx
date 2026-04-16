'use client';

import React, { useEffect, useState } from 'react';
import { products } from '@/data/products';
import { useRouter } from 'next/navigation';

const ADMIN_PASSWORD = 'codemarket2026';

interface Review {
    id: string;
    name: string;
    rating: number;
    comment: string;
    date: string;
}

interface PendingReview extends Review {
    productId: string;
    productTitle: string;
}

interface Order {
    id: string;
    customer: string;
    email: string;
    total: string;
    items: { title: string; price: string }[];
    date: string;
    status: string;
    method: string;
}

interface Notification {
    id: number;
    type: 'order' | 'review';
    message: string;
    date: string;
    read: boolean;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [authed, setAuthed] = useState(false);
    const [pass, setPass] = useState('');
    const [wrongPass, setWrongPass] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'reviews' | 'notifications'>('overview');
    
    // Data states
    const [orders, setOrders] = useState<Order[]>([]);
    const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stats, setStats] = useState({ sales: 0, totalOrders: 0, pendingReviews: 0 });

    const loadData = () => {
        const storedOrders = JSON.parse(localStorage.getItem('admin_orders') || '[]');
        const storedNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
        
        const allPending: PendingReview[] = [];
        products.forEach((p) => {
            const pend = JSON.parse(localStorage.getItem(`reviews_pending_${p.id}`) || '[]');
            pend.forEach((r: Review) => allPending.push({ ...r, productId: p.id, productTitle: p.title }));
        });

        setOrders(storedOrders);
        setNotifications(storedNotifications);
        setPendingReviews(allPending);

        const totalSales = storedOrders.reduce((acc: number, curr: Order) => acc + parseFloat(curr.total), 0);
        setStats({
            sales: totalSales,
            totalOrders: storedOrders.length,
            pendingReviews: allPending.length
        });
    };

    useEffect(() => {
        if (authed) {
            loadData();
            // Refresh notifications if tab changes to read them
            if (activeTab === 'notifications') {
                const updated = notifications.map(n => ({ ...n, read: true }));
                localStorage.setItem('admin_notifications', JSON.stringify(updated));
                setNotifications(updated);
            }
        }
    }, [authed, activeTab]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pass === ADMIN_PASSWORD) {
            setAuthed(true);
            setWrongPass(false);
        } else {
            setWrongPass(true);
        }
    };

    const approveReview = (review: PendingReview) => {
        const pend = JSON.parse(localStorage.getItem(`reviews_pending_${review.productId}`) || '[]');
        localStorage.setItem(`reviews_pending_${review.productId}`, JSON.stringify(pend.filter((r: Review) => r.id !== review.id)));
        const appr = JSON.parse(localStorage.getItem(`reviews_${review.productId}`) || '[]');
        localStorage.setItem(`reviews_${review.productId}`, JSON.stringify([review, ...appr]));
        loadData();
    };

    const rejectReview = (review: PendingReview) => {
        const pend = JSON.parse(localStorage.getItem(`reviews_pending_${review.productId}`) || '[]');
        localStorage.setItem(`reviews_pending_${review.productId}`, JSON.stringify(pend.filter((r: Review) => r.id !== review.id)));
        loadData();
    };

    if (!authed) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', fontFamily: 'Inter, sans-serif' }}>
                 <div style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden', zIndex: 0 }}>
                    <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}></div>
                    <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}></div>
                </div>
                <form onSubmit={handleLogin} style={{ position: 'relative', zIndex: 1, background: 'rgba(19, 19, 26, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '48px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', borderRadius: '16px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🛡️</div>
                        <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 900, margin: 0 }}>Command Center</h1>
                        <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '8px' }}>Ingresa para gestionar tu tienda</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                            type="password"
                            placeholder="Contraseña Maestra"
                            value={pass}
                            onChange={e => setPass(e.target.value)}
                            style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${wrongPass ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', padding: '14px 18px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'all 0.2s' }}
                        />
                        {wrongPass && <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 500 }}>Acceso denegado. Inténtalo de nuevo.</span>}
                    </div>
                    <button type="submit" style={{ background: 'white', color: 'black', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                        Iniciar Sesión
                    </button>
                </form>
            </main>
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <main style={{ minHeight: '100vh', background: '#050507', color: 'white', fontFamily: 'Inter, sans-serif', display: 'flex' }}>
            {/* Sidebar */}
            <aside style={{ width: '280px', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '32px', background: '#0a0a0f' }}>
                <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🚀</div>
                    <span style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>CODEMARKET</span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                        { id: 'overview', label: 'Panorama', icon: '📊' },
                        { id: 'orders', label: 'Ventas y Pedidos', icon: '💰' },
                        { id: 'reviews', label: 'Moderación', icon: '⭐', badge: pendingReviews.length },
                        { id: 'notifications', label: 'Notificaciones', icon: '🔔', badge: unreadCount }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                padding: '12px 16px', 
                                borderRadius: '12px', 
                                border: 'none',
                                background: activeTab === item.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                                color: activeTab === item.id ? 'white' : '#888',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: activeTab === item.id ? 700 : 500,
                                textAlign: 'left',
                                position: 'relative'
                            }}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                            {item.badge && item.badge > 0 && (
                                <span style={{ position: 'absolute', right: '16px', background: item.id === 'reviews' ? '#facc15' : '#ec4899', color: 'black', borderRadius: '20px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 800 }}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', padding: '16px' }}>
                    <button onClick={() => setAuthed(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#888', width: '100%', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>Salir del panel</button>
                </div>
            </aside>

            {/* Content */}
            <section style={{ flex: 1, padding: '48px', overflowY: 'auto' }}>
                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>
                            {activeTab === 'overview' && 'Panorama General'}
                            {activeTab === 'orders' && 'Historial de Ventas'}
                            {activeTab === 'reviews' && 'Moderación de Reseñas'}
                            {activeTab === 'notifications' && 'Notificaciones'}
                        </h1>
                        <p style={{ color: '#666', marginTop: '4px' }}>Gestión centralizada de CodeMarket</p>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                        <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', padding: '32px', borderRadius: '24px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Ingresos Totales</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>${stats.sales.toFixed(2)}</div>
                        </div>
                        <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', padding: '32px', borderRadius: '24px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Ventas Realizadas</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{stats.totalOrders}</div>
                        </div>
                        <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', padding: '32px', borderRadius: '24px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Pendientes Moderación</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#facc15' }}>{stats.pendingReviews}</div>
                        </div>
                        
                        {/* Summary Chart-like list */}
                        <div style={{ gridColumn: 'span 2', background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', padding: '32px', borderRadius: '24px' }}>
                            <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem', fontWeight: 800 }}>Últimos Pedidos</h3>
                            {orders.length === 0 ? <p style={{ color: '#444' }}>No hay ventas registradas aún.</p> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {orders.slice(0, 5).map(order => (
                                        <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{order.customer}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{order.date}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 900 }}>${order.total}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>{order.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', padding: '32px', borderRadius: '24px' }}>
                            <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem', fontWeight: 800 }}>Alertas</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {notifications.slice(0, 5).map(n => (
                                    <div key={n.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', borderLeft: `3px solid ${n.type === 'order' ? '#ec4899' : '#facc15'}` }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{n.message}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '4px' }}>{n.date}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#666', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '20px 24px' }}>ID & Fecha</th>
                                    <th style={{ padding: '20px 24px' }}>Cliente</th>
                                    <th style={{ padding: '20px 24px' }}>Productos</th>
                                    <th style={{ padding: '20px 24px' }}>Método</th>
                                    <th style={{ padding: '20px 24px', textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontWeight: 700 }}>{order.id}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{order.date}</div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontWeight: 600 }}>{order.customer}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{order.email}</div>
                                        </td>
                                        <td style={{ padding: '20px 24px', fontSize: '0.85rem' }}>
                                            {order.items.map(i => i.title).join(', ')}
                                        </td>
                                        <td style={{ padding: '20px 24px', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 700, color: '#a855f7' }}>
                                            {order.method}
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: 900, fontSize: '1.1rem' }}>
                                            ${order.total}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                         {pendingReviews.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '100px 0', color: '#666' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
                                <h3>No hay reseñas pendientes</h3>
                                <p>Todos los comentarios están al día.</p>
                            </div>
                        ) : (
                            pendingReviews.map(review => (
                                <div key={review.id} style={{ background: '#13131a', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '16px', padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div>
                                            <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', background: '#facc15', color: 'black', fontWeight: 800, textTransform: 'uppercase', marginRight: '12px' }}>{review.productTitle}</span>
                                            <span style={{ fontWeight: 700 }}>{review.name}</span>
                                        </div>
                                        <span style={{ color: '#555', fontSize: '0.8rem' }}>{review.date}</span>
                                    </div>
                                    <div style={{ color: '#facc15', marginBottom: '8px', letterSpacing: '2px' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</div>
                                    <p style={{ color: '#ccc', margin: '0 0 24px', lineHeight: 1.6 }}>{review.comment}</p>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => approveReview(review)} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>Aprobar Comentario</button>
                                        <button onClick={() => rejectReview(review)} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>Eliminar</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                         {notifications.map(n => (
                            <div key={n.id} style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: n.type === 'order' ? 'rgba(236,72,153,0.1)' : 'rgba(250,204,21,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                    {n.type === 'order' ? '💰' : '⭐'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{n.message}</div>
                                    <div style={{ color: '#666', fontSize: '0.85rem' }}>{n.date} · {n.type === 'order' ? 'Pedido Completo' : 'Reseña Pendiente'}</div>
                                </div>
                                {!n.read && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ec4899' }}></div>}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
