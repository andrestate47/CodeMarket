export type ProductType = 'digital' | 'service';

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
}

export const products: Product[] = [
    {
        id: 'web-basica',
        title: 'Kit Web Básica Premium',
        category: 'Sitio Web',
        description: 'Todo lo que necesitas para lanzar tu negocio: Dominio + Hosting Gratis y Correos Corporativos.',
        price: '$99.99',
        features: [
            'Dominio y Hosting GRATIS (1er Año)', 
            'Botón de WhatsApp Flotante', 
            'Correos Corporativos Profesionales', 
            'Diseño 100% Responsivo y Rápido',
            'Secciones: Inicio, Nosotros, Servicios, Contacto'
        ],
        type: 'digital',
        cta: 'Comprar',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        image: '/web-basica-hero.png',
        longDescription: '🚀 ¿Estás perdiendo clientes por **no tener presencia digital**? Nuestro **Kit Web Básica Premium** es la solución **"Llave en Mano"** que tu negocio necesita para empezar a vender por internet desde el día uno.\n\n💡 **Dominio + Hosting GRATIS** el primer año — sin costos ocultos, sin sorpresas. Tu sitio alojado en servidores **ultrarrápidos** para que cargue en segundos y no pierdas ni un solo cliente por lentitud.\n\n📧 Incluye **correos corporativos profesionales** (ej. info@tunegocio.com) para que cada comunicación que envíes **transmita autoridad y confianza** desde el primer contacto.\n\n💬 **Botón de WhatsApp flotante** integrado: tus visitantes podrán contactarte en **un solo clic**, en cualquier momento, desde cualquier dispositivo. Más consultas = más ventas.\n\n✅ Construimos **5 secciones estratégicas** — Inicio, Nosotros, Servicios, Galería y Contacto — diseñadas con copywriting que **convierte visitantes en clientes reales**.\n\n📱 **Diseño 100% responsivo**: tu web se ve perfecta en celular, tablet y escritorio. En 2026, el **60% de las búsquedas** son desde el móvil — no puedes quedarte atrás.',
        comparePrice: '$149.99',
    },
    {
        id: 'landing-basica',
        title: 'Kit Landing Básica Pro',
        category: 'Landing Page',
        description: 'Una página diseñada para vender: alta conversión, carga rápida y CTAs que funcionan.',
        price: '$59.00',
        comparePrice: '$89.99',
        features: [
            'Sección Hero con CTA Impactante',
            'Sección de Beneficios y Prueba Social',
            'Formulario de Captura de Leads',
            'Carga en menos de 2 segundos',
            'Optimizada para Google Ads y Facebook Ads',
            'Diseño Responsivo Premium'
        ],
        type: 'digital',
        cta: 'Comprar',
        color: 'linear-gradient(135deg, #FF6B6B 0%, #556270 100%)',
        image: '/landing-hero.jpg',
        longDescription: '🎯 Una **Landing Page** no es un sitio web común — es una **máquina de conversión** diseñada con un único propósito: **convertir visitas en clientes, registros o contactos reales**. Si estás invirtiendo en publicidad (Google Ads, Facebook, Instagram) y no tienes una landing page optimizada, estás perdiendo dinero con cada clic.\n\n🚀 El **Kit Landing Básica Pro** está construido bajo los principios del **diseño persuasivo y el copywriting de alto impacto**. Cada sección está estratégicamente posicionada para guiar al visitante desde el primer vistazo hasta el instante en que presiona el botón de acción.\n\n📐 **¿Qué contiene tu Landing?**\nSección **Hero** con titular de impacto, subtítulo y botón CTA visible sin hacer scroll. Sección de **Beneficios Clave** que responde la pregunta "¿por qué elegirnos?". Bloque de **Testimonios o Prueba Social** para generar confianza inmediata. **Formulario de captura de leads** conectado a tu correo o CRM. Sección de **Preguntas Frecuentes** y un footer con tus datos de contacto y redes sociales.\n\n⚡ **Velocidad = Conversiones**: tu landing cargará en menos de **2 segundos**. Cada segundo extra de carga reduce conversiones hasta un **20%**. Código limpio y optimizado para que no pierdas ni un lead por lentitud.\n\n📊 **Perfecta para campañas de pago**: alineada con el mensaje de tu anuncio para maximizar el **Quality Score de Google Ads**, reducir tu costo por clic y aumentar tu retorno sobre inversión.\n\n💡 **Ideal para**: lanzamientos de productos, servicios profesionales, eventos, cursos online, consultorios, clínicas, restaurantes y cualquier negocio que quiera **generar leads de forma constante y predecible** sin depender solo del boca a boca.',
    },

    {
        id: 'web-pro',
        title: 'Kit Web Pro Business',
        category: 'Negocios',
        description: 'La solución web más completa del mercado: E-commerce, Blog, SEO Avanzado y Panel de Administración.',
        price: '$299.00',
        comparePrice: '$450.00',
        features: [
            '🛒 Tienda Online con carrito, pagos y gestión de pedidos — vende mientras duermes',
            '✍️ Blog integrado que atrae clientes gratis desde Google mes a mes',
            '🔍 SEO On-Page avanzado: metaetiquetas, Schema.org y mapa de sitio para el top de Google',
            '⚙️ Panel admin propio: edita precios, fotos y textos tú mismo sin pagar a nadie',
            '📧 Dominio + Hosting + Correos corporativos incluidos (ej. ventas@tuempresa.com)',
            '📲 Botones de WhatsApp, Instagram y redes integrados para cerrar ventas más rápido',
            '📋 Formularios inteligentes que capturan leads directo a tu correo o CRM',
            '⚡ Carga en menos de 2 seg + SSL incluido — más velocidad = más ventas y más seguridad'
        ],
        type: 'digital',
        cta: 'Comprar',
        highlight: true,
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        image: '/web-pro-v2.png',
        longDescription: '🏆 El **Kit Web Pro Business** no es un simple sitio web — es la **herramienta de negocio más completa** que puedes tener en internet. Diseñado para empresas, marcas y emprendedores serios que quieren **escalar, vender más y posicionarse como referentes** en su industria.\n\n🛒 **E-commerce integrado desde el primer día**: vende tus productos o servicios en línea con una tienda optimizada para conversión. Carrito de compras, pasarela de pagos, gestión de inventario y pedidos — todo incluido y listo para operar desde el primer día.\n\n✍️ **Blog profesional y estratégico**: el contenido es el rey del SEO. Con tu blog integrado podrás publicar artículos, guías y casos de éxito que posicionen tu marca y atraigan **tráfico orgánico gratuito** mes a mes, sin pagar por publicidad.\n\n🔍 **SEO Técnico Avanzado On-Page**: optimizamos cada página con las mejores prácticas: velocidad de carga, metaetiquetas, estructura de URLs, datos estructurados (Schema.org) y mapas de sitio para que Google te encuentre y te muestre al mundo. **Más visibilidad = más clientes**.\n\n⚙️ **Panel de Administración Total**: sin depender de nosotros para cada cambio. Actualizas textos, imágenes, productos y precios tú mismo desde un panel intuitivo y seguro. Control 100% en tus manos.\n\n📦 **Todo incluido, sin sorpresas**: Dominio personalizado + Hosting de alto rendimiento + Correos corporativos profesionales (ej. ventas@tuempresa.com) + Certificado SSL de seguridad. **Una inversión única que trabaja para ti 24/7**.\n\n🚀 Si un cliente pro no puede encontrarte en Google, no existe. Con el **Kit Web Pro Business** existes, vendes y escalas.',
    },

    {
        id: 'dashboard',
        title: 'Dashboard Pro Panel',
        category: 'Administración',
        description: 'Toma decisiones inteligentes con datos reales: panel de control visual, métricas en tiempo real y gestión total.',
        price: '$89.00',
        comparePrice: '$150.00',
        features: [
            '📊 Gráficos interactivos en tiempo real — visualiza tus KPIs de un vistazo',
            '📋 Tablas dinámicas con filtros, búsqueda y exportación a Excel o PDF',
            '🌙 Modo oscuro y claro nativo — trabaja cómodo en cualquier entorno',
            '🧩 Componentes modulares: activa o desactiva secciones según tu negocio',
            '🔐 Control de acceso por roles — cada usuario ve solo lo que debe ver',
            '📱 100% responsivo: gestiona tu negocio desde el celular en cualquier lugar',
            '⚡ Carga ultrarrápida — sin esperas, con datos siempre actualizados',
            '🔗 Integraciones con APIs externas, bases de datos y herramientas propias'
        ],
        type: 'digital',
        cta: 'Comprar',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        image: '/dashboard-v2.png',
        longDescription: '📊 ¿Tomas decisiones de negocio basándote en intuición o en **datos reales**? El **Dashboard Pro Panel** transforma la información compleja de tu empresa en **visualizaciones claras, métricas accionables y reportes al instante** — para que nunca más tomes una decisión a ciegas.\n\n🎯 **Gráficos interactivos en tiempo real**: ventas del día, semana o mes — visualiza tendencias, picos y caídas con gráficos de barras, líneas y donut. Todo actualizado automáticamente sin que tengas que hacer nada.\n\n📋 **Tablas de datos avanzadas**: filtra, ordena, busca y exporta tu información a Excel o PDF con un clic. Ya sea inventario, clientes, pedidos o empleados — toda tu data organizada y lista para usar.\n\n🔐 **Sistema de roles y permisos**: define qué puede ver y hacer cada miembro de tu equipo. El administrador lo ve todo, los operadores solo su área. **Orden, seguridad y privacidad** sin complicaciones.\n\n🧩 **Arquitectura modular**: tu negocio es único, tu panel también lo es. Activa o desactiva módulos según lo que necesites: inventario, CRM, facturación, analítica de marketing, soporte. **Crece sin límites**.\n\n📱 **Gestiona desde cualquier lugar**: diseño 100% responsivo que funciona perfecto en computador, tablet y celular. Revisa tus métricas del mes en el desayuno, aprueba pedidos desde el carro o revisa el stock desde el almacén.\n\n💡 Ideal para: **e-commerce, restaurantes, clínicas, agencias, logística, SaaS** o cualquier negocio que maneje datos y quiera tomar el control total de su operación.',
    },

    {
        id: 'whatsapp-automation',
        title: 'Automatización WhatsApp Pro',
        category: 'Herramientas',
        description: 'Vende y atiende clientes 24/7 sin contratar personal: bots inteligentes, flujos de venta y mensajes masivos.',
        price: '$89.00',
        comparePrice: '$139.00',
        features: [
            '🤖 Bot inteligente que responde dudas frecuentes automáticamente las 24 horas',
            '🔀 Flujos de venta personalizados que guían al cliente hasta el cierre',
            '📣 Mensajes masivos segmentados para campañas y promociones',
            '🔗 Integración con tu CRM para registrar y dar seguimiento a cada lead',
            '📊 Reportes de conversaciones, tasas de respuesta y conversión',
            '⚡ Respuesta instantánea — nunca más pierdas un cliente por no responder a tiempo',
            '🎯 Menú interactivo con botones y listas para una experiencia profesional',
            '🔒 100% compatible con WhatsApp Business API oficial'
        ],
        type: 'digital',
        cta: 'Comprar',
        color: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
        image: '/whatsapp-automation-v2.png',
        longDescription: '💬 ¿Cuántos clientes pierdes cada día porque no respondiste a tiempo en WhatsApp? Con la **Automatización WhatsApp Pro** tu negocio atiende, vende y hace seguimiento **las 24 horas del día, los 7 días de la semana** — sin que tengas que estar pegado al teléfono.\n\n🤖 **Bot de respuestas inteligente**: configura respuestas automáticas para las preguntas más frecuentes (precios, horarios, disponibilidad, cómo comprar). El bot responde al instante, tú te ahorras horas de trabajo repetitivo y el cliente recibe atención inmediata.\n\n🔀 **Flujos de venta guiados**: no dejes que el cliente se pierda. Diseña conversaciones paso a paso que lleven al prospecto desde el primer contacto hasta confirmar su compra o agendar una cita, de forma automática y como si fuera una conversación real.\n\n📣 **Mensajes masivos segmentados**: envía promociones, recordatorios y novedades a toda tu base de contactos en segundos. Segmenta por interés, etapa de compra o historial para que cada mensaje sea relevante y efectivo.\n\n🔗 **Integración con CRM**: cada conversación queda registrada. Seguimiento a leads, historial de contactos y alertas para que tu equipo retome justo donde lo dejó el bot. **Cero clientes perdidos, cero olvidos**.\n\n💡 Ideal para: **tiendas online, restaurantes, clínicas, salones de belleza, agencias, academias** — cualquier negocio que use WhatsApp para vender y quiera hacerlo de manera profesional y escalable.',
    },

    {
        id: 'custom-dev',
        title: 'Desarrollo a Medida Elite',
        category: 'Servicios',
        description: 'Software exclusivo diseñado para resolver los desafíos únicos de tu negocio.',
        price: '$499.00',
        comparePrice: '$750.00',
        features: [
            '🤝 Consultoría técnica profunda para definir el alcance real de tu proyecto',
            '🏗️ Arquitectura de software moderna, escalable y preparada para el futuro',
            '💻 Código limpio, documentado y optimizado para alto rendimiento',
            '🔌 Integración experta con APIs de terceros y herramientas de software propias',
            '🔐 Seguridad avanzada y protección de datos desde la raíz del proyecto',
            '📱 Desarrollo multiplataforma 100% responsivo y adaptativo',
            '📈 Panel de administración personalizado según tus necesidades operativas',
            '💎 Soporte técnico VIP y mantenimiento proactivo post-lanzamiento'
        ],
        type: 'service',
        cta: 'Cotizar Proyecto',
        color: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
        image: '/custom-dev-hero.png',
        longDescription: '🚀 ¿Tu negocio tiene procesos únicos que no encajan en soluciones estándar? El **Desarrollo a Medida Elite** no es una plantilla ni un sistema genérico — es la construcción de **software exclusivo** diseñado específicamente para ajustarse a tu flujo de trabajo, no al revés.\n\n🏗️ **Arquitectura construida para escalar**: no solo resolvemos el problema de hoy. Diseñamos sistemas con tecnologías de vanguardia (React, Next.js, Node.js) que permiten que tu software crezca al mismo ritmo que tu empresa, sin cuellos de botella técnicos.\n\n🤝 **De la idea a la realidad**: comenzamos con una fase de **consultoría técnica** donde analizamos tus necesidades, identificamos puntos de dolor y definimos una hoja de ruta clara. Te asesoramos sobre qué funcionalidades aportarán más valor inmediato a tu inversión.\n\n🔌 **Conectividad total**: ¿Usas herramientas como SAP, Salesforce, Stripe o sistemas de logística propios? Creamos puentes (APIs) para que toda tu infraestructura de software hable el mismo idioma y los datos fluyan sin errores manuales.\n\n💎 **Excelencia en cada línea de código**: nos enfocamos en el rendimiento, la accesibilidad y la experiencia de usuario. Entregamos un software que no solo funciona perfectamente, sino que es intuitivo para tus empleados y deslumbrante para tus clientes.\n\n🏆 **Tu ventaja competitiva**: en un mundo de soluciones genéricas, tener una **herramienta propietaria** te da el control total de tu data y tus procesos. Es un activo digital que aumenta el valor de tu empresa.\n\n💡 Ideal para: **plataformas SaaS, automatización industrial, sistemas de gestión interna, apps móviles exclusivas y startups de innovación**.',
    },

];
