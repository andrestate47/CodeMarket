# Roadmap de Desarrollo - CodeMarket

## Fase 1: Ecommerce Real y Listo para Vender (Etapa Actual)
- [x] Auditoría inicial y documentación de estado.
- [ ] Limpieza de archivos duplicados (`- copia`) y corrección de lint.
- [ ] Creación de migraciones SQL en Supabase (`stores`, `products`, `orders`, RLS, etc.).
- [ ] Autenticación de Administrador con Supabase Auth y Middleware.
- [ ] Migración del catálogo hardcodeado a Supabase PostgreSQL.
- [ ] CRUD completo de productos y categorías en `/admin`.
- [ ] Subida de imágenes a Supabase Storage.
- [ ] Checkout real con métodos de pago manuales (Yape/Plin/Transferencia).
- [ ] Gestión de pedidos e inventario en panel administrativo.
- [ ] Dashboard del cliente para consultar historial de pedidos.
- [ ] Pruebas unitarias e integración de flujos principales.
- [ ] Despliegue en Vercel.

---

## Fase 2: Optimización y Mejoras de Tienda
- Pasarela de pago automatizada (MercadoPago / Niubiz / Stripe).
- Integración de envíos y cálculo de delivery.
- Cupones y códigos de descuento.
- Correos transaccionales (Resend / SendGrid).
- Recuperación de carritos abandonados.
- Descargas digitales seguras.

---

## Fase 3: Herramientas Comerciales
- CRM integrado para gestión de clientes y leads.
- Integración oficial con WhatsApp Cloud API.
- Agente de ventas e IA conversacional.

---

## Fase 4: Conversión a Plataforma Multi-Tienda SaaS
- Habilitación de registro público de comerciantes.
- Creación automatizada de tiendas secundarias (aprovechando `store_id`).
- Dominios personalizados por comerciante.
- Planes de suscripción y facturación del SaaS.
