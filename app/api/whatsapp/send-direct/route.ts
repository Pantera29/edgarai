import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { verifyToken } from "../../../jwt/token";

/**
 * Formatea un número de teléfono al formato requerido por Whapi
 */
function formatPhoneNumber(phone: string): string {
  // Eliminar todos los caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Si ya tiene código de país 52, retornarlo
  if (cleaned.startsWith('52')) {
    return cleaned;
  }
  
  // Si tiene 10 dígitos (formato mexicano), agregar 521
  if (cleaned.length === 10) {
    return `521${cleaned}`;
  }
  
  // Si tiene 11 dígitos y empieza con 1, agregar 52
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `52${cleaned}`;
  }
  
  // Si no cumple formato, retornar original
  return phone;
}

/**
 * Extrae el número de teléfono de 10 dígitos
 */
function get10DigitPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length > 10) {
        // Asume que los últimos 10 dígitos son el número local
        return cleaned.slice(-10);
    }
    return cleaned;
}

export async function POST(request: Request) {
  try {
    console.log('🚀 [WhatsApp Direct] Iniciando envío directo de WhatsApp...');
    
    const supabase = createServerComponentClient({ cookies });
    
    // 1. Obtener y validar datos de entrada
    const { phone_number, message, dealership_id } = await request.json();
    
    console.log('📋 [WhatsApp Direct] Datos recibidos:', { 
      phone_number: phone_number ? `${phone_number.substring(0, 4)}...` : null, 
      message_length: message?.length || 0, 
      dealership_id 
    });
    
    // Validar campos requeridos
    if (!phone_number || !message || !dealership_id) {
      console.log('❌ [WhatsApp Direct] Campos faltantes:', {
        phone_number: !phone_number,
        message: !message,
        dealership_id: !dealership_id
      });
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: phone_number, message, dealership_id' },
        { status: 400 }
      );
    }

    // Validar que el mensaje no esté vacío
    if (message.trim().length === 0) {
      console.log('❌ [WhatsApp Direct] Mensaje vacío');
      return NextResponse.json(
        { success: false, error: 'El mensaje no puede estar vacío' },
        { status: 400 }
      );
    }

    // 1.5. Obtener información del usuario del token de autenticación
    console.log('👤 [WhatsApp Direct] Obteniendo información del usuario...');
    const authHeader = request.headers.get('authorization');
    let userInfo = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      userInfo = verifyToken(token);
      console.log('✅ [WhatsApp Direct] Información del usuario obtenida:', {
        id: userInfo?.id,
        names: userInfo?.names,
        surnames: userInfo?.surnames
      });
    } else {
      console.log('⚠️ [WhatsApp Direct] No se encontró token de autorización, continuando sin información de usuario');
    }

    // Validar que userInfo tenga los datos necesarios
    const hasValidUserInfo = userInfo && userInfo.id && userInfo.names && userInfo.surnames;
    if (!hasValidUserInfo) {
      console.log('⚠️ [WhatsApp Direct] Información de usuario incompleta o inválida, continuando sin información de usuario');
    }

    console.log('✅ [WhatsApp Direct] Validación de datos completada');

    // 2. Obtener token de WhatsApp
    console.log('🔑 [WhatsApp Direct] Obteniendo token de WhatsApp');
    
    // Buscar taller principal por defecto
    const { data: mainWorkshop, error: workshopError } = await supabase
      .from('workshops')
      .select('id')
      .eq('dealership_id', dealership_id)
      .eq('is_main', true)
      .single();

    if (workshopError || !mainWorkshop) {
      console.error('❌ [WhatsApp Direct] No se encontró taller principal:', workshopError);
      return NextResponse.json(
        { success: false, error: 'No se encontró taller principal para este concesionario' },
        { status: 400 }
      );
    }

    const { data: config, error: configError } = await supabase
      .from('dealership_configuration')
      .select('whatsapp_token')
      .eq('dealership_id', dealership_id)
      .eq('workshop_id', mainWorkshop.id)
      .maybeSingle();

    if (configError || !config?.whatsapp_token) {
      console.error('❌ [WhatsApp Direct] Error al obtener token de WhatsApp:', configError);
      return NextResponse.json(
        { success: false, error: 'Token de WhatsApp no configurado para este concesionario' },
        { status: 400 }
      );
    }

    console.log('✅ [WhatsApp Direct] Token obtenido:', config.whatsapp_token.substring(0, 10) + '...');

    // 3. Formatear número de teléfono
    const formattedPhone = formatPhoneNumber(phone_number);
    console.log('📞 [WhatsApp Direct] Número formateado:', formattedPhone);

    // Validar formato del número
    if (!formattedPhone.startsWith('521') || formattedPhone.length < 13) {
      console.log('❌ [WhatsApp Direct] Número de teléfono inválido:', formattedPhone);
      return NextResponse.json(
        { success: false, error: 'Número de teléfono inválido' },
        { status: 400 }
      );
    }

    // 4. Enviar mensaje a Whapi
    console.log('📤 [WhatsApp Direct] Enviando a Whapi...');
    
    const payload = {
      to: formattedPhone,
      body: message
    };

    const response = await fetch('https://gate.whapi.cloud/messages/text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsapp_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // 5. Manejar respuesta de Whapi
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [WhatsApp Direct] Error en respuesta de Whapi:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Error en WhatsApp API: ${response.status} ${response.statusText}`,
          details: errorData
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    console.log('✅ [WhatsApp Direct] Respuesta de Whapi:', responseData);

    // 6. Guardar mensaje en el historial de chat
    console.log('📝 [WhatsApp Direct] Guardando mensaje en historial_chat...');
    try {
      const chatId = get10DigitPhoneNumber(phone_number);
      const whapiMessageId = responseData.message?.id || responseData.id || null;

      const { error: historyError } = await supabase
        .from('historial_chat')
        .insert({
          chat_id: parseInt(chatId, 10),
          message_id: whapiMessageId,
          message: message,
          processed: true,
          status: 'active',
          agente: true,
          dealership_id: dealership_id,
          sender_user_id: hasValidUserInfo ? userInfo.id : null, // ← NUEVO: Solo usar si es válido
          sender_name: hasValidUserInfo ? `${userInfo.names} ${userInfo.surnames}` : null // ← NUEVO: Solo usar si es válido
        });

      if (historyError) {
        console.error('❌ [WhatsApp Direct] Error al guardar en historial_chat:', historyError);
        // No se falla la petición, solo se loguea el error
      } else {
        console.log('✅ [WhatsApp Direct] Mensaje guardado en historial_chat con información del usuario');
      }
    } catch (e) {
      console.error('💥 [WhatsApp Direct] Error inesperado al procesar para historial_chat:', e);
    }

    // 7. Retornar respuesta exitosa
    console.log('✅ [WhatsApp Direct] Envío completado exitosamente');
    return NextResponse.json({ 
      success: true, 
      messageId: responseData.id || responseData.message_id,
      status: responseData.status || 'sent'
    });

  } catch (error) {
    console.error('💥 [WhatsApp Direct] Error inesperado:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al enviar WhatsApp'
      },
      { status: 500 }
    );
  }
} 