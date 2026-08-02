'use client';

import React, { useEffect } from 'react';
import styles from './AdminMobileDrawer.module.css';

interface AdminMobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export default function AdminMobileDrawer({ isOpen, onClose, children }: AdminMobileDrawerProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                document.body.style.overflow = '';
                window.removeEventListener('keydown', handleKeyDown);
            };
        } else {
            document.body.style.overflow = '';
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
            <div className={styles.drawer} role="dialog" aria-modal="true">
                <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar menú">
                    ✕
                </button>
                <div className={styles.drawerInner}>
                    {children}
                </div>
            </div>
        </>
    );
}
