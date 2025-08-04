import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { format, parseISO } from "date-fns";

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

/**
 * Procesa las variables del template con los datos reales
 */
function processTemplate(template: string, data: any): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match: string, variable: string) => {
    const value = data[variable];
    if (value !== undefined) {
      return String(value);
    }
    return match;
  });
}

function processTemplateWithConditionals(template: string, data: any): string {
  console.log('🔍 Debug - Template original:', template);
  console.log('🔍 Debug - Data recibida:', data);
  
  // Primero procesar condicionales para VIN
  let processed = template;
  
  // Buscar y procesar condicionales VIN
  const vinRegex = /\{\{vin_if_exists\}\}([\s\S]*?)\{\{\/vin_if_exists\}\}/g;
  let match;
  
  while ((match = vinRegex.exec(template)) !== null) {
    console.log('🔍 Debug - Encontrado condicional VIN:', { 
      fullMatch: match[0], 
      content: match[1], 
      hasVin: !!data.vehicle_vin,
      vehicleVin: data.vehicle_vin,
      vinLength: data.vehicle_vin?.length,
      vinType: typeof data.vehicle_vin,
      vinIsTruthy: !!data.vehicle_vin,
      vinIsEmptyString: data.vehicle_vin === '',
      vinIsNull: data.vehicle_vin === null,
      vinIsUndefined: data.vehicle_vin === undefined
    });
    const shouldInclude = data.vehicle_vin && data.vehicle_vin.trim() !== '';
    console.log('🔍 Debug - Decisión final:', { shouldInclude, finalContent: shouldInclude ? match[1] : '' });
    processed = processed.replace(match[0], shouldInclude ? match[1] : '');
  }
  
  console.log('🔍 Debug - Después de procesar condicionales:', processed);
  
  // Luego procesar las variables normales
  processed = processTemplate(processed, data);
  
  console.log('🔍 Debug - Template final procesado:', processed);
  
  return processed;
}

export async function POST(request: Request) {
  try {
    console.log('🚀 [N8N Send] Iniciando envío via N8N...');
    
    const supabase = createServerComponentClient({ cookies });
    
    // 1. Obtener y validar datos de entrada
    const { reminder_id, template_type, dealership_id } = await request.json();
    
    console.log('📋 [N8N Send] Datos recibidos:', { reminder_id, template_type, dealership_id });
    
    // Validar campos requeridos
    if (!reminder_id || !template_type || !dealership_id) {
      console.log('❌ [N8N Send] Campos faltantes');
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: reminder_id, template_type, dealership_id' },
        { status: 400 }
      );
    }

    // 2. Obtener datos completos del recordatorio
    console.log('🔍 [N8N Send] Obteniendo recordatorio:', reminder_id);
    const { data: recordatorio, error: reminderError } = await supabase
      .from('reminders')
      .select(`
        *,
        client:client_id_uuid (names, phone_number, dealership_id),
        vehicles:vehicle_id (make, model, year, license_plate, vin),
        services:service_id (service_name),
        appointment:appointment_id (appointment_date, appointment_time)
      `)
      .eq('reminder_id', reminder_id)
      .single();

    if (reminderError || !recordatorio) {
      console.error('❌ [N8N Send] Error al obtener recordatorio:', reminderError);
      return NextResponse.json(
        { success: false, error: 'Recordatorio no encontrado' },
        { status: 404 }
      );
    }

    // Validar que el recordatorio pertenece al dealership correcto
    if (recordatorio.client?.dealership_id !== dealership_id) {
      console.log('❌ [N8N Send] Recordatorio no pertenece al dealership');
      return NextResponse.json(
        { success: false, error: 'Recordatorio no encontrado o sin acceso' },
        { status: 403 }
      );
    }

    console.log('✅ [N8N Send] Recordatorio obtenido:', {
      clientName: recordatorio.client?.names,
      vehicleModel: recordatorio.vehicles?.model,
      vehicleVin: recordatorio.vehicles?.vin
    });

    // 3. Obtener template de mensaje
    console.log('📝 [N8N Send] Obteniendo template:', template_type);
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_message_templates')
      .select('message_template')
      .eq('dealership_id', dealership_id)
      .eq('reminder_type', template_type)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('❌ [N8N Send] Error al obtener template:', templateError);
      return NextResponse.json(
        { success: false, error: 'Template de mensaje no encontrado para el tipo especificado' },
        { status: 404 }
      );
    }

    console.log('✅ [N8N Send] Template obtenido');

    // 4. Obtener whapi_id de dealership_mapping
    console.log('🔑 [N8N Send] Obteniendo whapi_id');
    const { data: mapping, error: mappingError } = await supabase
      .from('dealership_mapping')
      .select('whapi_id')
      .eq('dealership_id', dealership_id)
      .single();

    if (mappingError || !mapping?.whapi_id) {
      console.error('❌ [N8N Send] Error al obtener whapi_id:', mappingError);
      return NextResponse.json(
        { success: false, error: 'Mapping de WhatsApp no configurado para este dealership' },
        { status: 400 }
      );
    }

    console.log('✅ [N8N Send] whapi_id obtenido');

    // 5. Procesar variables del template
    console.log('🔄 [N8N Send] Procesando variables del template');
    
    const templateData = {
      client_name: recordatorio.client?.names || 'Cliente',
      vehicle_make: recordatorio.vehicles?.make || '',
      vehicle_model: recordatorio.vehicles?.model || '',
      vehicle_year: recordatorio.vehicles?.year || '',
      vehicle_vin: recordatorio.vehicles?.vin || '',
      service_name: recordatorio.services?.service_name || 'servicio',
      appointment_date: recordatorio.appointment?.appointment_date ? 
        format(parseISO(recordatorio.appointment.appointment_date), 'dd/MM/yyyy') : '',
      appointment_time: recordatorio.appointment?.appointment_time ? 
        format(parseISO(`2000-01-01T${recordatorio.appointment.appointment_time}`), 'HH:mm') : ''
    };

    const processedMessage = processTemplateWithConditionals(template.message_template, templateData);
    console.log('✅ [N8N Send] Template procesado:', processedMessage);

    // 6. Formatear número de teléfono
    const formattedPhone = formatPhoneToN8n(recordatorio.client?.phone_number || '');
    console.log('📞 [N8N Send] Número formateado:', formattedPhone);

    // Validar formato del número
    if (!formattedPhone.startsWith('521') || formattedPhone.length < 13) {
      console.log('❌ [N8N Send] Número de teléfono inválido:', formattedPhone);
      return NextResponse.json(
        { success: false, error: 'Número de teléfono inválido' },
        { status: 400 }
      );
    }

    // 7. Enviar mensaje a N8N
    console.log('📤 [N8N Send] Enviando a N8N...');
    
    const payload = {
      message: processedMessage,
      whapi_id: mapping.whapi_id,
      to: formattedPhone
    };

    const response = await fetch('https://n8n.edgarai.com.mx/webhook/outbound', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // 8. Manejar respuesta de N8N
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [N8N Send] Error en respuesta de N8N:', {
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
    console.log('✅ [N8N Send] Respuesta de N8N:', responseData);

    // Guardar mensaje en el historial de chat
    // console.log('📝 [N8N Send] Guardando mensaje en historial_chat...');
    // try {
    //   const chatId = get10DigitPhoneNumber(recordatorio.client?.phone_number || '');
    //   const n8nMessageId = responseData.id || responseData.message_id || null;

    //   const { error: historyError } = await supabase
    //     .from('historial_chat')
    //     .insert({
    //       chat_id: parseInt(chatId, 10),
    //       message_id: n8nMessageId,
    //       message: processedMessage,
    //       processed: true,
    //       status: 'active',
    //       agente: true,
    //       dealership_id: dealership_id
    //     });

    //   if (historyError) {
    //     console.error('❌ [N8N Send] Error al guardar en historial_chat:', historyError);
    //     // No se falla la petición, solo se loguea el error
    //   } else {
    //     console.log('✅ [N8N Send] Mensaje guardado en historial_chat');
    //   }
    // } catch (e) {
    //   console.error('💥 [N8N Send] Error inesperado al procesar para historial_chat:', e);
    // }

    // 9. Actualizar estado del recordatorio
    console.log('📝 [N8N Send] Actualizando estado del recordatorio a "sent"');
    const { error: updateError } = await supabase
      .from('reminders')
      .update({ 
        status: 'sent',
        sent_date: new Date().toISOString()
      })
      .eq('reminder_id', reminder_id);

    if (updateError) {
      console.error('❌ [N8N Send] Error al actualizar estado del recordatorio:', updateError);
      // No fallar el proceso si no se puede actualizar el estado
    } else {
      console.log('✅ [N8N Send] Estado del recordatorio actualizado');
    }

    // 10. Retornar respuesta exitosa (misma interfaz que WhatsApp)
    return NextResponse.json({ 
      success: true, 
      messageId: responseData.id || responseData.message_id || 'n8n_success',
      status: 'sent'
    });

  } catch (error) {
    console.error('💥 [N8N Send] Error inesperado:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al enviar via N8N'
      },
      { status: 500 }
    );
  }
} 