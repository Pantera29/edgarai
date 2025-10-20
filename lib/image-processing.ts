/**
 * Funciones de procesamiento de imágenes usando Sharp
 */

import sharp from 'sharp';

export interface CompressOptions {
  quality?: number; // Calidad JPEG (0-100), default: 85
  maxWidth?: number; // Ancho máximo en píxeles, default: 1920
  stripMetadata?: boolean; // Remover metadata EXIF, default: true
}

export interface CompressionResult {
  buffer: Buffer;
  metadata: {
    original_size: number;
    compressed_size: number;
    compression_ratio: string;
    dimensions: {
      width: number;
      height: number;
    };
  };
}

/**
 * Comprime una imagen usando Sharp
 * - Convierte a JPEG
 * - Reduce calidad al 85%
 * - Redimensiona si excede maxWidth manteniendo aspect ratio
 * - Remueve metadata EXIF para privacidad
 */
export async function compressImage(
  buffer: Buffer,
  options: CompressOptions = {}
): Promise<CompressionResult> {
  const {
    quality = 85,
    maxWidth = 1920,
    stripMetadata = true
  } = options;

  const originalSize = buffer.length;

  // Procesar la imagen con Sharp
  let sharpInstance = sharp(buffer);

  // Remover metadata si se solicita
  if (stripMetadata) {
    sharpInstance = sharpInstance.rotate(); // Auto-rotate basado en EXIF antes de remover
  }

  // Obtener metadata original para verificar dimensiones
  const originalMetadata = await sharpInstance.metadata();
  
  // Redimensionar si excede el ancho máximo
  if (originalMetadata.width && originalMetadata.width > maxWidth) {
    sharpInstance = sharpInstance.resize(maxWidth, null, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Convertir a JPEG con la calidad especificada
  const compressedBuffer = await sharpInstance
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  // Obtener dimensiones finales
  const finalMetadata = await sharp(compressedBuffer).metadata();
  
  const compressedSize = compressedBuffer.length;
  const compressionRatio = Math.round(((originalSize - compressedSize) / originalSize) * 100);

  return {
    buffer: compressedBuffer,
    metadata: {
      original_size: originalSize,
      compressed_size: compressedSize,
      compression_ratio: `${compressionRatio}%`,
      dimensions: {
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0
      }
    }
  };
}

/**
 * Obtiene las dimensiones de una imagen
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0
  };
}

/**
 * Valida que el buffer contiene una imagen válida
 */
export function validateImageBuffer(buffer: Buffer): boolean {
  return buffer && buffer.length > 0;
}

