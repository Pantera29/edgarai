/**
 * Utilidades para Supabase Storage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const STORAGE_BUCKET = 'whatsapp-media';

/**
 * Crea y retorna un cliente de Supabase con service role key
 * Esto permite operaciones de Storage sin restricciones de RLS durante desarrollo
 */
export function getServiceRoleClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL o Service Role Key no configurados en variables de entorno');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Genera un path de storage estructurado
 * Formato: {dealership_id}/{year}/{month}/{timestamp}-{uuid}.jpg
 * Ejemplo: abc-123/2025/10/1729468800000-a1b2c3d4-e5f6.jpg
 */
export function generateStoragePath(dealership_id: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();

  return `${dealership_id}/${year}/${month}/${timestamp}-${uuid}.jpg`;
}

/**
 * Sube un archivo al bucket de Supabase Storage y retorna la URL pública
 */
export async function uploadToStorage(
  file: Buffer,
  path: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const supabase = getServiceRoleClient();

  console.log('📤 [Storage] Subiendo archivo:', {
    bucket: STORAGE_BUCKET,
    path: path,
    size: file.length,
    contentType
  });

  // Subir archivo a Storage
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('❌ [Storage] Error al subir archivo:', error);
    throw new Error(`Error al subir archivo a Storage: ${error.message}`);
  }

  console.log('✅ [Storage] Archivo subido exitosamente:', data.path);

  // Obtener URL pública
  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  if (!publicUrlData.publicUrl) {
    throw new Error('No se pudo obtener la URL pública del archivo');
  }

  console.log('🔗 [Storage] URL pública generada:', publicUrlData.publicUrl);

  return publicUrlData.publicUrl;
}

/**
 * Elimina un archivo del Storage (útil para limpieza en caso de error)
 */
export async function deleteFromStorage(path: string): Promise<void> {
  const supabase = getServiceRoleClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    console.error('❌ [Storage] Error al eliminar archivo:', error);
    throw new Error(`Error al eliminar archivo de Storage: ${error.message}`);
  }

  console.log('🗑️ [Storage] Archivo eliminado:', path);
}

