import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const today = new Date().toISOString().split('T')[0];
    
    console.log('🔄 [Reminder Process] Iniciando procesamiento para:', today);
    
    // 1. Obtener agencias que tienen recordatorios pendientes hoy
    const { data: agenciasConRecordatorios, error: agenciasError } = await supabase
      .from('reminders')
      .select('dealership_id')
      .eq('reminder_date', today)
      .eq('status', 'pending');
    
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
        message: 'No pending reminders for today'
      });
    }
    
    // 2. Para cada agencia, obtener su siguiente recordatorio
    const recordatoriosAEnviar: Array<{
      reminder_id: string;
      reminder_type: string;
      dealership_id: string;
      created_at: string;
    }> = [];
    
    for (const agencyId of agenciasUnicas) {
      try {
        const { data: nextReminder, error: reminderError } = await supabase
          .from('reminders')
          .select('reminder_id, reminder_type, dealership_id, created_at')
          .eq('reminder_date', today)
          .eq('status', 'pending')
          .eq('dealership_id', agencyId)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();
        
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
    
    // 3. Enviar recordatorios en paralelo (cada agencia usa su token)
    const resultados = await Promise.allSettled(
      recordatoriosAEnviar.map(async (reminder) => {
        try {
          // Marcar como 'processing' para evitar duplicados
          await supabase
            .from('reminders')
            .update({ status: 'processing' })
            .eq('reminder_id', reminder.reminder_id);
          
          // Llamar al endpoint WhatsApp existente
          const response = await fetch(`${new URL(request.url).origin}/api/whatsapp/send`, {
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
    
    // 4. Procesar resultados
    const exitosos = resultados.filter(r => r.status === 'fulfilled' && r.value.status === 'sent').length;
    const fallidos = resultados.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'failed')).length;
    
    console.log(`📊 Resumen: ${exitosos} enviados, ${fallidos} fallidos`);
    
    // 5. Log detallado de resultados
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