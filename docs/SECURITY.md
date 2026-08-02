# Modelo de Seguridad y Buenas Prácticas - CodeMarket

## 1. Autenticación y Autorización

- **Supabase Auth:** Autenticación oficial basada en correo/contraseña o Magic Links.
- **Roles:** Definidos en `profiles.role` (`admin` | `customer`).
- **Verificación en Servidor:** Las rutas `/admin` y Server Actions administrativas comprueban estrictamente `profiles.role === 'admin'`. Ocultar botones en la UI es secundario.
- **Eliminación de Contraseñas Hardcodeadas:** Ninguna clave maestra o contraseña estática en código frontend.

---

## 2. Protección de Datos Financieros y Checkout

- **Cero Manejo Directo de Tarjetas:** CodeMarket no solicita ni almacena números de tarjeta, CVC o fechas de expiración.
- **Métodos de Pago Manuales:** Yape, Plin, Transferencia bancaria, Pago contra entrega.
- **Estados Reales de Pago:** Todo pedido nuevo inicia en `payment_status = 'pending'` y `fulfillment_status = 'unfulfilled'`. Se eliminan mensajes engañosos ("Pago aprobado", "Pago 100% seguro").

---

## 3. Seguridad en Capa de Servidor (Server-Side Enforcement)

- **Variables Sensibles:** `SUPABASE_SERVICE_ROLE_KEY` permanece únicamente en entorno de servidor y jamás se expone en código `"use client"`.
- **Cálculo de Precios e Inventario:** El precio, subtotal y total final de cualquier orden se recalculan obligatoriamente en el servidor en el momento de crear el pedido. El cliente jamás puede modificar el precio final o enviar pedidos marcados como 'paid'.
- **Row Level Security (RLS):** RLS habilitado en todas las tablas de Supabase para evitar accesos no autorizados mediante cliente anónimo.
