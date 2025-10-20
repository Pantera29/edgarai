/**
 * POST /api/whatsapp/upload-image
 * 
 * Endpoint para subir imágenes a Supabase Storage con compresión automática
 * Las imágenes se comprimen, validan y suben al bucket whatsapp-media
 * 
 * Requiere autenticación JWT
 */

import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/jwt/token';
import { validateImageFile, validatePhoneNumber } from '@/lib/validators';
import { compressImage } from '@/lib/image-processing';
import { generateStoragePath, uploadToStorage } from '@/lib/storage-utils';

export async function POST(request: Request) {
  console.log('🔄 [ImageUpload] Iniciando proceso de upload de imagen');

  try {
    // 1. AUTENTICACIÓN JWT
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [ImageUpload] Header de autorización no encontrado o inválido');
      return NextResponse.json(
        {
          success: false,
          error: 'Token de autorización requerido',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let userInfo: any;

    try {
      userInfo = verifyToken(token);
      
      if (!userInfo || !userInfo.dealership_id) {
        console.log('❌ [ImageUpload] Token no contiene dealership_id');
        return NextResponse.json(
          {
            success: false,
            error: 'Token inválido o sin información de dealership',
            code: 'UNAUTHORIZED'
          },
          { status: 401 }
        );
      }

      console.log('✅ [ImageUpload] Usuario autenticado:', {
        dealership_id: userInfo.dealership_id,
        user_id: userInfo.id
      });
    } catch (error) {
      console.error('❌ [ImageUpload] Error al verificar token:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Token inválido',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    // 2. PARSEAR FORMDATA
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('❌ [ImageUpload] Error al parsear FormData:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al procesar los datos del formulario',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    const chat_id = formData.get('chat_id') as string | null;
    const dealership_id_body = formData.get('dealership_id') as string | null;
    const caption = formData.get('caption') as string | null;

    console.log('📋 [ImageUpload] Datos recibidos:', {
      has_file: !!file,
      chat_id,
      dealership_id_body,
      has_caption: !!caption
    });

    // 3. VALIDAR ARCHIVO
    if (!file) {
      console.log('❌ [ImageUpload] Archivo no proporcionado');
      return NextResponse.json(
        {
          success: false,
          error: 'Archivo de imagen requerido',
          code: 'MISSING_FILE'
        },
        { status: 400 }
      );
    }

    console.log('📁 [ImageUpload] Archivo recibido:', {
      name: file.name,
      type: file.type,
      size: file.size,
      size_mb: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    // Validar tipo y tamaño del archivo
    const fileValidation = validateImageFile(file);
    if (!fileValidation.valid) {
      console.log('❌ [ImageUpload] Validación de archivo falló:', fileValidation.error);
      
      const statusCode = fileValidation.code === 'FILE_TOO_LARGE' ? 413 : 400;
      
      return NextResponse.json(
        {
          success: false,
          error: fileValidation.error,
          code: fileValidation.code
        },
        { status: statusCode }
      );
    }

    console.log('✅ [ImageUpload] Validación de archivo exitosa');

    // 4. VALIDAR CHAT_ID (número de teléfono)
    if (!chat_id) {
      console.log('❌ [ImageUpload] chat_id no proporcionado');
      return NextResponse.json(
        {
          success: false,
          error: 'chat_id (número de teléfono) requerido',
          code: 'MISSING_CHAT_ID'
        },
        { status: 400 }
      );
    }

    if (!validatePhoneNumber(chat_id)) {
      console.log('❌ [ImageUpload] Formato de chat_id inválido:', chat_id);
      return NextResponse.json(
        {
          success: false,
          error: 'Formato de chat_id inválido. Debe ser un número de teléfono válido (8-15 dígitos)',
          code: 'INVALID_PHONE_NUMBER'
        },
        { status: 400 }
      );
    }

    console.log('✅ [ImageUpload] chat_id validado:', chat_id);

    // 5. VALIDAR DEALERSHIP_ID (si viene en body, debe coincidir con el token)
    const dealership_id = userInfo.dealership_id;

    if (dealership_id_body && dealership_id_body !== dealership_id) {
      console.log('❌ [ImageUpload] dealership_id del body no coincide con el del token:', {
        token_dealership: dealership_id,
        body_dealership: dealership_id_body
      });
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes permiso para subir imágenes a este dealership',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    // 6. CONVERTIR ARCHIVO A BUFFER
    let fileBuffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      console.log('✅ [ImageUpload] Archivo convertido a buffer:', fileBuffer.length, 'bytes');
    } catch (error) {
      console.error('❌ [ImageUpload] Error al convertir archivo a buffer:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al procesar el archivo',
          code: 'FILE_PROCESSING_ERROR'
        },
        { status: 500 }
      );
    }

    // 7. COMPRIMIR IMAGEN
    console.log('🗜️ [ImageUpload] Comprimiendo imagen...');
    let compressionResult;
    
    try {
      compressionResult = await compressImage(fileBuffer);
      
      console.log('✅ [ImageUpload] Compresión exitosa:', {
        original: compressionResult.metadata.original_size,
        compressed: compressionResult.metadata.compressed_size,
        ratio: compressionResult.metadata.compression_ratio,
        dimensions: compressionResult.metadata.dimensions
      });
    } catch (error) {
      console.error('❌ [ImageUpload] Error al comprimir imagen:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al comprimir la imagen',
          code: 'COMPRESSION_FAILED'
        },
        { status: 500 }
      );
    }

    // 8. GENERAR PATH DE STORAGE
    const storagePath = generateStoragePath(dealership_id);
    console.log('📂 [ImageUpload] Path de storage generado:', storagePath);

    // 9. SUBIR A SUPABASE STORAGE
    console.log('📤 [ImageUpload] Subiendo a Supabase Storage...');
    let mediaUrl: string;
    
    try {
      mediaUrl = await uploadToStorage(
        compressionResult.buffer,
        storagePath,
        'image/jpeg'
      );
      
      console.log('✅ [ImageUpload] Upload exitoso:', mediaUrl);
    } catch (error) {
      console.error('❌ [ImageUpload] Error al subir a Storage:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Error al subir imagen a Storage',
          code: 'UPLOAD_FAILED'
        },
        { status: 500 }
      );
    }

    // 10. RETORNAR RESPUESTA EXITOSA
    const response = {
      success: true,
      media_url: mediaUrl,
      metadata: {
        original_size: compressionResult.metadata.original_size,
        compressed_size: compressionResult.metadata.compressed_size,
        compression_ratio: compressionResult.metadata.compression_ratio,
        mime_type: 'image/jpeg',
        dimensions: compressionResult.metadata.dimensions,
        storage_path: storagePath
      }
    };

    console.log('✅ [ImageUpload] Proceso completado exitosamente para chat:', chat_id);
    
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('💥 [ImageUpload] Error inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

