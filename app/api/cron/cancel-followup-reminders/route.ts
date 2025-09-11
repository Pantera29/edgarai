import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

interface CancelFollowupRemindersRequest {
  dealership_id?: string;
  dry_run?: boolean;
}

interface ReminderToCancel {
  reminder_id: string;
  client_id_uuid: string;
  reminder_date: string;
  dealership_id: string;
  appointment_id: number | null;
  future_appointment_id: number;
  future_appointment_date: string;
}

interface ProcessResult {
  reminder_id: string;
  client_id_uuid: string;
  success: boolean;
  error?: string;
  appointment_id?: number | null;
  appointment_date?: string;
  old_reminder_date?: string;
  new_reminder_date?: string;
}

export async function POST(request: Request) {
  const startTime = new Date();
  console.log('🚀 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Iniciando reprogramación de recordatorios de seguimiento:', {
    timestamp: startTime.toISOString(),
    user_agent: request.headers.get('user-agent')
  });

  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Parsear el body de la request
    let body: CancelFollowupRemindersRequest = {};
    try {
      body = await request.json();
    } catch (error) {
      console.log('ℹ️ [CRON-CANCEL-FOLLOWUP-REMINDERS] No se proporcionó body, procesando todos los dealerships');
    }

    const { dealership_id, dry_run = false } = body;
    
    // Validar formato del dealership_id si se proporciona
    if (dealership_id) {
      const isUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dealership_id);
      if (!isUuidFormat) {
        console.error('❌ [CRON-CANCEL-FOLLOWUP-REMINDERS] Formato de dealership_id inválido:', dealership_id);
        return NextResponse.json(
          { 
            success: false,
            message: 'Formato de dealership_id inválido. Debe ser un UUID válido.',
            error_code: 'INVALID_DEALERSHIP_ID_FORMAT',
            provided_dealership_id: dealership_id
          },
          { status: 400 }
        );
      }
      
      console.log('🏢 [CRON-CANCEL-FOLLOWUP-REMINDERS] Procesando dealership específico:', dealership_id);
    } else {
      console.log('🌍 [CRON-CANCEL-FOLLOWUP-REMINDERS] Procesando TODOS los dealerships');
    }

    if (dry_run) {
      console.log('🔍 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Modo DRY RUN activado - no se realizarán cambios');
    }

    // Consulta para encontrar recordatorios de seguimiento que deben reprogramarse
    console.log('📊 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Buscando recordatorios de seguimiento a reprogramar...');

    console.log('🔍 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Ejecutando consulta optimizada...');

    // Ejecutar consulta optimizada usando el cliente de Supabase
    let query = supabase
      .from('reminders')
      .select(`
        reminder_id,
        client_id_uuid,
        reminder_date,
        dealership_id,
        appointment_id
      `)
      .eq('reminder_type', 'follow_up')
      .eq('status', 'pending')
      .limit(100);

    // Aplicar filtro de dealership si se proporciona
    if (dealership_id) {
      query = query.eq('dealership_id', dealership_id);
    }

    const { data: remindersToReprogram, error: queryError } = await query;

    if (queryError) {
      console.error('❌ [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Error ejecutando consulta SQL:', queryError);
      return NextResponse.json(
        { 
          success: false,
          message: 'Error consultando recordatorios en la base de datos',
          error_code: 'DATABASE_QUERY_ERROR',
          error_details: queryError.message
        },
        { status: 500 }
      );
    }

    if (!remindersToReprogram || remindersToReprogram.length === 0) {
      console.log('ℹ️ [CRON-REPROGRAM-FOLLOWUP-REMINDERS] No se encontraron recordatorios de seguimiento para reprogramar');
      return NextResponse.json({
        success: true,
        message: 'No se encontraron recordatorios de seguimiento que requieran reprogramación',
        dealership_id: dealership_id || null,
        dry_run: dry_run,
        processed_count: 0,
        success_count: 0,
        error_count: 0,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime.getTime(),
        dealerships_affected: [],
        details: []
      });
    }

    console.log(`📊 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Datos obtenidos de Supabase: ${remindersToReprogram?.length || 0} recordatorios`);

    // Procesar cada recordatorio y buscar citas futuras
    const processedReminders: ReminderToCancel[] = [];
    
    if (remindersToReprogram) {
      for (const reminder of remindersToReprogram) {
        // Buscar citas pendientes del cliente con fecha posterior al recordatorio
        const { data: futureAppointments, error: appointmentsError } = await supabase
          .from('appointment')
          .select('id, appointment_date')
          .eq('client_id', reminder.client_id_uuid)
          .eq('status', 'pending')
          .gt('appointment_date', reminder.reminder_date.split('T')[0])
          .limit(1);

        if (appointmentsError) {
          console.error(`❌ [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Error consultando citas para recordatorio ${reminder.reminder_id}:`, appointmentsError);
          continue;
        }

        if (futureAppointments && futureAppointments.length > 0) {
          const appointment = futureAppointments[0];
          console.log(`🔍 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Recordatorio ${reminder.reminder_id}: reminder_date=${reminder.reminder_date.split('T')[0]}, appointment_date=${appointment.appointment_date}, should_reprogram=true`);
          
          processedReminders.push({
            reminder_id: reminder.reminder_id,
            client_id_uuid: reminder.client_id_uuid,
            reminder_date: reminder.reminder_date,
            dealership_id: reminder.dealership_id,
            appointment_id: reminder.appointment_id,
            future_appointment_id: appointment.id,
            future_appointment_date: appointment.appointment_date
          });
        } else {
          console.log(`🔍 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Recordatorio ${reminder.reminder_id}: no tiene citas futuras`);
        }
      }
    }

    console.log(`📊 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Encontrados ${processedReminders.length} recordatorios para reprogramar`);

    if (!processedReminders || processedReminders.length === 0) {
      console.log('ℹ️ [CRON-REPROGRAM-FOLLOWUP-REMINDERS] No se encontraron recordatorios de seguimiento para reprogramar');
      return NextResponse.json({
        success: true,
        message: 'No se encontraron recordatorios de seguimiento que requieran reprogramación',
        dealership_id: dealership_id || null,
        dry_run: dry_run,
        processed_count: 0,
        success_count: 0,
        error_count: 0,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime.getTime(),
        dealerships_affected: [],
        details: []
      });
    }

    console.log(`📊 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Encontrados ${remindersToReprogram.length} recordatorios para reprogramar`);

    const results: ProcessResult[] = [];
    const dealershipsAffected = new Set<string>();

    // Procesar cada recordatorio
    for (const reminder of processedReminders) {
      try {
        console.log(`🔄 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Procesando recordatorio: ${reminder.reminder_id} (Cliente: ${reminder.client_id_uuid})`);
        
        // Calcular nueva fecha: 5 meses después de la cita
        const appointmentDate = new Date(reminder.future_appointment_date);
        const newReminderDate = new Date(appointmentDate);
        newReminderDate.setMonth(appointmentDate.getMonth() + 5); // 5 meses después
        
        if (dry_run) {
          console.log(`🔍 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] DRY RUN - Recordatorio ${reminder.reminder_id} sería reprogramado de ${reminder.reminder_date} a ${newReminderDate.toISOString()}`);
          results.push({
            reminder_id: reminder.reminder_id,
            client_id_uuid: reminder.client_id_uuid,
            success: true,
            appointment_id: reminder.future_appointment_id,
            appointment_date: reminder.future_appointment_date,
            old_reminder_date: reminder.reminder_date,
            new_reminder_date: newReminderDate.toISOString()
          });
          dealershipsAffected.add(reminder.dealership_id);
        } else {
          // Actualizar el recordatorio con nueva fecha
          const { error: updateError } = await supabase
            .from('reminders')
            .update({ 
              reminder_date: newReminderDate.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('reminder_id', reminder.reminder_id);

          if (updateError) {
            console.error(`❌ [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Error reprogramando recordatorio ${reminder.reminder_id}:`, updateError);
            results.push({
              reminder_id: reminder.reminder_id,
              client_id_uuid: reminder.client_id_uuid,
              success: false,
              error: updateError.message,
              appointment_id: reminder.future_appointment_id,
              appointment_date: reminder.future_appointment_date,
              old_reminder_date: reminder.reminder_date,
              new_reminder_date: newReminderDate.toISOString()
            });
          } else {
            console.log(`✅ [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Recordatorio ${reminder.reminder_id} reprogramado exitosamente de ${reminder.reminder_date} a ${newReminderDate.toISOString()}`);
            results.push({
              reminder_id: reminder.reminder_id,
              client_id_uuid: reminder.client_id_uuid,
              success: true,
              appointment_id: reminder.future_appointment_id,
              appointment_date: reminder.future_appointment_date,
              old_reminder_date: reminder.reminder_date,
              new_reminder_date: newReminderDate.toISOString()
            });
            dealershipsAffected.add(reminder.dealership_id);
          }
        }
      } catch (error) {
        console.error(`💥 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Error inesperado procesando recordatorio ${reminder.reminder_id}:`, error);
        results.push({
          reminder_id: reminder.reminder_id,
          client_id_uuid: reminder.client_id_uuid,
          success: false,
          error: error instanceof Error ? error.message : 'Error inesperado',
          appointment_id: reminder.future_appointment_id,
          appointment_date: reminder.future_appointment_date,
          old_reminder_date: reminder.reminder_date
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    console.log(`🎉 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Proceso completado:`, {
      processed_count: processedReminders.length,
      success_count: successCount,
      error_count: errorCount,
      duration_ms: durationMs,
      dealerships_affected: Array.from(dealershipsAffected),
      dry_run: dry_run
    });

    return NextResponse.json({
      success: true,
      message: dry_run 
        ? 'Análisis de recordatorios de seguimiento completado (DRY RUN)' 
        : 'Recordatorios de seguimiento reprogramados exitosamente',
      dealership_id: dealership_id || null,
      dry_run: dry_run,
      processed_count: processedReminders.length,
      success_count: successCount,
      error_count: errorCount,
      timestamp: endTime.toISOString(),
      duration_ms: durationMs,
      dealerships_affected: Array.from(dealershipsAffected),
      details: results
    });

  } catch (error) {
    console.error('💥 [CRON-REPROGRAM-FOLLOWUP-REMINDERS] Error inesperado:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error interno del servidor durante el proceso de reprogramación',
        error_code: 'INTERNAL_SERVER_ERROR',
        error_details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
