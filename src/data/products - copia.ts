export type ProductType = 'digital' | 'service';

export interface Product {
    id: string;
    title: string;
    category: string;
    description: string;
    price: string;
    features: string[];
    type: ProductType;
    cta: string;
    highlight?: boolean;
    color: string; // To simulate product image
}

export const products: Product[] = [
    {
        id: 'web-basica',
        title: 'Kit Web Basica',
        category: 'Sitio Web',
        description: 'Tu presencia en línea profesional con todo lo esencial.',
        price: '$99.99',
        features: ['Hasta 5 Secciones', 'Diseño Responsivo', 'Formulario de Contacto', 'Optimización Básica'],
        type: 'digital',
        cta: 'Comprar',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
        id: 'landing-basica',
        title: 'Kit Landing Basica',
        category: 'Landing Page',
        description: 'Página de aterrizaje optimizada para captar clientes.',
        price: '$49.99',
        features: ['Una Sola Página', 'Alta Conversión', 'Carga Rápida', 'Call to Actions Claros'],
        type: 'digital',
        cta: 'Comprar',
        color: 'linear-gradient(135deg, #FF6B6B 0%, #556270 100%)',
    },
    {
        id: 'web-pro',
        title: 'Kit Web Pro',
        category: 'Negocios',
        description: 'Solución completa para empresas que buscan escalar.',
        price: '$299.00',
        features: ['E-commerce Ready', 'Blog Integrado', 'SEO Avanzado', 'Panel de Administración'],
        type: 'digital',
        cta: 'Comprar',
        highlight: true,
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
        id: 'dashboard',
        title: 'Dashboard',
        category: 'Administración',
        description: 'Interfaz administrativa completa para gestionar datos.',
        price: '$79.00',
        features: ['Gráficos Interactivos', 'Tablas de Datos', 'Modo Oscuro', 'Componentes Modulares'],
        type: 'digital',
        cta: 'Comprar',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
        id: 'whatsapp-automation',
        title: 'Automatización WhatsApp',
        category: 'Herramientas',
        description: 'Automatiza tus ventas y soporte al cliente por chat.',
        price: '$89.00',
        features: ['Bot de Respuestas', 'Flujos de Venta', 'Integración CRM', 'Mensajes Masivos'],
        type: 'digital',
        cta: 'Comprar',
        color: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    },
    {
        id: 'custom-dev',
        title: 'Desarrollo a Medida',
        category: 'Servicios',
        description: 'Soluciones web personalizadas para tu empresa.',
        price: 'Variable',
        features: ['Arquitectura Custom', 'Integraciones', 'Soporte VIP', 'Escalable'],
        type: 'service',
        cta: 'Cotizar',
        color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    },
];
