import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { format, parseISO } from "date-fns";

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
      vehicleVin: data.vehicle_vin 
    });
    
    processed = processed.replace(match[0], data.vehicle_vin ? match[1] : '');
  }
  
  console.log('🔍 Debug - Después de procesar condicionales:', processed);
  
  // Luego procesar las variables normales
  processed = processTemplate(processed, data);
  
  console.log('🔍 Debug - Template final procesado:', processed);
  
  return processed;
}

export async function POST(request: Request) {
  try {
    console.log('🚀 Iniciando envío de WhatsApp...');
    
    const supabase = createServerComponentClient({ cookies });
    
    // 1. Obtener y validar datos de entrada
    const { reminder_id, template_type, dealership_id } = await request.json();
    
    console.log('📋 Datos recibidos:', { reminder_id, template_type, dealership_id });
    
    // Validar campos requeridos
    if (!reminder_id || !template_type || !dealership_id) {
      console.log('❌ Campos faltantes:', {
        reminder_id: !reminder_id,
        template_type: !template_type,
        dealership_id: !dealership_id
      });
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: reminder_id, template_type, dealership_id' },
        { status: 400 }
      );
    }

    // 2. Obtener recordatorio y validar acceso
    console.log('🔍 Obteniendo recordatorio:', reminder_id);
    const { data: recordatorio, error: reminderError } = await supabase
      .from('reminders')
      .select(`
        *,
        client:client_id_uuid (
          names,
          phone_number,
          dealership_id
        ),
        vehicles:vehicle_id (
          make,
          model,
          year,
          license_plate,
          vin
        ),
        services:service_id (
          service_name,
          description
        )
      `)
      .eq('reminder_id', reminder_id)
      .single();

    if (reminderError || !recordatorio) {
      console.error('❌ Error al obtener recordatorio:', reminderError);
      return NextResponse.json(
        { success: false, error: 'Recordatorio no encontrado o sin acceso' },
        { status: 404 }
      );
    }

    // Validar que el recordatorio pertenece al concesionario
    if (recordatorio.client.dealership_id !== dealership_id) {
      console.log('❌ Recordatorio no pertenece al concesionario');
      return NextResponse.json(
        { success: false, error: 'Recordatorio no encontrado o sin acceso' },
        { status: 403 }
      );
    }

    console.log('✅ Recordatorio obtenido:', {
      clientName: recordatorio.client.names,
      vehicleModel: recordatorio.vehicles.model,
      serviceName: recordatorio.services?.service_name,
      vehicleVin: recordatorio.vehicles.vin
    });

    // 3. Obtener template de mensaje
    console.log('📝 Obteniendo template:', template_type);
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_message_templates')
      .select('message_template')
      .eq('dealership_id', dealership_id)
      .eq('reminder_type', template_type)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('❌ Error al obtener template:', templateError);
      return NextResponse.json(
        { success: false, error: 'Template de mensaje no encontrado para el tipo especificado' },
        { status: 404 }
      );
    }

    console.log('✅ Template obtenido');

    // 4. Obtener token de WhatsApp
    console.log('🔑 Obteniendo token de WhatsApp');
    
    // Buscar taller principal por defecto
    const { data: mainWorkshop } = await supabase
      .from('workshops')
      .select('id')
      .eq('dealership_id', dealership_id)
      .eq('is_main', true)
      .single();

    if (!mainWorkshop) {
      console.error('❌ No se encontró taller principal');
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
      console.error('❌ Error al obtener token de WhatsApp:', configError);
      return NextResponse.json(
        { success: false, error: 'Token de WhatsApp no configurado para este concesionario' },
        { status: 400 }
      );
    }

    console.log('✅ Token obtenido:', config.whatsapp_token.substring(0, 10) + '...');

    // 5. Procesar variables del template
    console.log('🔄 Procesando variables del template');
    
    // Preparar datos para el template
    const templateData = {
      client_name: recordatorio.client.names,
      vehicle_make: recordatorio.vehicles.make,
      vehicle_model: recordatorio.vehicles.model,
      vehicle_year: recordatorio.vehicles.year,
      vehicle_vin: recordatorio.vehicles.vin || '', // Agregar VIN
      service_name: recordatorio.services?.service_name || 'servicio',
      appointment_date: recordatorio.appointment_date ? 
        format(parseISO(recordatorio.appointment_date), 'dd/MM/yyyy') : '',
      appointment_time: recordatorio.appointment_time ? 
        format(parseISO(`2000-01-01T${recordatorio.appointment_time}`), 'HH:mm') : ''
    };

    const processedMessage = processTemplateWithConditionals(template.message_template, templateData);
    console.log('✅ Template procesado:', processedMessage);

    // 6. Formatear número de teléfono
    const formattedPhone = formatPhoneNumber(recordatorio.client.phone_number);
    console.log('📞 Número formateado:', formattedPhone);

    // Validar formato del número
    if (!formattedPhone.startsWith('521') || formattedPhone.length < 13) {
      console.log('❌ Número de teléfono inválido:', formattedPhone);
      return NextResponse.json(
        { success: false, error: 'Número de teléfono inválido' },
        { status: 400 }
      );
    }

    // 7. Enviar mensaje a Whapi
    console.log('📤 Enviando a Whapi...');
    
    const payload = {
      to: formattedPhone,
      body: processedMessage
    };

    const response = await fetch('https://gate.whapi.cloud/messages/text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsapp_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // 8. Manejar respuesta de Whapi
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error en respuesta de Whapi:', {
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
    console.log('✅ Respuesta de Whapi:', responseData);

    // Guardar mensaje en el historial de chat
    console.log('📝 Guardando mensaje en historial_chat...');
    try {
      const chatId = get10DigitPhoneNumber(recordatorio.client.phone_number);
      const whapiMessageId = responseData.message?.id || responseData.id || null;

      const { error: historyError } = await supabase
        .from('historial_chat')
        .insert({
          chat_id: parseInt(chatId, 10),
          message_id: whapiMessageId,
          message: processedMessage,
          processed: true,
          status: 'active',
          agente: true,
          dealership_id: dealership_id
        });

      if (historyError) {
        console.error('❌ Error al guardar en historial_chat:', historyError);
        // No se falla la petición, solo se loguea el error
      } else {
        console.log('✅ Mensaje guardado en historial_chat');
      }
    } catch (e) {
      console.error('💥 Error inesperado al procesar para historial_chat:', e);
    }

    // 9. Actualizar estado del recordatorio
    console.log('📝 Actualizando estado del recordatorio a "sent"');
    const { error: updateError } = await supabase
      .from('reminders')
      .update({ 
        status: 'sent',
        sent_date: new Date().toISOString()
      })
      .eq('reminder_id', reminder_id);

    if (updateError) {
      console.error('❌ Error al actualizar estado del recordatorio:', updateError);
      // No fallar el proceso si no se puede actualizar el estado
    } else {
      console.log('✅ Estado del recordatorio actualizado');
    }

    // 10. Retornar respuesta exitosa
    return NextResponse.json({ 
      success: true, 
      messageId: responseData.id || responseData.message_id,
      status: responseData.status || 'sent'
    });

  } catch (error) {
    console.error('💥 Error inesperado en API de WhatsApp:', {
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