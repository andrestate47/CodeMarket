export type ProductType = 'digital' | 'service' | 'physical';

export interface Product {
    id: string;
    title: string;
    category: string;
    description: string;
    price: string;
    comparePrice?: string;
    features: string[];
    type: ProductType;
    cta: string;
    highlight?: boolean;
    color: string;
    image?: string;
    longDescription?: string;
    variants?: { id: string; name: string; price: string; stock: number }[];
}

export const products: Product[] = [
    {
        id: 'arepa-queso',
        title: 'Arepa Tradicional con Queso',
        category: 'Alimentos',
        description: 'Deliciosa arepa artesanal rellena con abundante queso costeño derretido.',
        price: 'S/ 12.00',
        comparePrice: 'S/ 15.00',
        features: [
            '100% Maíz Peto Artesanal',
            'Queso Costeño Derretido Premium',
            'Lista para Calentar en Sartén o Freidora',
            'Empaque al Vacío de Máxima Frescura'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%)',
        image: '/arepa-hero.jpg',
        longDescription: '🧀 Disfruta de la auténtica **Arepa Tradicional con Queso**, elaborada diariamente con masa de maíz peto 100% natural y abundante queso costeño artesanal. Crujiente por fuera y dorada por dentro.',
        variants: [
            { id: 'v1', name: 'Personal (1 un.)', price: 'S/ 12.00', stock: 20 },
            { id: 'v2', name: 'Pack Familiar (4 un.)', price: 'S/ 42.00', stock: 15 },
            { id: 'v3', name: 'Super Pack x10', price: 'S/ 95.00', stock: 15 }
        ]
    },
    {
        id: 'polera-oversize',
        title: 'Polera Oversize Unisex Algodón',
        category: 'Ropa',
        description: 'Polera de corte holgado confeccionada en 100% algodón peruano de alto gramaje.',
        price: 'S/ 79.90',
        comparePrice: 'S/ 99.90',
        features: [
            '100% Algodón Reactivo de 240g',
            'No se Encoge ni Destiñe al Lavar',
            'Corte Unisex Holgado Estilo Streetwear',
            'Costuras Reforzadas de Alta Durabilidad'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        highlight: true,
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        image: '/polera-hero.jpg',
        longDescription: '👕 Diseñada para brindar máxima comodidad y estilo urbano. Nuestra **Polera Oversize Unisex** está confeccionada en algodón peruano suave y transpirable.',
        variants: [
            { id: 'v-s', name: 'Talla S', price: 'S/ 79.90', stock: 5 },
            { id: 'v-m', name: 'Talla M', price: 'S/ 79.90', stock: 10 },
            { id: 'v-l', name: 'Talla L', price: 'S/ 79.90', stock: 8 },
            { id: 'v-xl', name: 'Talla XL', price: 'S/ 79.90', stock: 2 }
        ]
    },
    {
        id: 'zapatillas-urbanas',
        title: 'Zapatillas Urbanas Street Pro',
        category: 'Calzado',
        description: 'Zapatillas de cuero sintético premium con suela antideslizante y plantilla anatómica.',
        price: 'S/ 149.00',
        comparePrice: 'S/ 189.00',
        features: [
            'Cuero Sintético de Alta Resistencia',
            'Suela de Goma Antideslizante',
            'Plantilla Acojinada Ultra Confort',
            'Diseño Moderno e Impecable'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #FF6B6B 0%, #556270 100%)',
        image: '/zapatillas-hero.jpg',
        longDescription: '👟 Las **Zapatillas Urbanas Street Pro** combinan resistencia, confort diario y un acabado estético impecable para combinar con cualquier outfit casual.',
        variants: [
            { id: 'z-38', name: 'Talla 38', price: 'S/ 149.00', stock: 3 },
            { id: 'z-39', name: 'Talla 39', price: 'S/ 149.00', stock: 4 },
            { id: 'z-40', name: 'Talla 40', price: 'S/ 149.00', stock: 5 },
            { id: 'z-41', name: 'Talla 41', price: 'S/ 149.00', stock: 3 }
        ]
    },
    {
        id: 'smartband-v8',
        title: 'Reloj Inteligente Smartband V8',
        category: 'Tecnología',
        description: 'Monitoreo de ritmo cardíaco, notificación de llamadas, resistencia al agua y batería de 10 días.',
        price: 'S/ 89.00',
        comparePrice: 'S/ 120.00',
        features: [
            'Pantalla AMOLED Color de 1.47 pulgadas',
            'Sensor SpO2 y Ritmo Cardíaco 24/7',
            'Resistente al Agua IP68',
            'Compatible con Android y iOS'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        image: '/smartband-hero.jpg',
        longDescription: '⌚ Realiza un seguimiento completo de tus entrenamientos, salud y notificaciones con el **Smartband V8**.',
        variants: [
            { id: 'sb-black', name: 'Color Negro Mate', price: 'S/ 89.00', stock: 2 },
            { id: 'sb-silver', name: 'Color Plata Metalizado', price: 'S/ 89.00', stock: 2 }
        ]
    },
    {
        id: 'audifonos-pro',
        title: 'Audífonos Inalámbricos Bluetooth Pro',
        category: 'Tecnología',
        description: 'Cancelación activa de ruido, sonido Hi-Fi HD y estuche de carga inalámbrica rápida.',
        price: 'S/ 59.90',
        comparePrice: 'S/ 89.90',
        features: [
            'Bluetooth 5.3 de Baja Latencia',
            'Estuche de Carga con Indicador LED',
            'Batería hasta 24 Horas de Autonomía',
            'Micrófono HD para Llamadas Claras'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        image: '/audifonos-hero.jpg',
        longDescription: '🎧 Sumérgete en tu música favorita con sonido de altísima fidelidad y graves profundos.',
        variants: [
            { id: 'aud-white', name: 'Blanco Puro', price: 'S/ 59.90', stock: 0 },
            { id: 'aud-black', name: 'Negro Azabache', price: 'S/ 59.90', stock: 0 }
        ]
    },
    {
        id: 'lampara-led',
        title: 'Lámpara LED de Escritorio Recargable',
        category: 'Hogar',
        description: 'Lámpara articulada táctil con 3 modos de luz y puerto de carga USB.',
        price: 'S/ 39.00',
        comparePrice: 'S/ 55.00',
        features: [
            '3 Niveles de Brillo Táctil',
            'Batería Recargable de 2000mAh',
            'Brazo Flexible Ajustable 360°',
            'Luz Cálida y Fría Anti-fatiga Visual'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
        image: '/lampara-hero.jpg',
        longDescription: '💡 Ilumina tu espacio de estudio o trabajo con eficiencia energética y cuidado para tus ojos.'
    },
    {
        id: 'set-cremas',
        title: 'Set de Cremas Faciales Hidratantes',
        category: 'Accesorios',
        description: 'Fórmula enriquecida con Ácido Hialurónico y Vitamina C para rejuvenecimiento facial.',
        price: 'S/ 65.00',
        comparePrice: 'S/ 85.00',
        features: [
            'Dermatológicamente Testeado',
            'Libre de Parabenos y Crueldad Animal',
            'Hidratación Profunda 48 Horas',
            'Absorción Rápida Sin Sensación Grasosa'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
        image: '/cremas-hero.jpg',
        longDescription: '✨ Nutre y protege la piel de tu rostro con ingredientes de grado cosmético superior.',
        variants: [
            { id: 'c-seca', name: 'Fórmula Piel Seca', price: 'S/ 65.00', stock: 15 },
            { id: 'c-mixta', name: 'Fórmula Piel Mixta/Grasa', price: 'S/ 65.00', stock: 15 }
        ]
    }
];
