'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getAccessToken } from '@/lib/auth/session';
import {
    getRecentOrdersForNotificationsAction,
    OrderNotification,
} from '@/modules/orders/notificationActions';
import { playOrderNotificationSound, initNotificationAudioUnlock } from '@/lib/sound';
import styles from './AdminTopbar.module.css';

const READ_STORAGE_KEY = 'admin_read_order_ids';

function getReadIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
        const stored = localStorage.getItem(READ_STORAGE_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        return new Set();
    }
}

function saveReadIds(ids: Set<string>) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-200)));
    } catch {
        // ignore
    }
}

function formatRelativeTime(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        if (diffSec < 60) return 'Hace un momento';
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `Hace ${diffMin} min`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `Hace ${diffHours} h`;
        return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    } catch {
        return '';
    }
}

export default function AdminNotifications() {
    const [orders, setOrders] = useState<OrderNotification[]>([]);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const knownIdsRef = useRef<Set<string>>(new Set());
    const knownPaymentStatusRef = useRef<Map<string, string>>(new Map());
    const isFirstLoadRef = useRef(true);
    const router = useRouter();

    // Cargar IDs leídos desde localStorage y desbloquear AudioContext al montar
    useEffect(() => {
        setReadIds(getReadIds());
        initNotificationAudioUnlock();
    }, []);

    // Cerrar al hacer click afuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Función para consultar órdenes recientes
    const fetchOrders = useCallback(async (isPolling = false) => {
        try {
            let token: string | undefined;
            try {
                token = await getAccessToken();
            } catch {
                token = undefined;
            }
            const res = await getRecentOrdersForNotificationsAction(token, 10);
            if (!res.success) return;

            const newOrders = res.data;
            setOrders(newOrders);

            // Detectar nuevos pedidos o nuevos comprobantes que no conocíamos
            if (!isFirstLoadRef.current && isPolling) {
                const brandNewOrders = newOrders.filter(o => !knownIdsRef.current.has(o.id));
                if (brandNewOrders.length > 0) {
                    playOrderNotificationSound();
                    const latest = brandNewOrders[0];
                    const amountFormatted = (latest.total_amount / 100).toFixed(2);
                    toast.success(
                        `🛒 ¡Nuevo pedido ${latest.order_number}! S/ ${amountFormatted} de ${latest.customer_name}`,
                        { duration: 7000 }
                    );
                    window.dispatchEvent(new CustomEvent('admin:new-order', { detail: latest }));
                } else {
                    const newlyUploadedReceipts = newOrders.filter(
                        o => o.payment_status === 'under_review' && knownPaymentStatusRef.current.get(o.id) !== 'under_review'
                    );
                    if (newlyUploadedReceipts.length > 0) {
                        playOrderNotificationSound();
                        const latestReceipt = newlyUploadedReceipts[0];
                        toast.info(
                            `📎 ¡Comprobante de pago recibido en pedido ${latestReceipt.order_number} (${latestReceipt.customer_name})!`,
                            { duration: 7000 }
                        );
                        window.dispatchEvent(new CustomEvent('admin:new-order', { detail: latestReceipt }));
                    }
                }
            }

            // Actualizar IDs y estados conocidos
            const nextKnown = new Set<string>();
            const nextStatusMap = new Map<string, string>();
            newOrders.forEach(o => {
                nextKnown.add(o.id);
                if (o.payment_status) nextStatusMap.set(o.id, o.payment_status);
            });
            knownIdsRef.current = nextKnown;
            knownPaymentStatusRef.current = nextStatusMap;
            isFirstLoadRef.current = false;
        } catch {
            // Ignorar si aún no hay sesión o admin
        } finally {
            setLoading(false);
        }
    }, []);

    // Carga inicial y respaldo periódico ligero (Realtime ya notifica al instante)
    useEffect(() => {
        fetchOrders(false);
        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && document.hidden) return;
            fetchOrders(true);
        }, 60000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    // Suscripción Realtime en Supabase para notificación instantánea
    useEffect(() => {
        const channel = supabase
            .channel('realtime_admin_orders_bell')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                (payload) => {
                    const newRow = payload.new as {
                        id: string;
                        order_number: string;
                        customer_name: string;
                        total_amount: number;
                        payment_status?: string;
                        created_at: string;
                    };
                    if (newRow && !knownIdsRef.current.has(newRow.id)) {
                        knownIdsRef.current.add(newRow.id);
                        if (newRow.payment_status) {
                            knownPaymentStatusRef.current.set(newRow.id, newRow.payment_status);
                        }
                        setOrders(prev => [newRow, ...prev.filter(o => o.id !== newRow.id)].slice(0, 10));
                        playOrderNotificationSound();
                        const amount = ((newRow.total_amount || 0) / 100).toFixed(2);
                        toast.success(
                            `🛒 ¡Nuevo pedido ${newRow.order_number}! S/ ${amount} de ${newRow.customer_name}`,
                            { duration: 8000 }
                        );
                        window.dispatchEvent(new CustomEvent('admin:new-order', { detail: newRow }));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const unreadCount = orders.filter(o => !readIds.has(o.id)).length;

    const handleMarkAllAsRead = () => {
        const next = new Set(readIds);
        orders.forEach(o => next.add(o.id));
        setReadIds(next);
        saveReadIds(next);
    };

    const handleOrderClick = (orderId: string) => {
        const next = new Set(readIds);
        next.add(orderId);
        setReadIds(next);
        saveReadIds(next);
        setIsOpen(false);
        router.push(`/admin/pedidos`);
    };

    return (
        <div className={styles.notificationWrapper} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className={styles.notificationBellBtn}
                aria-label="Notificaciones de pedidos"
                title="Notificaciones de pedidos"
                aria-expanded={isOpen}
            >
                <span className={styles.bellIcon}>🔔</span>
                {unreadCount > 0 && (
                    <span className={styles.notificationBadge}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={styles.notificationDropdown}>
                    <div className={styles.notificationHeader}>
                        <div className={styles.notificationTitleGroup}>
                            <span className={styles.notificationTitle}>Pedidos recientes</span>
                            {unreadCount > 0 && (
                                <span className={styles.notificationCountPill}>{unreadCount} nuevos</span>
                            )}
                        </div>
                        <div className={styles.notificationHeaderActions}>
                            <button
                                type="button"
                                onClick={() => playOrderNotificationSound()}
                                className={styles.soundTestBtn}
                                title="Probar sonido de notificación"
                            >
                                🔊 Probar
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMarkAllAsRead}
                                    className={styles.markReadBtn}
                                >
                                    Marcar leídas
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.notificationList}>
                        {orders.length === 0 ? (
                            <div className={styles.notificationEmpty}>
                                <span>📭</span>
                                <p>{loading ? 'Cargando pedidos...' : 'No hay pedidos recientes'}</p>
                            </div>
                        ) : (
                            orders.map(order => {
                                const isUnread = !readIds.has(order.id);
                                const amountFormatted = (order.total_amount / 100).toFixed(2);
                                return (
                                    <button
                                        key={order.id}
                                        type="button"
                                        onClick={() => handleOrderClick(order.id)}
                                        className={`${styles.notificationItem} ${isUnread ? styles.notificationItemUnread : ''}`}
                                    >
                                        <div className={styles.notificationItemIcon}>🛍️</div>
                                        <div className={styles.notificationItemContent}>
                                            <div className={styles.notificationItemRow}>
                                                <span className={styles.orderNumber}>{order.order_number}</span>
                                                <span className={styles.orderAmount}>S/ {amountFormatted}</span>
                                            </div>
                                            <div className={styles.notificationItemCustomer}>
                                                {order.customer_name}
                                            </div>
                                            <span className={styles.notificationItemTime}>
                                                {formatRelativeTime(order.created_at)}
                                            </span>
                                        </div>
                                        {isUnread && <span className={styles.unreadDot} />}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className={styles.notificationFooter}>
                        <Link
                            href="/admin/pedidos"
                            onClick={() => setIsOpen(false)}
                            className={styles.notificationViewAllLink}
                        >
                            Ver todos los pedidos →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
