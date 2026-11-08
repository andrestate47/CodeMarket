import { createBrowserClient } from '@/lib/supabase/client';
import { mapDbProduct, PRODUCT_SELECT } from '@/modules/products/mapper';

export interface CatalogCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
}

export interface CatalogProduct {
    id: string;
    title: string;
    category: string;
    category_id?: string;
    description: string;
    short_description?: string;
    price: string;
    comparePrice?: string;
    price_amount: number;
    compare_at_amount?: number;
    features: string[];
    type: 'digital' | 'service' | 'physical';
    cta: string;
    highlight?: boolean;
    color: string;
    image?: string;
    longDescription?: string;
    stock_quantity: number;
    track_inventory: boolean;
    status?: string;
    variants?: { id: string; name: string; price: string; stock: number }[];
    wholesale_rules?: Record<string, unknown>[];
}

const VAPES_DEMO_PRODUCTS: CatalogProduct[] = [
    {
        id: 'pod-x-pro',
        title: 'Pod System X Pro Max 30W',
        category: 'Dispositivos',
        description: 'Batería de 1500mAh con pantalla OLED y ajuste de potencia variable.',
        price: 'S/ 79.90',
        comparePrice: 'S/ 99.90',
        price_amount: 7990,
        compare_at_amount: 9990,
        features: [
            'Batería integrada recargable de 1500mAh USB-C',
            'Pantalla OLED HD de 0.96 pulgadas con contador de caladas',
            'Potencia variable regulable de 5W a 30W',
            'Control de flujo de aire ajustable lateral'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        highlight: true,
        color: 'linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%)',
        image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80',
        longDescription: '💨 **Pod System X Pro Max 30W** es el dispositivo definitivo para vapeo de alta fidelidad de sabor. Equipado con batería de 1500mAh de larga duración y chip inteligente con regulación automática de wattaje.',
        stock_quantity: 15,
        track_inventory: true,
        status: 'active',
        variants: [
            { id: 'v-black', name: 'Color Negro Azabache', price: 'S/ 79.90', stock: 5 },
            { id: 'v-silver', name: 'Color Plata Metalizado', price: 'S/ 79.90', stock: 4 },
            { id: 'v-blue', name: 'Color Azul Neón', price: 'S/ 79.90', stock: 3 },
            { id: 'v-red', name: 'Color Rojo Escarlata', price: 'S/ 79.90', stock: 3 }
        ]
    },
    {
        id: 'liquido-mentol-ice',
        title: 'E-Liquid Menta Helada 60ml',
        category: 'Líquidos',
        description: 'Sabor mentolado ultra fresco con notas heladas.',
        price: 'S/ 45.00',
        comparePrice: 'S/ 55.00',
        price_amount: 4500,
        compare_at_amount: 5500,
        features: [
            'Botella Chubby Gorilla de 60ml con tapa de seguridad',
            'Relación 70% VG / 30% PG para máxima producción de vapor',
            'Extracto de mentol natural de grado USP',
            'Disponible en 0mg, 3mg y 6mg de nicotina'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        highlight: true,
        color: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80',
        longDescription: '❄️ Disfruta de la máxima frescura con nuestro **E-Liquid Menta Helada 60ml**. Un golpe de garganta helado y refrescante ideal para vapeo diario.',
        stock_quantity: 3,
        track_inventory: true,
        status: 'active',
        variants: [
            { id: 'nic-0', name: '0 mg Nicotina', price: 'S/ 45.00', stock: 1 },
            { id: 'nic-3', name: '3 mg Nicotina', price: 'S/ 45.00', stock: 1 },
            { id: 'nic-6', name: '6 mg Nicotina', price: 'S/ 45.00', stock: 1 }
        ]
    },
    {
        id: 'cartuchos-mesh-06',
        title: 'Pack 3x Cartuchos Mesh 0.6 ohm',
        category: 'Pods y Cartuchos',
        description: 'Resistencias de malla de larga duración para pod systems.',
        price: 'S/ 38.00',
        price_amount: 3800,
        features: [
            'Malla de Kanthal A1 de calentamiento uniforme',
            'Capacidad de e-liquid de 3ml con llenado superior',
            'Sabor limpio e intenso desde la primera calada',
            'Pack original de 3 unidades selladas'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80',
        longDescription: '⚡ Potencia el sabor de tu pod con el **Pack de 3 Cartuchos Mesh 0.6 ohm**. Diseñados con malla metálica de alta precisión y algodón orgánico 100% japonés.',
        stock_quantity: 25,
        track_inventory: true,
        status: 'active'
    },
    {
        id: 'resistencia-gtx-mesh',
        title: 'Resistencia Vaporesso GTX 0.3 ohm',
        category: 'Resistencias',
        description: 'Coil de repuesto original para tanques GTX.',
        price: 'S/ 18.00',
        price_amount: 1800,
        features: [
            'Resistencia de malla de 0.3 ohm (32W - 45W)',
            'Algodón de lino antibacteriano',
            'Compatible con dispositivos Vaporesso GTX',
            'Gran densidad de vapor y fidelidad de sabor'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
        longDescription: '🔥 **Resistencia Vaporesso GTX 0.3 ohm** original para un vapeo directo a pulmón (DTL) potente y lleno de matices.',
        stock_quantity: 0,
        track_inventory: true,
        status: 'active'
    },
    {
        id: 'bateria-18650-3000',
        title: 'Batería Molicel 18650 3000mAh 35A',
        category: 'Accesorios',
        description: 'Batería de alto amperaje para mod mecánico o electrónico.',
        price: 'S/ 42.00',
        comparePrice: 'S/ 50.00',
        price_amount: 4200,
        compare_at_amount: 5000,
        features: [
            'Capacidad nominal de 3000mAh',
            'Descarga continua máxima de 35A',
            'Química segura INR/Li-ion',
            'Voltaje nominal de 3.6V / 4.2V máxima carga'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        color: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)',
        image: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=800&auto=format&fit=crop&q=80',
        longDescription: '🔋 **Batería Molicel 18650 3000mAh** de máxima potencia y seguridad probada en laboratorio para alimentaciones exigentes.',
        stock_quantity: 8,
        track_inventory: true,
        status: 'active'
    },
    {
        id: 'liquido-frutas-tropicales',
        title: 'E-Liquid Mango Maracuyá 100ml',
        category: 'Líquidos',
        description: 'Mezcla frutal tropical intensa con sal de nicotina.',
        price: 'S/ 65.00',
        price_amount: 6500,
        features: [
            'Botella Gorilla Gran Formato de 100ml',
            'Combinación artesanal de mango dulce y maracuyá ácido',
            'Formulada para pod o tanque sub-ohm',
            'Fabricado bajo norma cosmética e-liquid ISO 9001'
        ],
        type: 'physical',
        cta: 'Agregar al Carrito',
        highlight: true,
        color: 'linear-gradient(135deg, #FF6B6B 0%, #556270 100%)',
        image: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800&auto=format&fit=crop&q=80',
        longDescription: '🥭 **E-Liquid Mango Maracuyá 100ml**: Una explosión frutal de sabor tropical recién cosechado. Inhalación dulce con exhalación cítrica balanceada.',
        stock_quantity: 12,
        track_inventory: true,
        status: 'active',
        variants: [
            { id: 'mg-0', name: '0 mg Nicotina', price: 'S/ 65.00', stock: 4 },
            { id: 'mg-3', name: '3 mg Nicotina', price: 'S/ 65.00', stock: 4 },
            { id: 'mg-6', name: '6 mg Nicotina', price: 'S/ 65.00', stock: 4 }
        ]
    },
    {
        id: 'vape-drag-x',
        title: 'Voopoo Drag X Mod Pod Kit',
        category: 'Dispositivos',
        description: 'Potente kit de 80W compatible con baterías 18650 y resistencias PnP.',
        price: 'S/ 180.00',
        price_amount: 18000,
        features: ['Hasta 80W de potencia', 'Compatible con batería 18650', 'Gran variedad de resistencias PnP'],
        type: 'physical', cta: 'Agregar al Carrito', color: '#B91C1C', stock_quantity: 10, track_inventory: true, status: 'active',
        image: '/images/vapes/pod_system_argus.png'
    },
    {
        id: 'vape-caliburn-g2',
        title: 'Uwell Caliburn G2 Pod',
        category: 'Dispositivos',
        description: 'Vapeador tipo lápiz ligero con excelente sabor y flujo de aire ajustable.',
        price: 'S/ 120.00',
        price_amount: 12000,
        features: ['Batería de 750mAh', 'Flujo de aire ajustable', 'Vibración interactiva'],
        type: 'physical', cta: 'Agregar al Carrito', color: '#1D4ED8', stock_quantity: 15, track_inventory: true, status: 'active',
        image: '/images/vapes/pod_system_caliburn.png'
    },
    {
        id: 'vape-smok-nord4',
        title: 'SMOK Nord 4 Kit 80W',
        category: 'Dispositivos',
        description: 'Batería interna de 2000mAh y 80W de potencia para vapor abundante.',
        price: 'S/ 160.00',
        price_amount: 16000,
        features: ['Batería interna 2000mAh', 'Anillos de control de aire', 'Capacidad 4.5ml'],
        type: 'physical', cta: 'Agregar al Carrito', color: '#4338CA', stock_quantity: 20, track_inventory: true, status: 'active',
        image: '/images/vapes/pod_system_argus.png'
    },
    {
        id: 'vape-geekvape-aegis',
        title: 'GeekVape Aegis Legend 2 (L200)',
        category: 'Dispositivos',
        description: 'Mod ultra resistente IP68 con tanque Z Sub-Ohm.',
        price: 'S/ 280.00',
        price_amount: 28000,
        features: ['Certificación IP68', 'Doble batería 18650', 'Hasta 200W'],
        type: 'physical', cta: 'Agregar al Carrito', color: '#D97706', stock_quantity: 5, track_inventory: true, status: 'active',
        image: '/images/vapes/pod_system_argus.png'
    },
    {
        id: 'vape-vaporesso-xros3',
        title: 'Vaporesso XROS 3 Pod',
        category: 'Dispositivos',
        description: 'Diseño minimalista con batería de 1000mAh y tecnología COREX.',
        price: 'S/ 130.00',
        price_amount: 13000,
        features: ['Batería 1000mAh', 'Sabor consistente COREX', 'Diseño anti-fugas'],
        type: 'physical', cta: 'Agregar al Carrito', color: '#10B981', stock_quantity: 30, track_inventory: true, status: 'active',
        image: '/images/vapes/pod_system_xros.png'
    },
    {
        id: 'liquid-watermelon-ice',
        title: 'E-Liquid Sandía Ice 60ml',
        category: 'Líquidos',
        description: 'Sabor a dulce sandía jugosa con un toque helado.',
        price: 'S/ 50.00', price_amount: 5000,
        features: ['VG/PG 70/30'], type: 'physical', cta: 'Agregar al Carrito', color: '#EF4444', stock_quantity: 40, track_inventory: true, status: 'active',
        image: '/images/vapes/saltnic_mango_ice.png'
    },
    {
        id: 'liquid-blue-razz',
        title: 'E-Liquid Blue Razz 100ml',
        category: 'Líquidos',
        description: 'Explosión de frambuesa azul dulce y ácida.',
        price: 'S/ 70.00', price_amount: 7000,
        features: ['VG/PG 70/30'], type: 'physical', cta: 'Agregar al Carrito', color: '#3B82F6', stock_quantity: 25, track_inventory: true, status: 'active',
        image: '/images/vapes/disposable_berry_blast.png'
    },
    {
        id: 'liquid-tobacco-vanilla',
        title: 'E-Liquid Tabaco Vainilla 60ml',
        category: 'Líquidos',
        description: 'Clásico tabaco rubio curado con notas suaves de vainilla bourbon.',
        price: 'S/ 55.00', price_amount: 5500,
        features: ['VG/PG 50/50'], type: 'physical', cta: 'Agregar al Carrito', color: '#8B5CF6', stock_quantity: 15, track_inventory: true, status: 'active',
        image: '/images/vapes/saltnic_mango_ice.png'
    },
    {
        id: 'liquid-strawberry-kiwi',
        title: 'E-Liquid Fresa Kiwi 120ml',
        category: 'Líquidos',
        description: 'La combinación perfecta de fresa madura y kiwi cítrico.',
        price: 'S/ 80.00', price_amount: 8000,
        features: ['VG/PG 70/30'], type: 'physical', cta: 'Agregar al Carrito', color: '#14B8A6', stock_quantity: 10, track_inventory: true, status: 'active',
        image: '/images/vapes/disposable_berry_blast.png'
    },
    {
        id: 'liquid-lemon-tart',
        title: 'E-Liquid Lemon Tart 60ml',
        category: 'Líquidos',
        description: 'Sabor a tarta de limón recién horneada con merengue dulce.',
        price: 'S/ 60.00', price_amount: 6000,
        features: ['VG/PG 70/30'], type: 'physical', cta: 'Agregar al Carrito', color: '#F59E0B', stock_quantity: 5, track_inventory: true, status: 'active',
        image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800&auto=format&fit=crop&q=80'
    }
];

/** true cuando NO hay Supabase real configurado (modo demo local). */
function isDemoMode(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !url || url.includes('your-supabase-project') || url.includes('placeholder');
}

/**
 * Productos disponibles de forma síncrona (render instantáneo).
 * Con Supabase configurado devuelve [] y la fuente de verdad es la base de datos,
 * así la tienda solo muestra lo que el admin tiene en el panel.
 */
export function getInstantProducts(): CatalogProduct[] {
    return isDemoMode() ? VAPES_DEMO_PRODUCTS : [];
}

/**
 * Catálogo público: productos activos desde Supabase (RLS permite leer status = 'active').
 */
export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
    if (isDemoMode()) return VAPES_DEMO_PRODUCTS;

    try {
        const { data, error } = await createBrowserClient()
            .from('products')
            .select(PRODUCT_SELECT)
            .eq('status', 'active')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('[catalog] Error cargando productos:', error.message);
            return [];
        }
        return (data || []).map(mapDbProduct);
    } catch (err) {
        console.error('[catalog] Error cargando productos:', err);
        return [];
    }
}