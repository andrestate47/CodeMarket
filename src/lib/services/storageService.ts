import { supabase } from '@/lib/supabase';

export interface UploadResult {
    success: boolean;
    url: string;
    path?: string;
    error?: string;
}

export class StorageService {
    private static isSupabaseConfigured(): boolean {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        return Boolean(url && !url.includes('your-supabase-project') && !url.includes('placeholder'));
    }

    /**
     * Client-side Canvas Image Compressor
     */
    static async compressImage(file: File, maxSize: number = 800, quality: number = 0.8): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) resolve(blob);
                            else reject(new Error('Falló la compresión de imagen'));
                        },
                        'image/webp',
                        quality
                    );
                };
                img.onerror = () => reject(new Error('Error al procesar la imagen'));
                if (typeof event.target?.result === 'string') {
                    img.src = event.target.result;
                }
            };
            reader.onerror = () => reject(new Error('Error al leer archivo'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Upload Product Photo to Supabase Storage Bucket ('products')
     */
    static async uploadProductImage(file: File): Promise<UploadResult> {
        try {
            const compressedBlob = await this.compressImage(file, 800, 0.82);
            const fileExt = 'webp';
            const fileName = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            if (this.isSupabaseConfigured()) {
                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(filePath, compressedBlob, {
                        contentType: 'image/webp',
                        cacheControl: '360000',
                        upsert: true,
                    });

                if (!uploadError) {
                    const { data: publicUrlData } = supabase.storage
                        .from('products')
                        .getPublicUrl(filePath);

                    return {
                        success: true,
                        url: publicUrlData.publicUrl,
                        path: filePath,
                    };
                }
            }

            // Fallback for local demo environment: return compressed Data URL
            const base64Url = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(compressedBlob);
            });

            return {
                success: true,
                url: base64Url,
                path: filePath,
            };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al subir imagen';
            return {
                success: false,
                url: '',
                error: msg,
            };
        }
    }

    /**
     * Upload Payment Receipt (Yape/Plin/Transferencia) to Supabase Storage Bucket ('receipts')
     */
    static async uploadReceiptImage(file: File, orderId?: string): Promise<UploadResult> {
        try {
            const compressedBlob = await this.compressImage(file, 1000, 0.85);
            const fileExt = 'webp';
            const prefix = orderId ? `receipt-${orderId}` : `receipt-${Date.now()}`;
            const fileName = `${prefix}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
            const filePath = `receipts/${fileName}`;

            if (this.isSupabaseConfigured()) {
                const { error: uploadError } = await supabase.storage
                    .from('receipts')
                    .upload(filePath, compressedBlob, {
                        contentType: 'image/webp',
                        cacheControl: '360000',
                        upsert: true,
                    });

                if (!uploadError) {
                    const { data: publicUrlData } = supabase.storage
                        .from('receipts')
                        .getPublicUrl(filePath);

                    return {
                        success: true,
                        url: publicUrlData.publicUrl,
                        path: filePath,
                    };
                }
            }

            // Fallback for local demo environment
            const base64Url = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(compressedBlob);
            });

            return {
                success: true,
                url: base64Url,
                path: filePath,
            };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al subir comprobante';
            return {
                success: false,
                url: '',
                error: msg,
            };
        }
    }
}
