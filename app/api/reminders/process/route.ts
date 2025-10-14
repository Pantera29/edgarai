export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Función común que contiene toda la lógica de procesamiento
async function processReminders(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    // 🔧 MEJORA: Logs de inicio con información completa del request
    console.log('🚀 [Reminder Process] ===== INICIO PROCESAMIENTO =====');
    console.log(`🆔 [Reminder Process] Request ID: ${requestId}`);
    console.log(`⏰ [Reminder Process] Timestamp inicio: ${new Date().toISOString()}`);
    console.log(`🌐 [Reminder Process] User Agent: ${request.headers.get('user-agent') || 'N/A'}`);
    console.log(`🔗 [Reminder Process] URL: ${request.url}`);
    console.log(`📋 [Reminder Process] Method: ${request.method}`);
    
    // 🔧 MEJORA: Información de zona horaria
    const timezone = 'America/Mexico_City';
    const now = new Date();
    const todayInMexico = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
    const today = todayInMexico.toISOString().split('T')[0];
    
    console.log('🌍 [Reminder Process] Información de zona horaria:');
    console.log(`   UTC: ${now.toISOString()}`);
    console.log(`   México: ${todayInMexico.toISOString()}`);
    console.log(`   Fecha México: ${today}`);
    console.log(`   Zona horaria: ${timezone}`);
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // 1. Leer parámetros de query y variables de entorno
    const url = new URL(request.url);
    const dealershipIdFromQuery = url.searchParams.get('dealership_id');
    const reminderTypeFromQuery = url.searchParams.get('reminder_type');
    const targetDealershipId = dealershipIdFromQuery || process.env.TARGET_DEALERSHIP_ID;
    const targetReminderType = reminderTypeFromQuery || process.env.TARGET_REMINDER_TYPE;
    
    console.log('🔍 [Reminder Process] Parámetros y configuración:');
    console.log(`   dealership_id query: ${dealershipIdFromQuery || 'N/A'}`);
    console.log(`   reminder_type query: ${reminderTypeFromQuery || 'N/A'}`);
    console.log(`   TARGET_DEALERSHIP_ID env: ${process.env.TARGET_DEALERSHIP_ID || 'N/A'}`);
    console.log(`   TARGET_REMINDER_TYPE env: ${process.env.TARGET_REMINDER_TYPE || 'N/A'}`);
    console.log(`   dealership_id final: ${targetDealershipId || 'todos'}`);
    console.log(`   reminder_type final: ${targetReminderType || 'todos'}`);
    
    console.log('🔄 [Reminder Process] Iniciando procesamiento para:', today);
    
    // 2. Obtener agencias que tienen recordatorios pendientes hoy con filtros
    console.log('📊 [Reminder Process] Consultando agencias con recordatorios pendientes...');
    
    let agenciasQuery = supabase
      .from('reminders')
      .select('dealership_id')
      .eq('reminder_date', today)
      .eq('status', 'pending');
    
    if (targetDealershipId) {
      agenciasQuery = agenciasQuery.eq('dealership_id', targetDealershipId);
      console.log(`🔍 [Reminder Process] Filtro dealership_id aplicado: ${targetDealershipId}`);
    }
    if (targetReminderType) {
      agenciasQuery = agenciasQuery.eq('reminder_type', targetReminderType);
      console.log(`🔍 [Reminder Process] Filtro reminder_type aplicado: ${targetReminderType}`);
    }
    
    const { data: agenciasConRecordatorios, error: agenciasError } = await agenciasQuery;
    
    if (agenciasError) {
      console.error('❌ [Reminder Process] Error consultando agencias:', agenciasError);
      throw agenciasError;
    }
    
    // Obtener IDs únicos de agencias
    const agenciasUnicas = [...new Set(agenciasConRecordatorios?.map(r => r.dealership_id) || [])];
    console.log(`📋 [Reminder Process] Agencias con recordatorios pendientes: ${agenciasUnicas.length}`);
    
    if (agenciasUnicas.length > 0) {
      console.log(`📋 [Reminder Process] IDs de agencias: ${agenciasUnicas.join(', ')}`);
    }
    
    if (agenciasUnicas.length === 0) {
      console.log('✅ [Reminder Process] No hay recordatorios pendientes para hoy');
      const endTime = Date.now();
      console.log(`⏱️ [Reminder Process] Tiempo total: ${endTime - startTime}ms`);
      console.log('🏁 [Reminder Process] ===== FIN PROCESAMIENTO (SIN RECORDATORIOS) =====');
      
      return NextResponse.json({
        success: true,
        processed: 0,
        agencies_processed: 0,
        message: 'No pending reminders for today',
        filters: {
          dealership_id: targetDealershipId || 'todos',
          reminder_type: targetReminderType || 'todos'
        },
        debug: {
          request_id: requestId,
          execution_time_ms: endTime - startTime,
          timezone: timezone,
          date_processed: today
        }
      });
    }
    
    // 3. Para cada agencia, obtener su siguiente recordatorio con filtros
    console.log('🔍 [Reminder Process] Obteniendo recordatorios específicos por agencia...');
    const recordatoriosAEnviar: Array<{
      reminder_id: string;
      reminder_type: string;
      dealership_id: string;
      created_at: string;
    }> = [];
    
    for (const agencyId of agenciasUnicas) {
      try {
        console.log(`🔍 [Reminder Process] Procesando agencia: ${agencyId}`);
        
        // NUEVO: Obtener configuración de recordatorios para esta agencia
        console.log(`⚙️ [Reminder Process] Verificando configuración para agencia: ${agencyId}`);
        const { data: settings, error: settingsError } = await supabase
          .from('dealership_reminder_settings')
          .select('confirmation_enabled, follow_up_enabled, nps_enabled')
          .eq('dealership_id', agencyId)
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error(`❌ [Reminder Process] Error obteniendo configuración para agencia ${agencyId}:`, settingsError);
          continue;
        }

        // Si no hay configuración, usar valores por defecto (todos habilitados)
        const reminderSettings = settings || {
          confirmation_enabled: true,
          follow_up_enabled: true,
          nps_enabled: true
        };

        console.log(`⚙️ [Reminder Process] Configuración para agencia ${agencyId}:`, reminderSettings);
        
        // ✅ NUEVA LÓGICA: Obtener recordatorios por prioridad usando queries separadas
        // Prioridad: 1) confirmation, 2) nps, 3) follow_up
        const priorityTypes = [
          { type: 'confirmation', enabled: reminderSettings.confirmation_enabled },
          { type: 'nps', enabled: reminderSettings.nps_enabled },
          { type: 'follow_up', enabled: reminderSettings.follow_up_enabled }
        ];
        
        const remindersForAgency: Array<{
          reminder_id: string;
          reminder_type: string;
          dealership_id: string;
          created_at: string;
        }> = [];
        
        console.log(`🔍 [Reminder Process] Buscando recordatorios por prioridad para agencia ${agencyId}...`);
        
        // Iterar por orden de prioridad hasta obtener máximo 2 recordatorios
        for (const { type, enabled } of priorityTypes) {
          // Si ya tenemos 2 recordatorios, no buscar más
          if (remindersForAgency.length >= 2) {
            break;
          }
          
          // Saltar si el tipo no está habilitado
          if (!enabled) {
            console.log(`   ⏭️ Tipo '${type}' deshabilitado, saltando...`);
            continue;
          }
          
          // Si hay filtro de tipo específico, solo procesar ese tipo
          if (targetReminderType && targetReminderType !== type) {
            console.log(`   ⏭️ Filtro activo: solo procesando '${targetReminderType}', saltando '${type}'...`);
            continue;
          }
          
          // Calcular cuántos recordatorios necesitamos de este tipo
          const needed = 2 - remindersForAgency.length;
          
          console.log(`   🔍 Buscando hasta ${needed} recordatorios de tipo '${type}'...`);
          
          // Query para obtener recordatorios de este tipo específico
          const { data: typeReminders, error: typeError } = await supabase
            .from('reminders')
            .select('reminder_id, reminder_type, dealership_id, created_at')
            .eq('reminder_date', today)
            .eq('status', 'pending')
            .eq('dealership_id', agencyId)
            .eq('reminder_type', type)
            .order('created_at', { ascending: true })
            .limit(needed);
          
          if (typeError) {
            console.error(`   ❌ Error obteniendo recordatorios '${type}':`, typeError);
            continue;
          }
          
          if (typeReminders && typeReminders.length > 0) {
            console.log(`   ✅ Encontrados ${typeReminders.length} recordatorios de tipo '${type}'`);
            remindersForAgency.push(...typeReminders);
          } else {
            console.log(`   ℹ️ No hay recordatorios pendientes de tipo '${type}'`);
          }
        }
        
        if (remindersForAgency.length === 0) {
          console.log(`ℹ️ [Reminder Process] No hay recordatorios pendientes habilitados para agencia: ${agencyId}`);
          continue;
        }
        
        console.log(`📊 [Reminder Process] Total a enviar para agencia ${agencyId}: ${remindersForAgency.length}`);
        
        // Agregar recordatorios a la lista global
        for (const nextReminder of remindersForAgency) {
          recordatoriosAEnviar.push(nextReminder);
          console.log(`📤 [Reminder Process] Recordatorio a enviar para agencia ${agencyId}:`);
          console.log(`   ID: ${nextReminder.reminder_id}`);
          console.log(`   Tipo: ${nextReminder.reminder_type}`);
          console.log(`   Creado: ${nextReminder.created_at}`);
          console.log(`   ✅ Habilitado: true`);
        }
      } catch (error) {
        console.error(`💥 [Reminder Process] Error procesando agencia ${agencyId}:`, error);
        // Continuar con otras agencias
      }
    }
    
    console.log(`📊 [Reminder Process] Total recordatorios a enviar: ${recordatoriosAEnviar.length}`);
    
    if (recordatoriosAEnviar.length === 0) {
      console.log('⚠️ [Reminder Process] No se encontraron recordatorios válidos para enviar');
      const endTime = Date.now();
      console.log(`⏱️ [Reminder Process] Tiempo total: ${endTime - startTime}ms`);
      console.log('🏁 [Reminder Process] ===== FIN PROCESAMIENTO (SIN RECORDATORIOS VÁLIDOS) =====');
      
      return NextResponse.json({
        success: true,
        processed: 0,
        failed: 0,
        agencies_processed: agenciasUnicas.length,
        date: today,
        filters: {
          dealership_id: targetDealershipId || 'todos',
          reminder_type: targetReminderType || 'todos'
        },
        debug: {
          request_id: requestId,
          execution_time_ms: endTime - startTime,
          timezone: timezone,
          date_processed: today,
          agencies_found: agenciasUnicas.length,
          valid_reminders: 0
        }
      });
    }
    
    // 4. Enviar recordatorios en paralelo (cada agencia usa su token)
    console.log('📤 [Reminder Process] Iniciando envío de recordatorios...');
    const resultados = await Promise.allSettled(
      recordatoriosAEnviar.map(async (reminder, index) => {
        const reminderStartTime = Date.now();
        console.log(`📤 [Reminder Process] Enviando recordatorio ${index + 1}/${recordatoriosAEnviar.length}: ${reminder.reminder_id}`);
        
        try {
          // Marcar como 'processing' para evitar duplicados
          console.log(`🔄 [Reminder Process] Marcando ${reminder.reminder_id} como 'processing'...`);
          await supabase
            .from('reminders')
            .update({ status: 'processing' })
            .eq('reminder_id', reminder.reminder_id);
          
          // Llamar al endpoint N8N
          const n8nUrl = `${new URL(request.url).origin}/api/n8n/send`;
          console.log(`📡 [Reminder Process] Llamando a N8N: ${n8nUrl}`);
          console.log(`📦 [Reminder Process] Datos enviados a N8N:`, {
            reminder_id: reminder.reminder_id,
            template_type: reminder.reminder_type,
            dealership_id: reminder.dealership_id
          });
          
          const response = await fetch(n8nUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify({
              reminder_id: reminder.reminder_id,
              template_type: reminder.reminder_type,
              dealership_id: reminder.dealership_id,
              sender_type: 'ai_agent' // Proceso automático = AI Agent
            })
          });
          
          console.log(`📡 [Reminder Process] Respuesta N8N para ${reminder.reminder_id}:`, {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`❌ [Reminder Process] Error N8N para ${reminder.reminder_id}:`, errorData);
            throw new Error(`WhatsApp API error: ${errorData.error || response.statusText}`);
          }
          
          const result = await response.json();
          const reminderEndTime = Date.now();
          console.log(`✅ [Reminder Process] Recordatorio enviado exitosamente: ${reminder.reminder_id}`);
          console.log(`⏱️ [Reminder Process] Tiempo de envío: ${reminderEndTime - reminderStartTime}ms`);
          console.log(`📄 [Reminder Process] Respuesta N8N:`, result);
          
          return {
            reminder_id: reminder.reminder_id,
            dealership_id: reminder.dealership_id,
            status: 'sent',
            message_id: result.messageId,
            execution_time_ms: reminderEndTime - reminderStartTime
          };
          
        } catch (error) {
          const reminderEndTime = Date.now();
          console.error(`❌ [Reminder Process] Error enviando recordatorio ${reminder.reminder_id}:`, error);
          console.log(`⏱️ [Reminder Process] Tiempo hasta error: ${reminderEndTime - reminderStartTime}ms`);
          
          // Marcar como failed para reintento posterior
          console.log(`🔄 [Reminder Process] Marcando ${reminder.reminder_id} como 'failed'...`);
          await supabase
            .from('reminders')
            .update({ status: 'failed' })
            .eq('reminder_id', reminder.reminder_id);
          
          return {
            reminder_id: reminder.reminder_id,
            dealership_id: reminder.dealership_id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            execution_time_ms: reminderEndTime - reminderStartTime
          };
        }
      })
    );
    
    // 5. Procesar resultados
    const exitosos = resultados.filter(r => r.status === 'fulfilled' && r.value.status === 'sent').length;
    const fallidos = resultados.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'failed')).length;
    
    console.log(`📊 [Reminder Process] Resumen final:`);
    console.log(`   ✅ Exitosos: ${exitosos}`);
    console.log(`   ❌ Fallidos: ${fallidos}`);
    console.log(`   📋 Total procesados: ${recordatoriosAEnviar.length}`);
    
    // 6. Log detallado de resultados
    console.log('📋 [Reminder Process] Detalle de resultados:');
    resultados.forEach((resultado, index) => {
      const reminder = recordatoriosAEnviar[index];
      if (resultado.status === 'fulfilled') {
        const { status, error, execution_time_ms } = resultado.value;
        if (status === 'sent') {
          console.log(`✅ [Reminder Process] ${reminder.reminder_id} (${reminder.dealership_id}): Enviado en ${execution_time_ms}ms`);
        } else {
          console.log(`❌ [Reminder Process] ${reminder.reminder_id} (${reminder.dealership_id}): ${error} (${execution_time_ms}ms)`);
        }
      } else {
        console.log(`💥 [Reminder Process] ${reminder.reminder_id} (${reminder.dealership_id}): ${resultado.reason}`);
      }
    });
    
    const endTime = Date.now();
    const totalExecutionTime = endTime - startTime;
    
    console.log(`⏱️ [Reminder Process] Tiempo total de ejecución: ${totalExecutionTime}ms`);
    console.log('🏁 [Reminder Process] ===== FIN PROCESAMIENTO EXITOSO =====');
    
    return NextResponse.json({
      success: true,
      processed: exitosos,
      failed: fallidos,
      agencies_processed: agenciasUnicas.length,
      date: today,
      filters: {
        dealership_id: targetDealershipId || 'todos',
        reminder_type: targetReminderType || 'todos'
      },
      details: resultados.map((r, i) => ({
        reminder_id: recordatoriosAEnviar[i].reminder_id,
        dealership_id: recordatoriosAEnviar[i].dealership_id,
        status: r.status === 'fulfilled' ? r.value.status : 'failed',
        execution_time_ms: r.status === 'fulfilled' ? r.value.execution_time_ms : null
      })),
      debug: {
        request_id: requestId,
        execution_time_ms: totalExecutionTime,
        timezone: timezone,
        date_processed: today,
        agencies_found: agenciasUnicas.length,
        valid_reminders: recordatoriosAEnviar.length
      }
    });
    
  } catch (error) {
    const endTime = Date.now();
    console.error('💥 [Reminder Process] Error general:', error);
    console.log(`⏱️ [Reminder Process] Tiempo hasta error: ${endTime - startTime}ms`);
    console.log('🏁 [Reminder Process] ===== FIN PROCESAMIENTO CON ERROR =====');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      processed: 0,
      debug: {
        request_id: requestId,
        execution_time_ms: endTime - startTime,
        error_stack: error instanceof Error ? error.stack : null
      }
    }, { status: 500 });
  }
}

// Método GET (nuevo)
export async function GET(request: Request) {
  return await processReminders(request);
}

// Método POST (existente, modificado para usar la función común)
export async function POST(request: Request) {
  return await processReminders(request);
}