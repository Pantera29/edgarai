import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl() {
  if (process.env.NODE_ENV === 'production') {
    return '/edgarai'
  }
  return ''
}

/**
 * Normaliza un número de teléfono mexicano a formato internacional completo (52XXXXXXXXXX)
 * Maneja múltiples formatos de entrada y los convierte al formato estándar
 */
export function normalizePhoneNumber(phone: string): string {
  // 1. Remover todos los caracteres no numéricos
  let normalized = phone.replace(/[^0-9]/g, '');
  
  // 2. Si empieza con 52 y tiene 12 dígitos, está bien
  if (normalized.startsWith('52') && normalized.length === 12) {
    return normalized;
  }
  
  // 3. Si empieza con 52 y tiene más de 12 dígitos, tomar los últimos 12
  if (normalized.startsWith('52') && normalized.length > 12) {
    return normalized.slice(-12);
  }
  
  // 4. Si no empieza con 52 pero tiene 10 dígitos, agregar 52
  if (!normalized.startsWith('52') && normalized.length === 10) {
    return '52' + normalized;
  }
  
  // 5. Si no empieza con 52 pero tiene 11 dígitos, verificar si empieza con 1
  if (!normalized.startsWith('52') && normalized.length === 11 && normalized.startsWith('1')) {
    return '52' + normalized.slice(1);
  }
  
  // 6. Para cualquier otro caso, intentar extraer los últimos 10 dígitos y agregar 52
  if (normalized.length >= 10) {
    const last10 = normalized.slice(-10);
    return '52' + last10;
  }
  
  // 7. Si no se puede normalizar, devolver el original limpio
  return normalized;
}
