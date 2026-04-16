'use client';

import React, { useState } from 'react';
import styles from './FAQ.module.css';

const faqs = [
  {
    question: "¿Es seguro comprar aquí mis recursos digitales?",
    answer: "Absolutamente. Utilizamos protocolos de encriptación de grado bancario (SSL) para proteger tus datos. No almacenamos información de tus tarjetas y todos los pagos son procesados a través de pasarelas seguras líderes en el mercado."
  },
  {
    question: "¿Cómo y cuándo recibo mi producto?",
    answer: "¡Al instante! Al confirmar tu compra, el sistema te redirigirá automáticamente a la página de descarga y recibirás un correo con el acceso de por vida. Cero demoras, empiezas a implementar y desarrollar en segundos."
  },
  {
    question: "¿Tengo soporte técnico si algo falla o no sé cómo instalarlo?",
    answer: "¡Por supuesto! Tu éxito es nuestra prioridad. Todas nuestras soluciones tecnológicas incluyen soporte técnico premium. Si te quedas trabado, nuestro equipo de expertos en código y desarrollo está listo para ayudarte paso a paso."
  },
  {
    question: "¿Qué pasa si el código o plantilla no me funciona?",
    answer: " nuestros productos pasan por rigurosas pruebas de calidad para evitar errores. Sin embargo, si encuentras alguna incompatibilidad insalvable, cuentas con nuestra protección total y garantía de funcionamiento. Queremos que tu inversión esté siempre segura."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Resolvemos tus <span className="text-gradient">dudas</span>
        </h2>
        <p className={styles.subtitle}>
          Queremos que tengas total tranquilidad y confianza plena antes de dar el siguiente paso.
        </p>
      </div>

      <div className={styles.list}>
        {faqs.map((faq, idx) => (
          <div key={idx} className={styles.item}>
            <button 
              onClick={() => toggle(idx)}
              className={styles.questionButton}
            >
              <span>{faq.question}</span>
              <span className={styles.arrow} style={{ transform: openIndex === idx ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ▼
              </span>
            </button>
            <div className={styles.answer} style={{ 
              maxHeight: openIndex === idx ? '300px' : '0', 
              opacity: openIndex === idx ? 1 : 0,
              padding: openIndex === idx ? '0 24px 24px 24px' : '0 24px',
            }}>
              {faq.answer}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.ctaWrapper}>
        <h3 className={styles.ctaTitle}>¿Listo para llevar tu proyecto al siguiente nivel?</h3>
        <button 
          onClick={() => {
            const section = document.querySelector('section:nth-of-type(3)');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
          }}
          className={styles.ctaButton}
        >
          Explorar Colección
        </button>
      </div>
    </section>
  );
}
