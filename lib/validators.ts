/**
 * Validadores para archivos de imagen y números de teléfono
 */

const VALID_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes (límite de WhatsApp)

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

/**
 * Valida que el MIME type sea de imagen permitida
 */
export function isValidMimeType(mimetype: string): boolean {
  return VALID_MIME_TYPES.includes(mimetype.toLowerCase());
}

/**
 * Valida un archivo de imagen (tipo MIME y tamaño)
 */
export function validateImageFile(
  file: File | { type: string; size: number }
): ValidationResult {
  // Validar que el tipo MIME sea correcto
  if (!isValidMimeType(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Solo se aceptan: ${VALID_MIME_TYPES.join(', ')}`,
      code: 'INVALID_FILE_TYPE'
    };
  }

  // Validar tamaño máximo (5MB)
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Máximo: 5MB. Tamaño recibido: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      code: 'FILE_TOO_LARGE'
    };
  }

  return { valid: true };
}

/**
 * Valida formato de número de teléfono
 * Acepta números con o sin + al inicio, entre 8 y 15 dígitos
 * Ejemplos válidos: +56961567267, 56961567267, 5215512345678
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?\d{8,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Valida el buffer de imagen para asegurar que no está vacío
 */
export function validateImageBuffer(buffer: Buffer): boolean {
  return buffer && buffer.length > 0;
}

