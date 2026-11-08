import { createAdminClient } from '@/lib/supabase/admin';

export interface AdminIdentity {
    id: string;
    email: string;
    name: string;
}

/**
 * Lista blanca de administradores (variable de entorno ADMIN_EMAILS, separada por comas).
 *
 * IMPORTANTE: No confiamos en `user_metadata.role` ni en `profiles.role`, porque
 * cualquier persona puede enviar `role: 'admin'` en sus metadatos al registrarse
 * (y el trigger handle_new_user lo copia a profiles).
 */
function getAdminEmails(): string[] {
    return (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
}

/**
 * Verifica en el servidor que el access token pertenece a un administrador.
 * Devuelve la identidad del admin o null si no está autorizado.
 */
export async function verifyAdminToken(accessToken: string | null | undefined): Promise<AdminIdentity | null> {
    if (!accessToken) return null;

    const adminEmails = getAdminEmails();
    if (adminEmails.length === 0) {
        console.error('[auth] ADMIN_EMAILS no está configurado: se deniega el acceso al panel.');
        return null;
    }

    try {
        const adminClient = createAdminClient();
        const { data, error } = await adminClient.auth.getUser(accessToken);
        const user = data?.user;
        if (error || !user?.email) return null;

        const email = user.email.toLowerCase();
        if (!adminEmails.includes(email)) return null;

        return {
            id: user.id,
            email,
            name: (user.user_metadata?.full_name as string) || 'Administrador',
        };
    } catch {
        return null;
    }
}

/**
 * Igual que verifyAdminToken pero lanza error si no es admin.
 * Úsalo al inicio de toda server action que modifique datos.
 */
export async function requireAdmin(accessToken: string | null | undefined): Promise<AdminIdentity> {
    const admin = await verifyAdminToken(accessToken);
    if (!admin) {
        throw new Error('No autorizado: solo el administrador puede realizar esta acción.');
    }
    return admin;
}
