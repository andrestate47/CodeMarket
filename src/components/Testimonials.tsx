'use client';

import React, { useState } from 'react';
import styles from './Testimonials.module.css';

const REVIEWS = [
    {
        id: 1,
        name: 'Carlos Mendoza',
        role: 'Desarrollador Full Stack',
        text: 'Increíble calidad en los assets. Me ahorraron semanas de trabajo en mi último proyecto. Definitivamente vale la pena cada centavo.',
        initial: 'C'
    },
    {
        id: 2,
        name: 'Sofia Rodriguez',
        role: 'Product Designer',
        text: 'El diseño UI kit es simplemente espectacular. Moderno, limpio y muy fácil de implementar. Mis clientes quedaron encantados.',
        initial: 'S'
    },
    {
        id: 3,
        name: 'Miguel Ángel',
        role: 'Emprendedor',
        text: 'Compré el pack de plantillas y pude lanzar mi MVP en cuestión de días. El soporte técnico también fue muy atento.',
        initial: 'M'
    },
    {
        id: 4,
        name: 'Ana Laura',
        role: 'Frontend Dev',
        text: 'Código muy limpio y bien organizado. Es raro encontrar recursos de esta calidad hoy en día. ¡Totalmente recomendado!',
        initial: 'A'
    }
];

export default function Testimonials() {
    const [formData, setFormData] = useState({ name: '', email: '', message: '', rating: 5 });
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`¡Gracias por tu comentario de ${formData.rating} estrellas! Lo revisaremos pronto.`);
        setFormData({ name: '', email: '', message: '', rating: 5 });
    };

    return (
        <section className={styles.section}>
            <div className="container">
                <h2 className="section-title">Lo que dicen <span className="text-gradient">nuestros clientes</span></h2>
                <p className="section-subtitle">Únete a cientos de desarrolladores satisfechos.</p>

                <div className={styles.grid}>
                    {REVIEWS.map((review) => (
                        <div key={review.id} className={`${styles.card} glass card-hover`}>
                            <div className={styles.user}>
                                <div className={styles.avatar}>{review.initial}</div>
                                <div className={styles.userInfo}>
                                    <div className={styles.userName}>{review.name}</div>
                                    <div className={styles.userRole}>{review.role}</div>
                                </div>
                            </div>
                            <div className={styles.stars}>
                                {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
                            </div>
                            <p className={styles.text}>"{review.text}"</p>
                        </div>
                    ))}
                </div>

                <div className={`${styles.formSection} glass`}>
                    <h3 className={styles.formTitle}>Déjanos tu opinión</h3>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="Nombre"
                                className={styles.input}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                className={styles.input}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <span className={styles.ratingLabel}>Tu calificación:</span>
                            <div className={styles.starRating} onMouseLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`${styles.starBtn} ${(hoverRating || formData.rating) >= star ? styles.active : ''}`}
                                        onClick={() => setFormData({ ...formData, rating: star })}
                                        onMouseEnter={() => setHoverRating(star)}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            placeholder="¿Qué te pareció nuestro servicio?"
                            className={styles.textarea}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            required
                        ></textarea>
                        <button type="submit" className="btn-primary">Enviar Comentario</button>
                    </form>
                </div>
            </div>
        </section>
    );
}
