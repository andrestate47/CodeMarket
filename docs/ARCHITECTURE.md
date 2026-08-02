# Arquitectura de CodeMarket

## Visión General
CodeMarket está construido como un **monolito modular** en **Next.js 16 (App Router)** con TypeScript, Tailwind / CSS y **Supabase** (PostgreSQL + Auth + Storage).

Actualmente opera como **una sola tienda (CodeMarket)** para un solo administrador principal. No obstante, la base de datos incluye la abstracción `store_id` desde el día 1 para evitar refactorizaciones complejas cuando la plataforma evolucione hacia multi-tienda SaaS.

---

## Estructura Modular Propuesta

```text
src/
  app/                      # Next.js App Router (Rutas de la app)
    (public)/               # Rutas públicas (Home, Productos, Checkout)
    admin/                  # Panel Administrativo protegido
    api/                    # Route Handlers para webhooks o operaciones seguras
  components/               # Componentes de UI (Navbar, Footer, Modales, Cards)
  modules/                  # Módulos de dominio desacoplados
    auth/                   # Lógica de sesión, roles y protección
    catalog/                # Productos, categorías, variantes, imágenes
    cart/                   # Gestión de carrito (localStorage sync con DB)
    checkout/               # Procesamiento de pedidos transaccionales
    orders/                 # Historial y cambio de estados de pedidos
    customers/              # Clientes y direcciones
    inventory/              # Movimientos y control de stock
    admin/                  # Métricas y componentes exclusivos del panel
  lib/                      # Clientes de servicios e infraestructura
    supabase/               # Clientes Supabase (Browser, Server, Action, ServiceRole)
    auth/                   # Helpers de verificación de permisos en server
    validations/            # Schemas Zod para validar inputs
    money/                  # Conversión y formateo monetario (centavos)
  types/                    # Definiciones de TypeScript e interfaces de base de datos
```

---

## Flujo de Datos y Transacciones

1. **Cliente / Navegador:**
   - Visualización de catálogo y categorías leídas directamente de Supabase (o mediante Server Components revalidados).
   - El carrito guarda referencias ligeras (`product_id`, `variant_id`, `quantity`) en `localStorage`.

2. **Checkout & Creación de Pedido:**
   - La orden se procesa mediante una **Server Action / Route Handler** de Next.js.
   - El servidor recalcula en base de datos los precios oficiales, disponibilidad de stock y subtotal/total real.
   - Se crea el cliente (o asocia si está autenticado), el pedido (`orders`), los ítems (`order_items`) y se descuenta inventario (`inventory_movements`) en una sola transacción segura.
   - El pedido se inicializa siempre en `payment_status = 'pending'` y `fulfillment_status = 'unfulfilled'`.

3. **Panel Administrativo:**
   - Protegido por Middleware de Next.js y verificación de rol `admin` en Server Components / Server Actions.
   - Gestión de productos, categorías, imágenes (Supabase Storage) y actualización de estado de pedidos.
