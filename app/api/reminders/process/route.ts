import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Leer parámetros de query y variables de entorno
    const url = new URL(request.url);
    const dealershipIdFromQuery = url.searchParams.get('dealership_id');
    const reminderTypeFromQuery = url.searchParams.get('reminder_type');
    const targetDealershipId = dealershipIdFromQuery || process.env.TARGET_DEALERSHIP_ID;
    const targetReminderType = reminderTypeFromQuery || process.env.TARGET_REMINDER_TYPE;
    
    console.log('🔄 [Reminder Process] Iniciando procesamiento para:', today);
    console.log('🔍 Filtros aplicados:', {
      dealership_id: targetDealershipId || 'todos',
      reminder_type: targetReminderType || 'todos'
    });
    
    // 2. Obtener agencias que tienen recordatorios pendientes hoy con filtros
    let agenciasQuery = supabase
      .from('reminders')
      .select('dealership_id')
      .eq('reminder_date', today)
      .eq('status', 'pending');
    
    if (targetDealershipId) {
      agenciasQuery = agenciasQuery.eq('dealership_id', targetDealershipId);
    }
    if (targetReminderType) {
      agenciasQuery = agenciasQuery.eq('reminder_type', targetReminderType);
    }
    
    const { data: agenciasConRecordatorios, error: agenciasError } = await agenciasQuery;
    
    if (agenciasError) {
      console.error('❌ Error consultando agencias:', agenciasError);
      throw agenciasError;
    }
    
    // Obtener IDs únicos de agencias
    const agenciasUnicas = [...new Set(agenciasConRecordatorios?.map(r => r.dealership_id) || [])];
    console.log(`📋 Agencias con recordatorios pendientes: ${agenciasUnicas.length}`);
    
    if (agenciasUnicas.length === 0) {
      console.log('✅ No hay recordatorios pendientes para hoy');
      return NextResponse.json({
        success: true,
        processed: 0,
        agencies_processed: 0,
        message: 'No pending reminders for today',
        filters: {
          dealership_id: targetDealershipId || 'todos',
          reminder_type: targetReminderType || 'todos'
        }
      });
    }
    
    // 3. Para cada agencia, obtener su siguiente recordatorio con filtros
    const recordatoriosAEnviar: Array<{
      reminder_id: string;
      reminder_type: string;
      dealership_id: string;
      created_at: string;
    }> = [];
    
    for (const agencyId of agenciasUnicas) {
      try {
        let reminderQuery = supabase
          .from('reminders')
          .select('reminder_id, reminder_type, dealership_id, created_at')
          .eq('reminder_date', today)
          .eq('status', 'pending')
          .eq('dealership_id', agencyId)
          .order('created_at', { ascending: true })
          .limit(1);
        
        if (targetReminderType) {
          reminderQuery = reminderQuery.eq('reminder_type', targetReminderType);
        }
        
        const { data: nextReminder, error: reminderError } = await reminderQuery.single();
        
        if (reminderError) {
          if (reminderError.code === 'PGRST116') {
            // No hay recordatorios para esta agencia (ya no quedan)
            console.log(`ℹ️ No hay recordatorios pendientes para agencia: ${agencyId}`);
          } else {
            console.error(`❌ Error obteniendo recordatorio para agencia ${agencyId}:`, reminderError);
          }
          continue;
        }
        
        if (nextReminder) {
          recordatoriosAEnviar.push(nextReminder);
          console.log(`📤 Recordatorio a enviar para agencia ${agencyId}: ${nextReminder.reminder_id}`);
        }
      } catch (error) {
        console.error(`💥 Error procesando agencia ${agencyId}:`, error);
        // Continuar con otras agencias
      }
    }
    
    console.log(`📊 Total recordatorios a enviar: ${recordatoriosAEnviar.length}`);
    
    // 4. Enviar recordatorios en paralelo (cada agencia usa su token)
    const resultados = await Promise.allSettled(
      recordatoriosAEnviar.map(async (reminder) => {
        try {
          // Marcar como 'processing' para evitar duplicados
          await supabase
            .from('reminders')
            .update({ status: 'processing' })
            .eq('reminder_id', reminder.reminder_id);
          
          // Llamar al endpoint N8N
          const response = await fetch(`${new URL(request.url).origin}/api/n8n/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify({
              reminder_id: reminder.reminder_id,
              template_type: reminder.reminder_type,  // Esto determina qué template usar
              dealership_id: reminder.dealership_id   // Esto determina qué token/número usar
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`WhatsApp API error: ${errorData.error || response.statusText}`);
          }
          
          const result = await response.json();
          console.log(`✅ Recordatorio enviado: ${reminder.reminder_id}`);
          
          return {
            reminder_id: reminder.reminder_id,
            dealership_id: reminder.dealership_id,
            status: 'sent',
            message_id: result.messageId
          };
          
        } catch (error) {
          console.error(`❌ Error enviando recordatorio ${reminder.reminder_id}:`, error);
          
          // Marcar como failed para reintento posterior
          await supabase
            .from('reminders')
            .update({ status: 'failed' })
            .eq('reminder_id', reminder.reminder_id);
          
          return {
            reminder_id: reminder.reminder_id,
            dealership_id: reminder.dealership_id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
    
    // 5. Procesar resultados
    const exitosos = resultados.filter(r => r.status === 'fulfilled' && r.value.status === 'sent').length;
    const fallidos = resultados.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'failed')).length;
    
    console.log(`📊 Resumen: ${exitosos} enviados, ${fallidos} fallidos`);
    
    // 6. Log detallado de resultados
    resultados.forEach((resultado, index) => {
      const reminder = recordatoriosAEnviar[index];
      if (resultado.status === 'fulfilled') {
        const { status, error } = resultado.value;
        if (status === 'sent') {
          console.log(`✅ ${reminder.reminder_id} (${reminder.dealership_id}): Enviado`);
        } else {
          console.log(`❌ ${reminder.reminder_id} (${reminder.dealership_id}): ${error}`);
        }
      } else {
        console.log(`💥 ${reminder.reminder_id} (${reminder.dealership_id}): ${resultado.reason}`);
      }
    });
    
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
        status: r.status === 'fulfilled' ? r.value.status : 'failed'
      }))
    });
    
  } catch (error) {
    console.error('💥 [Reminder Process] Error general:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      processed: 0
    }, { status: 500 });
  }
} 