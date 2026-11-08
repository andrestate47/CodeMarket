'use client';

import { supabase } from '@/lib/supabase';
import { StorageService } from '@/lib/services/storageService';
import { uploadProductImageAction } from '@/modules/products/actions';

/** Access token de la sesión actual (para enviarlo a las server actions de admin). */
export async function getAccessToken(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    return token;
}

/** Comprime la imagen en el navegador (WebP, máx. 1000px) y la sube a Supabase Storage. */
export async function uploadProductImage(file: File): Promise<string> {
    const token = await getAccessToken();
    const blob = await StorageService.compressImage(file, 1000, 0.85);
    const formData = new FormData();
    formData.append('file', new File([blob], 'image.webp', { type: 'image/webp' }));
    const res = await uploadProductImageAction(token, formData);
    if (!res.success) throw new Error(res.error);
    return res.data;
}
