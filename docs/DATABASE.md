# Esquema de Base de Datos - CodeMarket

## Tablas Principales

### 1. `stores`
- `id` (uuid, primary key)
- `name` (text, default 'CodeMarket')
- `slug` (text, unique, default 'codemarket')
- `description` (text)
- `logo_url` (text)
- `email` (text)
- `phone` (text)
- `whatsapp_phone` (text)
- `country_code` (text, default 'PE')
- `currency` (text, default 'PEN')
- `status` (text, default 'active')
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2. `profiles`
- `id` (uuid, references auth.users)
- `full_name` (text)
- `email` (text)
- `phone` (text)
- `avatar_url` (text)
- `role` (text, default 'customer') -- 'admin' | 'customer'
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3. `categories`
- `id` (uuid, primary key)
- `store_id` (uuid, references stores.id)
- `name` (text)
- `slug` (text)
- `description` (text)
- `sort_order` (int, default 0)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 4. `products`
- `id` (uuid, primary key)
- `store_id` (uuid, references stores.id)
- `category_id` (uuid, references categories.id)
- `name` (text)
- `slug` (text)
- `short_description` (text)
- `description` (text)
- `product_type` (text) -- 'digital' | 'service' | 'physical'
- `status` (text, default 'active') -- 'draft' | 'active' | 'archived'
- `price_amount` (bigint) -- En unidades mínimas enteras (centavos)
- `compare_at_amount` (bigint)
- `currency` (text, default 'PEN')
- `sku` (text)
- `track_inventory` (boolean, default false)
- `stock_quantity` (int, default 0)
- `featured` (boolean, default false)
- `metadata` (jsonb)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 5. `product_variants`
- `id` (uuid, primary key)
- `store_id` (uuid, references stores.id)
- `product_id` (uuid, references products.id)
- `name` (text)
- `sku` (text)
- `price_amount` (bigint)
- `stock_quantity` (int, default 0)
- `attributes` (jsonb)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 6. `product_images`
- `id` (uuid, primary key)
- `store_id` (uuid, references stores.id)
- `product_id` (uuid, references products.id)
- `storage_path` (text)
- `alt_text` (text)
- `sort_order` (int, default 0)
- `is_primary` (boolean, default false)
- `created_at` (timestamptz)

### 7. `customers`
- `id` (uuid, primary key)
- `store_id` (uuid, references stores.id)
- `auth_user_id` (uuid, references auth.users, nullable)
- `name` (text)
- `email` (text)
- `phone` (text)
- `document_type` (text)
- `document_number` (text)
- `notes` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 8. `customer_addresses`
- `id` (uuid, primary key)
- `customer_id` (uuid, references customers.id)
- `label` (text)
- `recipient_name` (text)
- `phone` (text)
- `country` (text)
- `department` (text)
- `province` (text)
- `district` (text)
- `address_line` (text)
- `reference` (text)
- `postal_code` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 9. `orders`
- `id` (uuid, primary key)
- `store_id` (uuid, references stores.id)
- `customer_id` (uuid, references customers.id)
- `order_number` (text, unique)
- `customer_name` (text)
- `customer_email` (text)
- `customer_phone` (text)
- `currency` (text, default 'PEN')
- `subtotal_amount` (bigint)
- `discount_amount` (bigint, default 0)
- `shipping_amount` (bigint, default 0)
- `total_amount` (bigint)
- `payment_method` (text) -- 'yape' | 'plin' | 'bank_transfer' | 'cash_on_delivery' | 'quote_request'
- `payment_status` (text, default 'pending') -- 'pending' | 'under_review' | 'paid' | 'failed' | 'refunded'
- `fulfillment_status` (text, default 'unfulfilled') -- 'unfulfilled' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
- `customer_notes` (text)
- `internal_notes` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 10. `order_items`
- `id` (uuid, primary key)
- `store_id` (uuid, references stores.id)
- `order_id` (uuid, references orders.id)
- `product_id` (uuid, references products.id)
- `variant_id` (uuid, references product_variants.id, nullable)
- `product_name` (text)
- `variant_name` (text)
- `sku` (text)
- `unit_price_amount` (bigint)
- `quantity` (int)
- `total_amount` (bigint)
- `created_at` (timestamptz)

### 11. `order_status_history`
- `id` (uuid, primary key)
- `store_id` (uuid, references stores.id)
- `order_id` (uuid, references orders.id)
- `status_type` (text) -- 'payment' | 'fulfillment'
- `previous_status` (text)
- `new_status` (text)
- `changed_by` (uuid, references auth.users)
- `notes` (text)
- `created_at` (timestamptz)

### 12. `inventory_movements`
- `id` (uuid, primary key)
- `store_id` (uuid, references stores.id)
- `product_id` (uuid, references products.id)
- `variant_id` (uuid, references product_variants.id, nullable)
- `movement_type` (text) -- 'initial' | 'manual_adjustment' | 'sale' | 'cancellation' | 'refund' | 'restock'
- `quantity` (int)
- `reference_type` (text)
- `reference_id` (uuid)
- `notes` (text)
- `created_by` (uuid, references auth.users, nullable)
- `created_at` (timestamptz)

### 13. `payment_settings`
- `id` (uuid, primary key)
- `store_id` (uuid, references stores.id)
- `method` (text) -- 'yape' | 'plin' | 'bank_transfer' | 'cash_on_delivery' | 'quote_request' | 'external_payment_link'
- `display_name` (text)
- `instructions` (text)
- `account_holder` (text)
- `account_identifier` (text)
- `qr_image_path` (text)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 14. `store_settings`
- `id` (uuid, primary key)
- `store_id` (uuid, references stores.id)
- `support_email` (text)
- `support_phone` (text)
- `whatsapp_phone` (text)
- `order_prefix` (text, default 'CM-')
- `low_stock_threshold` (int, default 5)
- `allow_guest_checkout` (boolean, default true)
- `require_customer_account` (boolean, default false)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

---

## Políticas RLS (Row Level Security)

1. **Lectura Pública:**
   - `stores`, `categories` (activas), `products` (activos), `product_variants` (activos), `product_images`, `payment_settings` (activos).
2. **Acceso de Clientes:**
   - `customers` y `orders` legibles únicamente por el usuario autenticado propietario (`auth_user_id = auth.uid()`).
3. **Acceso Administrativo:**
   - Usuarios con `profiles.role = 'admin'` tienen acceso total (SELECT, INSERT, UPDATE, DELETE) en todas las tablas del `store_id` de CodeMarket.
4. **Inserción de Pedidos:**
   - Mediante Server Actions / RPC con Service Role o políticas seguras de inserción validada por servidor.
