/**
 * Carga inicial de productos reales en Supabase.
 *
 * - Crea el bucket público "products" en Supabase Storage (si no existe).
 * - Crea las categorías base.
 * - Sube la imagen de cada producto al bucket y guarda la URL pública en metadata.image.
 * - Inserta/actualiza los productos (idempotente por store_id + slug).
 *
 * Uso:  node --env-file=.env.local scripts/seed-products.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
    process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const STORE_SLUG = 'codemarket'; // misma tienda que usan el checkout y el panel
const BUCKET = 'products';
const unsplash = (id) => `https://images.unsplash.com/photo-${id}?w=800&auto=format&fit=crop&q=80`;

const CATEGORIES = [
    { name: 'Dispositivos', slug: 'dispositivos', description: 'Equipos y dispositivos de vapeo.', sort_order: 1 },
    { name: 'Líquidos', slug: 'liquidos', description: 'Líquidos y sabores para tus dispositivos.', sort_order: 2 },
    { name: 'Pods y Cartuchos', slug: 'pods-cartuchos', description: 'Pods, cartuchos y repuestos compatibles.', sort_order: 3 },
    { name: 'Resistencias', slug: 'resistencias', description: 'Resistencias y coils de repuesto.', sort_order: 4 },
    { name: 'Accesorios', slug: 'accesorios', description: 'Baterías, fundas y más.', sort_order: 5 },
];

const PRODUCTS = [
    {
        slug: 'pod-system-x-pro-max-30w', name: 'Pod System X Pro Max 30W', category: 'dispositivos',
        short_description: 'Batería de 1500mAh con pantalla OLED y ajuste de potencia variable.',
        description: 'Pod System X Pro Max 30W es el dispositivo definitivo para vapeo de alta fidelidad de sabor. Equipado con batería de 1500mAh de larga duración y chip inteligente con regulación automática de wattaje.',
        price: 7990, compare: 9990, stock: 15, featured: true, image: unsplash('1539185441755-769473a23570'),
        features: ['Batería integrada recargable de 1500mAh USB-C', 'Pantalla OLED HD de 0.96 pulgadas', 'Potencia variable de 5W a 30W', 'Control de flujo de aire lateral'],
        variants: [
            { id: 'v-black', name: 'Color Negro Azabache', price: 'S/ 79.90', stock: 5 },
            { id: 'v-silver', name: 'Color Plata Metalizado', price: 'S/ 79.90', stock: 4 },
            { id: 'v-blue', name: 'Color Azul Neón', price: 'S/ 79.90', stock: 3 },
            { id: 'v-red', name: 'Color Rojo Escarlata', price: 'S/ 79.90', stock: 3 },
        ],
    },
    {
        slug: 'e-liquid-menta-helada-60ml', name: 'E-Liquid Menta Helada 60ml', category: 'liquidos',
        short_description: 'Sabor mentolado ultra fresco con notas heladas.',
        description: 'Disfruta de la máxima frescura con nuestro E-Liquid Menta Helada 60ml. Un golpe de garganta helado y refrescante ideal para vapeo diario.',
        price: 4500, compare: 5500, stock: 3, featured: true, image: unsplash('1541643600914-78b084683601'),
        features: ['Botella de 60ml con tapa de seguridad', '70% VG / 30% PG', 'Mentol natural grado USP', 'Disponible en 0mg, 3mg y 6mg'],
        variants: [
            { id: 'nic-0', name: '0 mg Nicotina', price: 'S/ 45.00', stock: 1 },
            { id: 'nic-3', name: '3 mg Nicotina', price: 'S/ 45.00', stock: 1 },
            { id: 'nic-6', name: '6 mg Nicotina', price: 'S/ 45.00', stock: 1 },
        ],
    },
    {
        slug: 'pack-3x-cartuchos-mesh-06-ohm', name: 'Pack 3x Cartuchos Mesh 0.6 ohm', category: 'pods-cartuchos',
        short_description: 'Resistencias de malla de larga duración para pod systems.',
        description: 'Potencia el sabor de tu pod con el Pack de 3 Cartuchos Mesh 0.6 ohm. Diseñados con malla metálica de alta precisión y algodón orgánico japonés.',
        price: 3800, stock: 25, image: unsplash('1527799820374-dcf8d9d4a388'),
        features: ['Malla Kanthal A1', 'Capacidad de 3ml', 'Sabor limpio e intenso', 'Pack de 3 unidades selladas'],
    },
    {
        slug: 'resistencia-vaporesso-gtx-03-ohm', name: 'Resistencia Vaporesso GTX 0.3 ohm', category: 'resistencias',
        short_description: 'Coil de repuesto original para tanques GTX.',
        description: 'Resistencia Vaporesso GTX 0.3 ohm original para un vapeo directo a pulmón potente y lleno de matices.',
        price: 1800, stock: 0, image: unsplash('1584308666744-24d5c474f2ae'),
        features: ['Malla de 0.3 ohm (32W - 45W)', 'Algodón antibacteriano', 'Compatible con Vaporesso GTX'],
    },
    {
        slug: 'bateria-molicel-18650-3000mah-35a', name: 'Batería Molicel 18650 3000mAh 35A', category: 'accesorios',
        short_description: 'Batería de alto amperaje para mod mecánico o electrónico.',
        description: 'Batería Molicel 18650 3000mAh de máxima potencia y seguridad probada en laboratorio.',
        price: 4200, compare: 5000, stock: 8, image: unsplash('1619725002198-6a689b72f41d'),
        features: ['3000mAh nominal', 'Descarga continua de 35A', 'Química INR/Li-ion segura'],
    },
    {
        slug: 'e-liquid-mango-maracuya-100ml', name: 'E-Liquid Mango Maracuyá 100ml', category: 'liquidos',
        short_description: 'Mezcla frutal tropical intensa.',
        description: 'E-Liquid Mango Maracuyá 100ml: una explosión frutal de sabor tropical. Inhalación dulce con exhalación cítrica balanceada.',
        price: 6500, stock: 12, featured: true, image: unsplash('1534353473418-4cfa6c56fd38'),
        features: ['Botella de 100ml', 'Mango dulce y maracuyá ácido', 'Para pod o tanque sub-ohm'],
        variants: [
            { id: 'mg-0', name: '0 mg Nicotina', price: 'S/ 65.00', stock: 4 },
            { id: 'mg-3', name: '3 mg Nicotina', price: 'S/ 65.00', stock: 4 },
            { id: 'mg-6', name: '6 mg Nicotina', price: 'S/ 65.00', stock: 4 },
        ],
    },
    {
        slug: 'voopoo-drag-x-mod-pod-kit', name: 'Voopoo Drag X Mod Pod Kit', category: 'dispositivos',
        short_description: 'Potente kit de 80W compatible con baterías 18650 y resistencias PnP.',
        description: 'Potente kit de 80W compatible con baterías 18650 y resistencias PnP.',
        price: 18000, stock: 10, image: 'public/images/vapes/pod_system_argus.png',
        features: ['Hasta 80W de potencia', 'Compatible con batería 18650', 'Resistencias PnP'],
    },
    {
        slug: 'uwell-caliburn-g2-pod', name: 'Uwell Caliburn G2 Pod', category: 'dispositivos',
        short_description: 'Vapeador tipo lápiz ligero con excelente sabor y flujo de aire ajustable.',
        description: 'Vapeador tipo lápiz ligero con excelente sabor y flujo de aire ajustable.',
        price: 12000, stock: 15, image: 'public/images/vapes/pod_system_caliburn.png',
        features: ['Batería de 750mAh', 'Flujo de aire ajustable', 'Vibración interactiva'],
    },
    {
        slug: 'smok-nord-4-kit-80w', name: 'SMOK Nord 4 Kit 80W', category: 'dispositivos',
        short_description: 'Batería interna de 2000mAh y 80W de potencia para vapor abundante.',
        description: 'Batería interna de 2000mAh y 80W de potencia para vapor abundante.',
        price: 16000, stock: 20, image: 'public/images/vapes/pod_system_argus.png',
        features: ['Batería interna 2000mAh', 'Anillos de control de aire', 'Capacidad 4.5ml'],
    },
    {
        slug: 'geekvape-aegis-legend-2-l200', name: 'GeekVape Aegis Legend 2 (L200)', category: 'dispositivos',
        short_description: 'Mod ultra resistente IP68 con tanque Z Sub-Ohm.',
        description: 'Mod ultra resistente IP68 con tanque Z Sub-Ohm.',
        price: 28000, stock: 5, image: 'public/images/vapes/pod_system_argus.png',
        features: ['Certificación IP68', 'Doble batería 18650', 'Hasta 200W'],
    },
    {
        slug: 'vaporesso-xros-3-pod', name: 'Vaporesso XROS 3 Pod', category: 'dispositivos',
        short_description: 'Diseño minimalista con batería de 1000mAh y tecnología COREX.',
        description: 'Diseño minimalista con batería de 1000mAh y tecnología COREX.',
        price: 13000, stock: 30, image: 'public/images/vapes/pod_system_xros.png',
        features: ['Batería 1000mAh', 'Sabor consistente COREX', 'Diseño anti-fugas'],
    },
    {
        slug: 'e-liquid-sandia-ice-60ml', name: 'E-Liquid Sandía Ice 60ml', category: 'liquidos',
        short_description: 'Sabor a dulce sandía jugosa con un toque helado.',
        description: 'Sabor a dulce sandía jugosa con un toque helado.',
        price: 5000, stock: 40, image: 'public/images/vapes/saltnic_mango_ice.png', features: ['VG/PG 70/30'],
    },
    {
        slug: 'e-liquid-blue-razz-100ml', name: 'E-Liquid Blue Razz 100ml', category: 'liquidos',
        short_description: 'Explosión de frambuesa azul dulce y ácida.',
        description: 'Explosión de frambuesa azul dulce y ácida.',
        price: 7000, stock: 25, image: 'public/images/vapes/disposable_berry_blast.png', features: ['VG/PG 70/30'],
    },
    {
        slug: 'e-liquid-tabaco-vainilla-60ml', name: 'E-Liquid Tabaco Vainilla 60ml', category: 'liquidos',
        short_description: 'Clásico tabaco rubio curado con notas suaves de vainilla bourbon.',
        description: 'Clásico tabaco rubio curado con notas suaves de vainilla bourbon.',
        price: 5500, stock: 15, image: 'public/images/vapes/saltnic_mango_ice.png', features: ['VG/PG 50/50'],
    },
    {
        slug: 'e-liquid-fresa-kiwi-120ml', name: 'E-Liquid Fresa Kiwi 120ml', category: 'liquidos',
        short_description: 'La combinación perfecta de fresa madura y kiwi cítrico.',
        description: 'La combinación perfecta de fresa madura y kiwi cítrico.',
        price: 8000, stock: 10, image: 'public/images/vapes/disposable_berry_blast.png', features: ['VG/PG 70/30'],
    },
    {
        slug: 'e-liquid-lemon-tart-60ml', name: 'E-Liquid Lemon Tart 60ml', category: 'liquidos',
        short_description: 'Sabor a tarta de limón recién horneada con merengue dulce.',
        description: 'Sabor a tarta de limón recién horneada con merengue dulce.',
        price: 6000, stock: 5, image: unsplash('1519915028121-7d3463d20b13'), features: ['VG/PG 70/30'],
    },
];

async function loadImageBytes(source) {
    if (source.startsWith('http')) {
        const res = await fetch(source);
        if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${source}`);
        return { bytes: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get('content-type') || 'image/jpeg', ext: 'jpg' };
    }
    const bytes = await readFile(path.resolve(source));
    return { bytes, contentType: 'image/png', ext: 'png' };
}

async function main() {
    // 1. Bucket
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some(b => b.id === BUCKET)) {
        const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
        if (error) throw new Error('No se pudo crear el bucket: ' + error.message);
        console.log('✔ Bucket "products" creado');
    } else {
        console.log('✔ Bucket "products" ya existe');
    }

    // 2. Store
    const { data: store, error: storeErr } = await supabase.from('stores').select('id').eq('slug', STORE_SLUG).single();
    if (storeErr || !store) throw new Error('No se encontró la tienda ' + STORE_SLUG);

    // 3. Categorías
    const { data: cats, error: catErr } = await supabase
        .from('categories')
        .upsert(CATEGORIES.map(c => ({ ...c, store_id: store.id, is_active: true })), { onConflict: 'store_id,slug' })
        .select('id, slug');
    if (catErr) throw new Error('Error creando categorías: ' + catErr.message);
    const catId = Object.fromEntries(cats.map(c => [c.slug, c.id]));
    console.log(`✔ ${cats.length} categorías listas`);

    // 4. Productos
    for (const p of PRODUCTS) {
        const { bytes, contentType, ext } = await loadImageBytes(p.image);
        const storagePath = `seed/${p.slug}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, { contentType, upsert: true });
        if (upErr) throw new Error(`Error subiendo imagen de ${p.name}: ${upErr.message}`);
        const imageUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;

        const row = {
            store_id: store.id,
            category_id: catId[p.category] || null,
            name: p.name,
            slug: p.slug,
            short_description: p.short_description,
            description: p.description,
            product_type: 'physical',
            status: 'active',
            price_amount: p.price,
            compare_at_amount: p.compare ?? null,
            currency: 'PEN',
            track_inventory: true,
            stock_quantity: p.stock,
            featured: Boolean(p.featured),
            metadata: {
                image: imageUrl,
                features: p.features || [],
                variants: p.variants || [],
                cta: 'Agregar al Carrito',
            },
        };

        const { data: saved, error: prodErr } = await supabase
            .from('products')
            .upsert(row, { onConflict: 'store_id,slug' })
            .select('id')
            .single();
        if (prodErr) throw new Error(`Error guardando ${p.name}: ${prodErr.message}`);

        await supabase.from('product_images').delete().eq('product_id', saved.id);
        await supabase.from('product_images').insert({
            store_id: store.id, product_id: saved.id, storage_path: storagePath, alt_text: p.name, is_primary: true,
        });
        console.log(`✔ ${p.name}`);
    }
    console.log(`\nListo: ${PRODUCTS.length} productos cargados en Supabase.`);
}

main().catch(err => {
    console.error('✖', err.message);
    process.exit(1);
});
