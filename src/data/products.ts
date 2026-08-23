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
    // --- 1. POD SYSTEMS (3 MODELOS) ---
    {
        id: 'vaporesso-xros-4-mini',
        title: 'Vaporesso XROS 4 Mini Pod Kit 1000mAh',
        category: 'Dispositivos',
        description: 'Pod system compacto de recarga superior con tecnología COREX 2.0 y flujo de aire ajustable.',
        price: 'S/ 89.90',
        comparePrice: 'S/ 110.00',
        features: [
            'Batería integrada de 1000mAh con carga rápida Type-C',
            'Tecnología COREX 2.0 para sabor más intenso y duradero',
            'Flujo de aire preciso ajustable (MTL a RDL)',
            'Compatible con toda la serie de pods Vaporesso XROS'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        highlight: true,
        color: 'linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%)',
        image: '/images/vapes/pod_system_xros.png',
        longDescription: '🔥 El **Vaporesso XROS 4 Mini** eleva el estándar del vapeo compacto. Cuenta con una potente batería de **1000mAh**, cuerpo metálico ultraligero y la revolucionaria tecnología de calentamiento COREX 2.0 que alarga la vida útil de los cartuchos hasta un 30%.',
        variants: [
            { id: 'xros-black', name: 'Negro Mate', price: 'S/ 89.90', stock: 15 },
            { id: 'xros-silver', name: 'Plata Ice', price: 'S/ 89.90', stock: 12 },
            { id: 'xros-blue', name: 'Azul Neón', price: 'S/ 89.90', stock: 8 },
            { id: 'xros-green', name: 'Verde Pastel', price: 'S/ 89.90', stock: 5 }
        ]
    },
    {
        id: 'uwell-caliburn-g3-kit',
        title: 'Uwell Caliburn G3 Pod Kit 900mAh 25W',
        category: 'Dispositivos',
        description: 'Pantalla OLED con ajuste de potencia de hasta 25W y cartuchos antiderrames G3.',
        price: 'S/ 95.00',
        comparePrice: 'S/ 115.00',
        features: [
            'Potencia regulable hasta 25W con pantalla OLED',
            'Batería interna de 900mAh',
            'Cartuchos con tecnología Pro-FOCS sabor auténtico',
            'Doble modo de activación: automático o por botón'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        highlight: true,
        color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        image: '/images/vapes/pod_system_caliburn.png',
        longDescription: '💨 El **Uwell Caliburn G3** es el primer Pod de la serie Caliburn con pantalla OLED y ajuste de potencia de hasta 25W. Su sistema de cartuchos sellados ultrasónicos evita cualquier tipo de fuga.',
        variants: [
            { id: 'g3-black', name: 'Negro Midnight', price: 'S/ 95.00', stock: 10 },
            { id: 'g3-blue', name: 'Azul Cobalto', price: 'S/ 95.00', stock: 8 },
            { id: 'g3-red', name: 'Rojo Rubí', price: 'S/ 95.00', stock: 6 }
        ]
    },
    {
        id: 'voopoo-argus-pod-se',
        title: 'VOOPOO Argus Pod SE Kit 800mAh',
        category: 'Dispositivos',
        description: 'Diseño elegante en aleación de zinc y cuero con regulación de aire de precisión de 4 orificios.',
        price: 'S/ 79.90',
        comparePrice: 'S/ 99.90',
        features: [
            'Batería integrada de 800mAh',
            'Acabado en cuero genuino antideslizante',
            'Entrada de aire ajustable de 4 orificios',
            'Cartuchos ITO patente anti-fugas'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
        image: '/images/vapes/pod_system_argus.png',
        longDescription: '✨ El **VOOPOO Argus Pod SE** combina sofisticación y ergonomía. Sus finos acabados en cuero y aleación de zinc lo convierten en un dispositivo distinguido con excelente entrega de sabor.',
        variants: [
            { id: 'argus-leather-black', name: 'Cuero Negro', price: 'S/ 79.90', stock: 12 },
            { id: 'argus-leather-brown', name: 'Cuero Marrón', price: 'S/ 79.90', stock: 7 },
            { id: 'argus-leather-blue', name: 'Cuero Azul', price: 'S/ 79.90', stock: 5 }
        ]
    },

    // --- 2. RESISTENCIAS Y CARTUCHOS ---
    {
        id: 'cartuchos-vaporesso-xros-pack',
        title: 'Pack 4x Cartuchos Vaporesso XROS Mesh',
        category: 'Resistencias',
        description: 'Cartuchos de repuesto con tecnología de malla anti-fugas de 3ml de capacidad.',
        price: 'S/ 55.00',
        comparePrice: 'S/ 65.00',
        features: [
            'Pack original de 4 cartuchos sellados',
            'Tecnología de calada Mesh sabor intenso',
            'Sistema de llenado superior anti-derrames',
            'Disponibles en 0.6Ω, 0.8Ω y 1.0Ω'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        image: '/images/vapes/vape_coils_pack.png',
        longDescription: '⚙️ Cartuchos originales **Vaporesso XROS Series Mesh Pods**. Diseñados para brindar un sabor denso y constante con sales de nicotina o e-liquids de base libre.',
        variants: [
            { id: 'xros-coil-06', name: '0.6 ohm (RDL / Sabor intenso)', price: 'S/ 55.00', stock: 25 },
            { id: 'xros-coil-08', name: '0.8 ohm (Equilibrado)', price: 'S/ 55.00', stock: 30 },
            { id: 'xros-coil-10', name: '1.0 ohm (MTL suave)', price: 'S/ 55.00', stock: 20 }
        ]
    },
    {
        id: 'cartuchos-uwell-caliburn-g3-pack',
        title: 'Pack 4x Cartuchos Uwell Caliburn G3 Pod',
        category: 'Resistencias',
        description: 'Pods de repuesto sellados por ultrasonido con boquilla ergonómica pro-FOCS.',
        price: 'S/ 58.00',
        features: [
            'Pack de 4 pods de repuesto Uwell G3',
            'Malla integrada con gran densidad de vapor',
            'Capacidad de 2.5ml con ventana de visión',
            'Disponibles en 0.6Ω y 0.9Ω'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
        image: '/images/vapes/vape_coils_pack.png',
        longDescription: '⚙️ Cartuchos de repuesto para **Uwell Caliburn G3**. Integran la aclamada tecnología Pro-FOCS para una restitución de sabor perfecta.',
        variants: [
            { id: 'g3-pod-06', name: '0.6 ohm (Mayor Potencia)', price: 'S/ 58.00', stock: 20 },
            { id: 'g3-pod-09', name: '0.9 ohm (Ideal SaltNic)', price: 'S/ 58.00', stock: 18 }
        ]
    },
    {
        id: 'cartuchos-voopoo-argus-pack',
        title: 'Pack 3x Cartuchos VOOPOO Argus Pod',
        category: 'Resistencias',
        description: 'Cartuchos transparentes multicapa anti-condensación para Argus Pod.',
        price: 'S/ 45.00',
        features: [
            'Pack de 3 unidades selladas',
            'Boquilla ergonómica adaptada a los labios',
            'Entradas de aire invisibles de 4 orificios',
            'Resistencia Mesh de larga duración'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
        image: '/images/vapes/vape_coils_pack.png',
        longDescription: '⚙️ Cartuchos de repuesto oficiales **VOOPOO Argus Pod Cartridge**. Diseñados con estructura patentada de 4 capas para evitar fugas y condensación.',
        variants: [
            { id: 'argus-pod-07', name: '0.7 ohm (Sabor y Vapor)', price: 'S/ 45.00', stock: 15 },
            { id: 'argus-pod-12', name: '1.2 ohm (Golpe de garganta suave)', price: 'S/ 45.00', stock: 15 }
        ]
    },

    // --- 3. LÍQUIDOS SALTNIC (5 TIPOS DE SALTNIC) ---
    {
        id: 'liquido-nasty-slow-blow-salt',
        title: 'Líquido SaltNic Nasty Juice Slow Blow 30ml',
        category: 'Líquidos',
        description: 'Exquisita combinación de piña con limonada helada en sales de nicotina.',
        price: 'S/ 52.00',
        comparePrice: 'S/ 60.00',
        features: [
            'Botella de 30ml con tapa de seguridad',
            'Sabor dulce de piña con limonada carbonatada fría',
            'Fórmula 50/50 VG/PG optimizada para Pod Systems',
            'Disponible en 35mg y 50mg de sales de nicotina'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        highlight: true,
        color: 'linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%)',
        image: '/images/vapes/saltnic_mango_ice.png',
        longDescription: '🍍 **Nasty Juice Slow Blow SaltNic**: La galardonada combinación de piña dulce madura mezclada con limonada cítrica refrescante y el característico toque helado Nasty.',
        variants: [
            { id: 'nasty-35mg', name: '30ml - 35mg Nic Salt', price: 'S/ 52.00', stock: 20 },
            { id: 'nasty-50mg', name: '30ml - 50mg Nic Salt', price: 'S/ 52.00', stock: 25 }
        ]
    },
    {
        id: 'liquido-blvk-pink-frozen-apple',
        title: 'Líquido SaltNic BLVK Pink Frozen Apple 30ml',
        category: 'Líquidos',
        description: 'Manzana crujiente roja y verde con un toque mentolado glacial ultra refrescante.',
        price: 'S/ 49.90',
        features: [
            'Botella de 30ml importada de EE.UU.',
            'Combinación perfecta de manzanas dulces y ácidas con mentol',
            'Ideal para vapeo diario en equipos Pod',
            'Disponible en 35mg y 50mg'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80',
        longDescription: '🍏 **BLVK Pink Frozen Apple Salt**: Disfruta de la frescura mordaz de manzanas verdes crujientes entrelazadas con el sabor jugoso de manzanas rojas y una brisa helada irresistible.',
        variants: [
            { id: 'blvk-35mg', name: '30ml - 35mg Nic Salt', price: 'S/ 49.90', stock: 15 },
            { id: 'blvk-50mg', name: '30ml - 50mg Nic Salt', price: 'S/ 49.90', stock: 18 }
        ]
    },
    {
        id: 'liquido-pod-juice-jewel-mint',
        title: 'Líquido SaltNic Pod Juice Jewel Mint Ice 30ml',
        category: 'Líquidos',
        description: 'La menta helada más pura, limpia y refrescante con notas dulces de eucalipto.',
        price: 'S/ 50.00',
        comparePrice: 'S/ 58.00',
        features: [
            'Formulación de menta pura ultra refrescante',
            '30ml de sales de nicotina de máxima pureza',
            'Sensación de frescura limpia en cada inhalación',
            'Disponible en 35mg y 50mg'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
        longDescription: '❄️ **Pod Juice Jewel Mint Ice Salt**: El estándar de oro en menta helada. Diseñado especialmente para quienes buscan una experiencia mentolada pura, intensa y sin empalagar.',
        variants: [
            { id: 'jewel-35mg', name: '30ml - 35mg Nic Salt', price: 'S/ 50.00', stock: 22 },
            { id: 'jewel-50mg', name: '30ml - 50mg Nic Salt', price: 'S/ 50.00', stock: 30 }
        ]
    },
    {
        id: 'liquido-dinner-lady-lemon-tart',
        title: 'Líquido SaltNic Dinner Lady Lemon Tart 30ml',
        category: 'Líquidos',
        description: 'Tarta de crema de limón artesanal con fondo de hojaldre crujiente y merengue.',
        price: 'S/ 55.00',
        features: [
            'Sabor postre internacional galardonado mundialmente',
            '30ml de sales de nicotina suave al vapear',
            'Perfil gourmet con notas de limón cítrico y masa horneada',
            'Disponible en 35mg y 50mg'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
        image: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800&auto=format&fit=crop&q=80',
        longDescription: '🍋 **Dinner Lady Lemon Tart Salt**: Un verdadero clásico de la repostería del vapeo. Siente la cremosa cuajada de limón envuelta en una masa de tarta dorada con toque dulce de merengue.',
        variants: [
            { id: 'dl-35mg', name: '30ml - 35mg Nic Salt', price: 'S/ 55.00', stock: 12 },
            { id: 'dl-50mg', name: '30ml - 50mg Nic Salt', price: 'S/ 55.00', stock: 15 }
        ]
    },
    {
        id: 'liquido-naked-100-hawaiian-pog',
        title: 'Líquido SaltNic Naked 100 Hawaiian POG Ice 30ml',
        category: 'Líquidos',
        description: 'Exótica mezcla tropical de maracuyá, naranja fresca y guayaba jugosa con mentol.',
        price: 'S/ 52.00',
        comparePrice: 'S/ 62.00',
        features: [
            'Mezcla icónica tropical POG (Passionfruit, Orange, Guava)',
            'Base helada sutil que resalta las frutas',
            'Fabricación premium en California, EE.UU.',
            'Disponible en 35mg y 50mg'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80',
        longDescription: '🌺 **Naked 100 Hawaiian POG Ice Salt**: Trasládate a las playas de Hawái con este cóctel frutal irresistible de maracuyá, naranja dulce y guayaba rosa rematado con hielo.',
        variants: [
            { id: 'pog-35mg', name: '30ml - 35mg Nic Salt', price: 'S/ 52.00', stock: 14 },
            { id: 'pog-50mg', name: '30ml - 50mg Nic Salt', price: 'S/ 52.00', stock: 16 }
        ]
    },

    // --- 4. DESCARTABLES / DISPOSABLES (5 TIPOS) ---
    {
        id: 'descartable-lost-mary-blue-razz',
        title: 'Vape Descartable Lost Mary OS5000 - Blue Razz Ice',
        category: 'Desechables',
        description: '5000 caladas de frambuesa azul helada con indicador de batería LED de 3 colores.',
        price: 'S/ 55.00',
        comparePrice: 'S/ 68.00',
        features: [
            'Hasta 5000 caladas de sabor constante',
            'Batería de 650mAh recargable por puerto USB Type-C',
            '13ml de e-liquid premium al 5% (50mg) nic salt',
            'Resistencia Mesh de alta definición'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        highlight: true,
        color: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
        image: '/images/vapes/disposable_berry_blast.png',
        longDescription: '🫐 **Lost Mary OS5000 Blue Razz Ice**: Uno de los descartables más populares del mundo. Su ergonómico diseño de agarre texturizado y su sabor intenso a frambuesa azul helada garantizan satisfacción duradera.',
    },
    {
        id: 'descartable-elfbar-bc5000-watermelon',
        title: 'Vape Descartable Elfbar BC5000 - Watermelon Ice',
        category: 'Desechables',
        description: '5000 caladas de dulce sandía jugosa con toque frío glacial en formato estuche compacto.',
        price: 'S/ 52.00',
        comparePrice: 'S/ 65.00',
        features: [
            '5000 caladas con doble resistencia de malla (Dual Mesh)',
            'Batería recargable de 650mAh Type-C',
            '13ml de sales de nicotina al 5%',
            'Sabor icónico ultra fresco'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
        longDescription: '🍉 **Elfbar BC5000 Watermelon Ice**: La combinación clásica que nunca falla. Sandía recién cortada rebosante de dulzura refrescada con un toque helado constante de principio a fin.',
    },
    {
        id: 'descartable-geekbar-pulse-mango',
        title: 'Vape Descartable Geek Bar Pulse 15000 - Tropical Mango',
        category: 'Desechables',
        description: '15000 caladas en modo Regular o 7500 en modo Pulse con pantalla a color dinámico.',
        price: 'S/ 75.00',
        comparePrice: 'S/ 90.00',
        features: [
            'Modo dual: 15,000 Puffs (Regular) / 7,500 Puffs (Pulse Boost)',
            'Pantalla HD con medidor en tiempo real de batería y líquido',
            'Doble núcleo procesador para sabor constante',
            '16ml de e-liquid al 5% nic salt'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        highlight: true,
        color: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
        image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80',
        longDescription: '🚀 **Geek Bar Pulse 15000 Tropical Mango**: La vanguardia de los vapes descartables. Incluye pantalla con animaciones cósmicas, ajuste de flujo de aire y modo Pulse para ráfagas de sabor duplicadas.',
    },
    {
        id: 'descartable-ignite-v80-grape',
        title: 'Vape Descartable IGNITE V80 - Grape Ice',
        category: 'Desechables',
        description: '8000 caladas en elegante cuerpo metálico matte con uva dulce e intensa sabor frío.',
        price: 'S/ 62.00',
        features: [
            'Hasta 8000 caladas de vapeo premium',
            'Acabado metálico elegante antideslizante',
            'Batería recargable rápida por USB-C',
            '18ml de sales de nicotina de alta pureza'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        image: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=800&auto=format&fit=crop&q=80',
        longDescription: '🍇 **IGNITE V80 Grape Ice**: Estilo, potencia y sofisticación. Diseñado por la marca global IGNITE con cuerpo matte premium y un intenso sabor a uvas moradas heladas.',
    },
    {
        id: 'descartable-oxbar-magic-maze-kiwi',
        title: 'Vape Descartable Oxbar Magic Maze 10000 - Strawberry Kiwi',
        category: 'Desechables',
        description: '10000 caladas con pantalla inteligente y regulación de vatiaje de 11W a 15W.',
        price: 'S/ 68.00',
        comparePrice: 'S/ 82.00',
        features: [
            'Hasta 10,000 caladas con potencia ajustable por botón',
            'Pantalla LED de monitoreo de líquido y batería',
            '18ml de e-liquid al 5% nic salt',
            'Flujo de aire inferior de precisión'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #ec4899 0%, #9d174d 100%)',
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80',
        longDescription: '🍓 **Oxbar Magic Maze 10000 Strawberry Kiwi**: Controla tu experiencia de vapeo ajustando los vatios de salida entre 11W y 15W. Fresa dulce entrelazada con kiwi cítrico refrescante.',
    },

    // --- 5. ACCESORIOS ---
    {
        id: 'bateria-molicel-18650-3000',
        title: 'Batería Molicel 18650 P28A 2800mAh 35A (Original)',
        category: 'Accesorios',
        description: 'Batería recargable de alto amperaje para Mods electrónicos y mecánicos de vapeo.',
        price: 'S/ 42.00',
        comparePrice: 'S/ 50.00',
        features: [
            'Batería 100% original grado A Molicel',
            'Capacidad nominal 2800mAh - 3000mAh',
            'Descarga continua real de 35A',
            'Tasa de seguridad probada contra sobrecalentamiento'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
        image: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=800&auto=format&fit=crop&q=80',
        longDescription: '🔋 La batería **Molicel 18650 P28A** es considerada la batería más segura y eficiente del mercado para vapeo de alto rendimiento.',
    },
    {
        id: 'estuche-funda-silicona-pod',
        title: 'Estuche Funda de Silicona Anti-Impacto con Lanyard',
        category: 'Accesorios',
        description: 'Funda protectora de silicona suave con cordón colgante para Pod Systems.',
        price: 'S/ 25.00',
        features: [
            'Silicona de grado médico antichoque y antideslizante',
            'Incluye cordón ajustable tipo Lanyard para cuello',
            'Protege contra caídas, arañazos y polvo',
            'Corte preciso para puerto de carga USB-C'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
        image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80',
        longDescription: '🛡️ Protege tu dispositivo contra caídas accidentales. **Funda de Silicona Universal con Lanyard** para colgar al cuello y transportar tu vaper de forma segura a donde vayas.',
    }
];
