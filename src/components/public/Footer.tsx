'use client';

import React from 'react';
import Link from 'next/link';
import TiendaVirLogo from '../brand/TiendaVirLogo';
import styles from './Footer.module.css';

interface FooterProps {
    storeName?: string;
}

export default function Footer({ storeName = 'TiendaVir' }: FooterProps) {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                {/* MAIN 4-COLUMN GRID */}
                <div className={styles.mainGrid}>
                    {/* COLUMN 1: BRAND & ABOUT */}
                    <div className={styles.brandCol}>
                        <TiendaVirLogo size="small" showTagline={false} />
                        <p className={styles.brandDesc}>
                            Tu e-commerce de confianza en Perú. Productos 100% garantizados, envíos rápidos a todo el país y atención personalizada.
                        </p>
                        <div className={styles.socialRow}>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} title="Instagram">
                                📷
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} title="Facebook">
                                📘
                            </a>
                            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} title="TikTok">
                                🎵
                            </a>
                            <a href="https://wa.me/51900000000" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} title="WhatsApp">
                                💬
                            </a>
                        </div>
                    </div>

                    {/* COLUMN 2: CATÁLOGO DE PRODUCTOS */}
                    <div>
                        <h4 className={styles.colTitle}>Catálogo</h4>
                        <ul className={styles.linkList}>
                            <li className={styles.linkItem}><Link href="/#productos">Todos los productos</Link></li>
                            <li className={styles.linkItem}><Link href="/ofertas">Ofertas especiales</Link></li>
                            <li className={styles.linkItem}><Link href="/#productos">Dispositivos</Link></li>
                            <li className={styles.linkItem}><Link href="/#productos">Pods y Cartuchos</Link></li>
                            <li className={styles.linkItem}><Link href="/#productos">Líquidos y Sales</Link></li>
                            <li className={styles.linkItem}><Link href="/#productos">Accesorios</Link></li>
                        </ul>
                    </div>

                    {/* COLUMN 3: ATENCIÓN Y AYUDA */}
                    <div>
                        <h4 className={styles.colTitle}>Atención al cliente</h4>
                        <ul className={styles.linkList}>
                            <li className={styles.linkItem}><Link href="/#productos">Seguimiento de pedidos</Link></li>
                            <li className={styles.linkItem}><Link href="/#productos">Métodos de pago</Link></li>
                            <li className={styles.linkItem}><Link href="/#productos">Políticas de envío</Link></li>
                            <li className={styles.linkItem}><Link href="/#productos">Términos y condiciones</Link></li>
                            <li className={styles.linkItem}><Link href="/admin">Acceso Panel Admin</Link></li>
                        </ul>
                    </div>

                    {/* COLUMN 4: CONTACTO DIRECTO */}
                    <div>
                        <h4 className={styles.colTitle}>Contacto</h4>
                        <div className={styles.contactList}>
                            <div className={styles.contactItem}>
                                <span className={styles.contactIcon}>📍</span>
                                <div className={styles.contactText}>
                                    <strong>Cobertura Nacional</strong>
                                    Lima & Envíos garantizados a todo el Perú
                                </div>
                            </div>
                            <div className={styles.contactItem}>
                                <span className={styles.contactIcon}>💬</span>
                                <div className={styles.contactText}>
                                    <strong>WhatsApp Atención</strong>
                                    Soporte directo 9:00 am - 8:00 pm
                                </div>
                            </div>
                            <div className={styles.contactItem}>
                                <span className={styles.contactIcon}>📧</span>
                                <div className={styles.contactText}>
                                    <strong>Correo Oficial</strong>
                                    contacto@tiendavir.com
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM LEGAL & PAYMENT BAR */}
                <div className={styles.bottomBar}>
                    <p className={styles.copyright}>
                        © 2026 {storeName} Inc. Todos los derechos reservados.
                    </p>

                    {/* PERUVIAN LEGAL REQUIREMENT: LIBRO DE RECLAMACIONES */}
                    <a href="mailto:contacto@tiendavir.com?subject=Libro%20de%20Reclamaciones" className={styles.libroReclamaciones}>
                        📑 Libro de Reclamaciones
                    </a>

                    {/* ACCEPTED PAYMENT METHOD BADGES */}
                    <div className={styles.paymentBadges}>
                        <span className={styles.badgePill}>YAPE</span>
                        <span className={styles.badgePill}>PLIN</span>
                        <span className={styles.badgePill}>VISA</span>
                        <span className={styles.badgePill}>MASTERCARD</span>
                        <span className={styles.badgePill}>BCP</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
