# Estado Actual de CodeMarket (Auditoría Inicial)

**Fecha:** 2026-08-02  
**Versión de Next.js:** 16.1.6 (Turbopack)  
**Versión de React:** 19.2.3  
**TypeScript:** 5.x  
**Estilos:** CSS Modules / Vanilla CSS / Tailwind (configurado)  
**Base de Datos / Backend:** Supabase (cliente básico en `src/lib/supabase.ts`, aún no conectado a tablas reales)  

---

## 1. Problemas Críticos y Riesgos de Seguridad Detectados

1. **Contraseñas Hardcodeadas:**
   - `src/app/admin/page.tsx` contiene `const ADMIN_PASSWORD = 'codemarket2026';`.
   - `src/app/admin/reviews/page.tsx` contiene `const ADMIN_PASSWORD = 'codemarket2026';`.
   - No existe integración de Supabase Auth para restringir las rutas `/admin`.

2. **Simulaciones Locales y `localStorage`:**
   - La creación de pedidos en `/checkout` guarda temporalmente datos en `localStorage.getItem('admin_orders')`.
   - Las notificaciones del admin se leen/escriben desde `localStorage.getItem('admin_notifications')`.
   - Las opiniones y solicitudes de productos pendientes leen/escriben desde `localStorage`.

3. **Archivos Duplicados (`- copia`):**
   - Existen 34 archivos duplicados con el sufijo `- copia` en raíz, `public`, `src/app`, `src/components`, `src/context` y `src/data` (ej. `package - copia.json`, `products - copia.ts`, `CheckoutModal - copia.tsx`).

4. **Errores de Linting:**
   - 21 errores y 10 advertencias reportados por ESLint (`react-hooks/set-state-in-effect`, `@typescript-eslint/no-explicit-any`, `react/no-unescaped-entities`, `@next/next/no-img-element`).

5. **Variables de Entorno y Claves:**
   - `.env.local` solo contiene valores placeholder (`your-supabase-project.supabase.co`).
   - No existe cliente Supabase SSR (`@supabase/ssr`) ni middleware de protección de rutas `/admin`.

---

## 2. Componentes y Estructura Actual

- **Tienda Pública:**
  - `/` (Home con Hero, Banners, Catálogo Destacado, Testimonios)
  - `/productos` (Listado de productos)
  - `/productos/[id]` (Detalle de producto)
  - `/checkout` (Checkout con datos simulados)
  - `/login` (Formulario de login simulado)

- **Panel Administrativo (Inseguro):**
  - `/admin` (Dashboard admin simulado con contraseña estática)
  - `/admin/reviews` (Moderación simulada de opiniones)

- **Datos Hardcodeados:**
  - `src/data/products.ts` actúa como la fuente de verdad del catálogo estático.

---

## 3. Próximos Pasos (Acción Inmediata)
1. Eliminar archivos duplicados `- copia`.
2. Crear esquema de base de datos Supabase con RLS y soporte `store_id` (tienda única inicial CodeMarket).
3. Integrar `@supabase/ssr` y autenticación real para Administrador.
4. Conectar catálogo, carrito, checkout y pedidos a Supabase PostgreSQL.
5. Proteger `/admin` vía Middleware y servidor.
