'use client';

import React, { useEffect, useState } from 'react';
import { products } from '@/data/products';

const ADMIN_PASSWORD = 'codemarket2026'; // ← Cambia esto

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

export default function AdminReviews() {
    const [authed, setAuthed] = useState(false);
    const [pass, setPass] = useState('');
    const [wrongPass, setWrongPass] = useState(false);
    const [pending, setPending] = useState<PendingReview[]>([]);
    const [approved, setApproved] = useState<PendingReview[]>([]);

    const loadData = () => {
        const allPending: PendingReview[] = [];
        const allApproved: PendingReview[] = [];
        products.forEach((p) => {
            const pend = JSON.parse(localStorage.getItem(`reviews_pending_${p.id}`) || '[]');
            const appr = JSON.parse(localStorage.getItem(`reviews_${p.id}`) || '[]');
            pend.forEach((r: Review) => allPending.push({ ...r, productId: p.id, productTitle: p.title }));
            appr.forEach((r: Review) => allApproved.push({ ...r, productId: p.id, productTitle: p.title }));
        });
        setPending(allPending);
        setApproved(allApproved);
    };

    useEffect(() => {
        if (authed) loadData();
    }, [authed]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pass === ADMIN_PASSWORD) {
            setAuthed(true);
            setWrongPass(false);
        } else {
            setWrongPass(true);
        }
    };

    const approve = (review: PendingReview) => {
        // Remove from pending
        const pend = JSON.parse(localStorage.getItem(`reviews_pending_${review.productId}`) || '[]');
        localStorage.setItem(`reviews_pending_${review.productId}`, JSON.stringify(pend.filter((r: Review) => r.id !== review.id)));
        // Add to approved
        const appr = JSON.parse(localStorage.getItem(`reviews_${review.productId}`) || '[]');
        localStorage.setItem(`reviews_${review.productId}`, JSON.stringify([review, ...appr]));
        loadData();
    };

    const reject = (review: PendingReview) => {
        const pend = JSON.parse(localStorage.getItem(`reviews_pending_${review.productId}`) || '[]');
        localStorage.setItem(`reviews_pending_${review.productId}`, JSON.stringify(pend.filter((r: Review) => r.id !== review.id)));
        loadData();
    };

    const deleteApproved = (review: PendingReview) => {
        const appr = JSON.parse(localStorage.getItem(`reviews_${review.productId}`) || '[]');
        localStorage.setItem(`reviews_${review.productId}`, JSON.stringify(appr.filter((r: Review) => r.id !== review.id)));
        loadData();
    };

    if (!authed) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', fontFamily: 'Inter, sans-serif' }}>
                <form onSubmit={handleLogin} style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>🔐 Admin Panel</h1>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>Moderación de reseñas — CodeMarket</p>
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={pass}
                        onChange={e => setPass(e.target.value)}
                        style={{ background: '#0a0a0f', border: `1px solid ${wrongPass ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', padding: '12px 16px', color: 'white', fontSize: '1rem', outline: 'none' }}
                    />
                    {wrongPass && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>Contraseña incorrecta</span>}
                    <button type="submit" style={{ background: 'white', color: 'black', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Entrar</button>
                </form>
            </main>
        );
    }

    const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

    return (
        <main style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: 'Inter, sans-serif', padding: '40px 24px', color: 'white' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>🛡️ Moderación de Reseñas</h1>
                        <p style={{ color: '#666', margin: '4px 0 0' }}>CodeMarket Admin Panel</p>
                    </div>
                    <button onClick={() => setAuthed(false)} style={{ background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}>Cerrar sesión</button>
                </div>

                {/* PENDING */}
                <section style={{ marginBottom: '48px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: '#facc15' }}>
                        ⏳ Pendientes de aprobación ({pending.length})
                    </h2>
                    {pending.length === 0 ? (
                        <p style={{ color: '#555', padding: '24px', background: '#13131a', borderRadius: '12px', textAlign: 'center' }}>No hay reseñas pendientes ✅</p>
                    ) : (
                        pending.map(r => (
                            <div key={r.id} style={{ background: '#13131a', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                    <div>
                                        <span style={{ fontWeight: 700 }}>{r.name}</span>
                                        <span style={{ color: '#facc15', marginLeft: '10px', letterSpacing: '2px' }}>{stars(r.rating)}</span>
                                        <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: '#555', background: '#1e1e2a', padding: '2px 8px', borderRadius: '4px' }}>{r.productTitle}</span>
                                    </div>
                                    <span style={{ color: '#555', fontSize: '0.8rem' }}>{r.date}</span>
                                </div>
                                <p style={{ color: '#ccc', margin: '0 0 16px', lineHeight: 1.6 }}>{r.comment}</p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => approve(r)} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>✓ Aprobar</button>
                                    <button onClick={() => reject(r)} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>✕ Rechazar</button>
                                </div>
                            </div>
                        ))
                    )}
                </section>

                {/* APPROVED */}
                <section>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: '#22c55e' }}>
                        ✅ Publicadas ({approved.length})
                    </h2>
                    {approved.length === 0 ? (
                        <p style={{ color: '#555', padding: '24px', background: '#13131a', borderRadius: '12px', textAlign: 'center' }}>No hay reseñas publicadas aún.</p>
                    ) : (
                        approved.map(r => (
                            <div key={r.id} style={{ background: '#13131a', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                    <div>
                                        <span style={{ fontWeight: 700 }}>{r.name}</span>
                                        <span style={{ color: '#facc15', marginLeft: '10px', letterSpacing: '2px' }}>{stars(r.rating)}</span>
                                        <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: '#555', background: '#1e1e2a', padding: '2px 8px', borderRadius: '4px' }}>{r.productTitle}</span>
                                    </div>
                                    <span style={{ color: '#555', fontSize: '0.8rem' }}>{r.date}</span>
                                </div>
                                <p style={{ color: '#ccc', margin: '0 0 16px', lineHeight: 1.6 }}>{r.comment}</p>
                                <button onClick={() => deleteApproved(r)} style={{ background: 'transparent', color: '#dc2626', border: '1px solid #dc262633', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                            </div>
                        ))
                    )}
                </section>
            </div>
        </main>
    );
}
