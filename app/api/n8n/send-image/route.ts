import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { verifyToken } from "../../../jwt/token";

/**
 * Formatea un número de teléfono al formato requerido por N8N (521XXXXXXXXXX)
 */
function formatPhoneToN8n(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('521')) {
    return cleaned;
  }
  
  if (cleaned.length === 10) {
    return `521${cleaned}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `521${cleaned.slice(1)}`;
  }
  
  return phone;
}

/**
 * Valida que la URL sea una URL válida de Supabase Storage
 */
function isValidSupabaseStorageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Verificar que sea una URL de Supabase Storage
    return urlObj.hostname.includes('supabase') || urlObj.pathname.includes('storage');
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    console.log('🚀 [N8N Send Image] Iniciando envío de imagen...');
    
    const supabase = createServerComponentClient({ cookies });
    
    // 1. Extraer token de autorización y obtener información del usuario
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    let userInfo = null;
    
    if (token) {
      try {
        userInfo = verifyToken(token);
        console.log('👤 [N8N Send Image] Información del usuario extraída:', {
          id: userInfo?.id,
          names: userInfo?.names,
          surnames: userInfo?.surnames
        });
      } catch (error) {
        console.warn('⚠️ [N8N Send Image] Error al verificar token:', error);
        // No fallar el proceso si el token es inválido
      }
    } else {
      console.log('ℹ️ [N8N Send Image] No se encontró token de autorización');
    }
    
    // 2. Obtener y validar datos de entrada
    const { phone_number, media_url, caption, metadata, dealership_id } = await request.json();
    
    console.log('📋 [N8N Send Image] Datos recibidos:', { 
      has_phone: !!phone_number,
      has_media_url: !!media_url,
      has_caption: !!caption,
      dealership_id
    });
    
    // Validar campos requeridos
    if (!phone_number) {
      console.log('❌ [N8N Send Image] Campo phone_number faltante');
      return NextResponse.json(
        { success: false, error: 'Campo requerido: phone_number' },
        { status: 400 }
      );
    }
    
    if (!media_url) {
      console.log('❌ [N8N Send Image] Campo media_url faltante');
      return NextResponse.json(
        { success: false, error: 'Campo requerido: media_url' },
        { status: 400 }
      );
    }
    
    if (!dealership_id) {
      console.log('❌ [N8N Send Image] Campo dealership_id faltante');
      return NextResponse.json(
        { success: false, error: 'Campo requerido: dealership_id' },
        { status: 400 }
      );
    }
    
    // 3. Validar que media_url sea una URL válida de Supabase Storage
    if (!isValidSupabaseStorageUrl(media_url)) {
      console.log('❌ [N8N Send Image] URL de media_url inválida:', media_url);
      return NextResponse.json(
        { success: false, error: 'URL de media_url inválida. Debe ser una URL de Supabase Storage' },
        { status: 400 }
      );
    }
    
    console.log('✅ [N8N Send Image] URL validada:', media_url);
    
    // 4. Obtener whatsapp_config_id (importante para el envío)
    console.log('🔑 [N8N Send Image] Obteniendo whatsapp_config_id...');
    const { data: mapping } = await supabase
      .from('dealership_mapping')
      .select('dealerships!dealership_mapping_dealership_id_fkey(whatsapp_config_id)')
      .eq('dealership_id', dealership_id)
      .maybeSingle();

    const whatsappConfigId = (mapping?.dealerships as any)?.whatsapp_config_id || null;
    console.log('✅ [N8N Send Image] whatsapp_config_id obtenido:', {
      has_whatsapp_config_id: !!whatsappConfigId,
      whatsapp_config_id: whatsappConfigId || 'No disponible'
    });
    
    // 5. Formatear teléfono
    const formattedPhone = formatPhoneToN8n(phone_number);
    console.log('📞 [N8N Send Image] Teléfono formateado:', formattedPhone);
    
    // Validar formato del número
    if (!formattedPhone.startsWith('521') || formattedPhone.length < 13) {
      console.log('❌ [N8N Send Image] Número de teléfono inválido:', formattedPhone);
      return NextResponse.json(
        { success: false, error: 'Número de teléfono inválido' },
        { status: 400 }
      );
    }
    
    // 6. Intentar obtener client_id del teléfono (opcional)
    let clientId: string | undefined;
    try {
      const { data: client } = await supabase
        .from('customers')
        .select('id')
        .eq('phone_number', phone_number)
        .eq('dealership_id', dealership_id)
        .single();
      
      clientId = client?.id;
      if (clientId) {
        console.log('✅ [N8N Send Image] client_id encontrado:', clientId);
      }
    } catch (error) {
      console.log('ℹ️ [N8N Send Image] No se encontró client_id (opcional)');
    }
    
    // 7. Construir payload para n8n
    const payload = {
      message_type: 'image',
      media_url: media_url,
      caption: caption || null,
      to: formattedPhone,
      dealership_id,
      sender_type: 'dealership_worker',
      metadata: metadata || {},
      uploaded_at: new Date().toISOString(),
      
      // whatsapp_config_id (importante)
      ...(whatsappConfigId ? { whatsapp_config_id: whatsappConfigId } : {}),
      
      // Campos opcionales
      ...(userInfo?.id ? { sender_user_id: userInfo.id } : {}),
      ...(userInfo ? { sender_name: `${userInfo.names} ${userInfo.surnames}` } : {}),
      ...(clientId ? { client_id: clientId } : {})
    };

    console.log('📋 [N8N Send Image] Payload completo:', {
      message_type: payload.message_type,
      has_media_url: !!payload.media_url,
      has_caption: !!payload.caption,
      to: payload.to,
      dealership_id: payload.dealership_id,
      sender_type: payload.sender_type,
      whatsapp_config_id: whatsappConfigId || 'No disponible',
      sender_user_id: userInfo?.id || 'No disponible',
      sender_name: userInfo ? `${userInfo.names} ${userInfo.surnames}` : 'No disponible',
      client_id: clientId || 'No disponible'
    });

    // 8. Enviar a n8n
    console.log('📤 [N8N Send Image] Enviando a n8n...');
    const n8nUrl = 'https://n8n.edgarai.com.mx/webhook/kapso-outbound-images';
    
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // 9. Manejar respuesta de N8N
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [N8N Send Image] Error en respuesta de N8N:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Error en N8N API: ${response.status} ${response.statusText}`,
          details: errorData
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    console.log('✅ [N8N Send Image] Respuesta de N8N OK:', responseData);

    // 10. Retornar respuesta exitosa
    return NextResponse.json({ 
      success: true, 
      message: 'Imagen enviada correctamente',
      messageId: responseData.id || responseData.message_id || 'n8n_success',
      status: 'sent'
    });

  } catch (error) {
    console.error('💥 [N8N Send Image] Error inesperado:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al enviar imagen via N8N'
      },
      { status: 500 }
    );
  }
}

