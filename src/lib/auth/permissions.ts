export type UserRole =
    | 'super_admin'
    | 'admin'
    | 'manager'
    | 'vendedor'
    | 'inventario'
    | 'soporte'
    | 'customer';

export interface UserPermissions {
    can_manage_orders: boolean;
    can_manage_products: boolean;
    can_manage_inventory: boolean;
    can_manage_discounts: boolean;
    can_manage_customers: boolean;
    can_view_reports: boolean;
    can_manage_settings: boolean;
    can_manage_users: boolean;
    can_manage_appearance: boolean;
}

export const ROLE_LABELS: Record<UserRole, { label: string; color: string; badge: string; description: string }> = {
    super_admin: {
        label: 'Super Admin',
        color: '#8b5cf6',
        badge: '⚡ Super Admin',
        description: 'Acceso total y sin restricciones a todos los módulos y gestión de equipo.',
    },
    admin: {
        label: 'Administrador',
        color: '#f97316',
        badge: '👑 Admin',
        description: 'Gestión completa de tienda, productos, pedidos, finanzas y usuarios.',
    },
    manager: {
        label: 'Gerente / Manager',
        color: '#3b82f6',
        badge: '👔 Gerente',
        description: 'Gestión comercial de ventas, catálogo, inventario, clientes y reportes.',
    },
    vendedor: {
        label: 'Vendedor / Comercial',
        color: '#10b981',
        badge: '🛍️ Vendedor',
        description: 'Creación y atención de pedidos, atención a clientes y seguimiento.',
    },
    inventario: {
        label: 'Gestor de Inventario',
        color: '#ec4899',
        badge: '📦 Inventario',
        description: 'Control de stock, actualización de productos y recepción de mercancía.',
    },
    soporte: {
        label: 'Soporte Técnico',
        color: '#06b6d4',
        badge: '🎧 Soporte',
        description: 'Atención a consultas de clientes y verificación de estados de pedidos.',
    },
    customer: {
        label: 'Cliente Comprador',
        color: '#6b7280',
        badge: '👤 Cliente',
        description: 'Usuario comprador registrado sin acceso al panel de administración.',
    },
};

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
    super_admin: {
        can_manage_orders: true,
        can_manage_products: true,
        can_manage_inventory: true,
        can_manage_discounts: true,
        can_manage_customers: true,
        can_view_reports: true,
        can_manage_settings: true,
        can_manage_users: true,
        can_manage_appearance: true,
    },
    admin: {
        can_manage_orders: true,
        can_manage_products: true,
        can_manage_inventory: true,
        can_manage_discounts: true,
        can_manage_customers: true,
        can_view_reports: true,
        can_manage_settings: true,
        can_manage_users: true,
        can_manage_appearance: true,
    },
    manager: {
        can_manage_orders: true,
        can_manage_products: true,
        can_manage_inventory: true,
        can_manage_discounts: true,
        can_manage_customers: true,
        can_view_reports: true,
        can_manage_settings: false,
        can_manage_users: false,
        can_manage_appearance: false,
    },
    vendedor: {
        can_manage_orders: true,
        can_manage_products: false,
        can_manage_inventory: false,
        can_manage_discounts: false,
        can_manage_customers: true,
        can_view_reports: false,
        can_manage_settings: false,
        can_manage_users: false,
        can_manage_appearance: false,
    },
    inventario: {
        can_manage_orders: false,
        can_manage_products: true,
        can_manage_inventory: true,
        can_manage_discounts: false,
        can_manage_customers: false,
        can_view_reports: false,
        can_manage_settings: false,
        can_manage_users: false,
        can_manage_appearance: false,
    },
    soporte: {
        can_manage_orders: true,
        can_manage_products: false,
        can_manage_inventory: false,
        can_manage_discounts: false,
        can_manage_customers: true,
        can_view_reports: false,
        can_manage_settings: false,
        can_manage_users: false,
        can_manage_appearance: false,
    },
    customer: {
        can_manage_orders: false,
        can_manage_products: false,
        can_manage_inventory: false,
        can_manage_discounts: false,
        can_manage_customers: false,
        can_view_reports: false,
        can_manage_settings: false,
        can_manage_users: false,
        can_manage_appearance: false,
    },
};

export const PERMISSION_DESCRIPTIONS: Record<keyof UserPermissions, { label: string; icon: string; group: string }> = {
    can_manage_orders: { label: 'Gestión de Pedidos y Ventas', icon: '📦', group: 'Ventas y Operaciones' },
    can_manage_products: { label: 'Catálogo de Productos y Precios', icon: '🏷️', group: 'Catálogo' },
    can_manage_inventory: { label: 'Control de Inventario y Stock', icon: '🏬', group: 'Catálogo' },
    can_manage_discounts: { label: 'Creación de Cupones y Descuentos', icon: '🎟️', group: 'Promociones' },
    can_manage_customers: { label: 'Gestión de Clientes', icon: '👥', group: 'Ventas y Operaciones' },
    can_view_reports: { label: 'Acceso a Reportes y Métricas', icon: '📈', group: 'Finanzas' },
    can_manage_appearance: { label: 'Personalización de Apariencia Web', icon: '🎨', group: 'Configuración' },
    can_manage_settings: { label: 'Ajustes Generales y Pagos', icon: '⚙️', group: 'Configuración' },
    can_manage_users: { label: 'Gestión de Usuarios y Permisos', icon: '🔐', group: 'Seguridad' },
};

/**
 * Check if a role has access to the admin panel
 */
export function hasAdminPanelAccess(role: string | null | undefined): boolean {
    if (!role) return false;
    const staffRoles = ['super_admin', 'admin', 'manager', 'vendedor', 'inventario', 'soporte'];
    return staffRoles.includes(role.toLowerCase());
}

/**
 * Calculate full resolved permissions for a user profile
 */
export function getUserPermissions(
    role: string | null | undefined,
    customPermissions?: Partial<UserPermissions> | null
): UserPermissions {
    const validRole = (role?.toLowerCase() as UserRole) || 'customer';
    const basePermissions = DEFAULT_ROLE_PERMISSIONS[validRole] || DEFAULT_ROLE_PERMISSIONS.customer;

    if (!customPermissions) return basePermissions;

    return {
        ...basePermissions,
        ...customPermissions,
    };
}
