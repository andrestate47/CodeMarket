'use client';

import React, { useState } from 'react';

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
    answer: "Nuestros productos pasan por rigurosas pruebas de calidad para evitar errores. Sin embargo, si encuentras alguna incompatibilidad insalvable, cuentas con nuestra protección total y garantía de funcionamiento. Queremos que tu inversión esté siempre segura."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', color: 'var(--foreground)' }}>
          Resolvemos tus <span className="text-gradient">dudas</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Queremos que tengas total tranquilidad y confianza plena antes de dar el siguiente paso.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {faqs.map((faq, idx) => (
          <div 
            key={idx} 
            style={{ 
              background: 'var(--glass-bg)', 
              border: '1px solid var(--glass-border)', 
              borderRadius: '12px', 
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            <button 
              onClick={() => toggle(idx)}
              style={{
                width: '100%',
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--foreground)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              <span style={{ paddingRight: '20px' }}>{faq.question}</span>
              <span style={{ 
                transform: openIndex === idx ? 'rotate(180deg)' : 'rotate(0deg)', 
                transition: 'transform 0.3s ease',
                color: '#ef4444'
              }}>
                ▼
              </span>
            </button>
            <div style={{ 
              maxHeight: openIndex === idx ? '300px' : '0', 
              overflow: 'hidden', 
              transition: 'all 0.3s ease',
              opacity: openIndex === idx ? 1 : 0,
              padding: openIndex === idx ? '0 24px 24px 24px' : '0 24px',
              color: 'var(--text-muted)',
              lineHeight: 1.6
            }}>
              {faq.answer}
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '56px' }}>
        <h3 style={{ marginBottom: '24px', fontSize: '1.3rem', fontWeight: 600, color: 'var(--foreground)' }}>¿Listo para llevar tu proyecto al siguiente nivel?</h3>
        <button 
          onClick={() => {
            const section = document.querySelector('section:nth-of-type(3)');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{
            background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
            color: 'white',
            border: 'none',
            padding: '16px 36px',
            borderRadius: '50px',
            fontSize: '1.1rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(239, 68, 68, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.4)';
          }}
        >
          Explorar Colección de Productos
        </button>
      </div>
    </section>
  );
}
