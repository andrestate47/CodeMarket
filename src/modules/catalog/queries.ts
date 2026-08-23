import { createBrowserClient } from '@/lib/supabase/client';
import { formatMoney } from '@/lib/money';
import { products as localProducts } from '@/data/products';

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
    }
];

export function getInstantProducts(): CatalogProduct[] {
    let localSavedProducts: CatalogProduct[] = [];
    if (typeof window !== 'undefined') {
        try {
            localSavedProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
        } catch {
            localSavedProducts = [];
        }
    }

    const staticMapped: CatalogProduct[] = localProducts.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        price_amount: p.price ? Math.round(parseFloat(p.price.replace(/[^0-9.]/g, '')) * 100) : 0,
        compare_at_amount: p.comparePrice ? Math.round(parseFloat(p.comparePrice.replace(/[^0-9.]/g, '')) * 100) : undefined,
        features: p.features || [],
        type: p.type,
        cta: p.cta,
        highlight: p.highlight,
        color: p.color,
        image: p.image,
        longDescription: p.longDescription,
        stock_quantity: p.id === 'audifonos-pro' ? 0 : (p.id === 'smartband-v8' ? 4 : 25),
        track_inventory: true,
        status: 'active',
        variants: p.variants,
    }));

    const combined = [...VAPES_DEMO_PRODUCTS, ...localSavedProducts, ...staticMapped];
    return combined.filter((prod, index, self) =>
        index === self.findIndex(p => p.id === prod.id)
    );
}

export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
    const instantList = getInstantProducts();
    let dbMapped: CatalogProduct[] = [];

    try {
        const isPlaceholderUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-project');
        if (!isPlaceholderUrl) {
            const supabase = createBrowserClient();

            // 1.5s timeout so slow networks fallback to instantList gracefully
            const fetchPromise = supabase
                .from('products')
                .select(`
                    *,
                    categories ( name, slug )
                `);

            const timeoutPromise = new Promise<{ data: null }>((resolve) =>
                setTimeout(() => resolve({ data: null }), 1500)
            );

            const res = await Promise.race([fetchPromise, timeoutPromise]);
            const dbProducts = res.data;

            if (dbProducts && dbProducts.length > 0) {
                dbMapped = (dbProducts as unknown as Record<string, unknown>[]).map(p => {
                    const meta = (p.metadata as Record<string, unknown>) || {};
                    const priceCents = Number(p.price_cents || p.price_amount || 0);
                    const compareCents = p.compare_at_price_cents || p.compare_at_amount ? Number(p.compare_at_price_cents || p.compare_at_amount) : undefined;
                    const currency = String(p.currency || 'PEN');

                    const categoryObj = p.categories as { name?: string; slug?: string } | undefined;
                    const catName = categoryObj?.name || (p.category ? String(p.category) : 'General');

                    const imgArr = Array.isArray(p.images) ? p.images : [];
                    const imgUrl = p.image_url ? String(p.image_url) : (imgArr[0] ? String(imgArr[0]) : (meta.image ? String(meta.image) : '/web-basica-hero.png'));

                    return {
                        id: String(p.id),
                        title: String(p.title || p.name || ''),
                        category: catName,
                        category_id: p.category_id ? String(p.category_id) : undefined,
                        description: String(p.short_description || p.description || ''),
                        short_description: p.short_description ? String(p.short_description) : undefined,
                        price: formatMoney(priceCents / 100, currency),
                        comparePrice: compareCents ? formatMoney(compareCents / 100, currency) : undefined,
                        price_amount: priceCents,
                        compare_at_amount: compareCents,
                        features: Array.isArray(meta.features) ? (meta.features as string[]) : [
                            'Garantía oficial de tienda',
                            'Envío seguro a todo el país',
                            'Soporte técnico especializado'
                        ],
                        type: ((p.product_type || meta.type || 'physical') as 'digital' | 'service' | 'physical'),
                        cta: String(meta.cta || 'Agregar al Carrito'),
                        highlight: Boolean(p.featured),
                        color: String(meta.color || 'linear-gradient(135deg, #FF6B00 0%, #FF9D00 100%)'),
                        image: imgUrl,
                        longDescription: String(p.description || p.short_description || ''),
                        stock_quantity: Number(p.stock_quantity ?? 0),
                        track_inventory: Boolean(p.track_inventory),
                        status: String(p.status || 'active'),
                        variants: Array.isArray(meta.variants) ? (meta.variants as { id: string; name: string; price: string; stock: number }[]) : undefined,
                        wholesale_rules: Array.isArray(meta.wholesale_rules) ? (meta.wholesale_rules as Record<string, unknown>[]) : undefined,
                    };
                });
            }
        }
    } catch {
        // Safe fallback
    }

    const combined = [...dbMapped, ...instantList];
    return combined.filter((prod, index, self) =>
        index === self.findIndex(p => p.id === prod.id)
    );
}
