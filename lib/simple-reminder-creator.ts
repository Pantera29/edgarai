import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface CreateReminderParams {
  appointment_id: string;
  client_id: string;
  vehicle_id: string;
  service_id: string;
  appointment_date: string;
  dealership_id: string;
}

interface ReminderData {
  client_id_uuid: string;
  vehicle_id: string;
  service_id: string;
  base_date: string;
  reminder_date: string;
  notes: string;
  status: 'pending';
}

export async function createAutomaticReminder(params: CreateReminderParams, request: Request) {
  console.log('🔄 [Reminder Creator] Iniciando creación de recordatorio automático');
  console.log('📝 [Reminder Creator] Parámetros recibidos:', params);

  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Buscar regla de recordatorio para el dealership
    console.log('🔍 [Reminder Creator] Buscando regla para dealership:', params.dealership_id);
    const { data: rule, error: ruleError } = await supabase
      .from('automatic_reminder_rules')
      .select('months_after')
      .eq('dealership_id', params.dealership_id)
      .eq('is_active', true)
      .single();

    if (ruleError && ruleError.code !== 'PGRST116') {
      console.error('❌ [Reminder Creator] Error al buscar regla:', ruleError);
      throw ruleError;
    }

    // Usar 6 meses por defecto si no hay regla
    const monthsAfter = rule?.months_after ?? 6;
    console.log('📅 [Reminder Creator] Meses configurados:', monthsAfter);

    // Calcular fecha del recordatorio
    const appointmentDate = new Date(params.appointment_date);
    const reminderDate = new Date(appointmentDate);
    reminderDate.setMonth(reminderDate.getMonth() + monthsAfter);

    // Formatear fechas a YYYY-MM-DD
    const baseDateStr = appointmentDate.toISOString().split('T')[0];
    const reminderDateStr = reminderDate.toISOString().split('T')[0];

    console.log('📅 [Reminder Creator] Fechas calculadas:', {
      base_date: baseDateStr,
      reminder_date: reminderDateStr
    });

    // Preparar datos del recordatorio
    const reminderData: ReminderData = {
      client_id_uuid: params.client_id,
      vehicle_id: params.vehicle_id,
      service_id: params.service_id,
      base_date: baseDateStr,
      reminder_date: reminderDateStr,
      notes: `Recordatorio automático generado por cita completada (ID: ${params.appointment_id})`,
      status: 'pending'
    };

    // Llamar al endpoint de recordatorios
    console.log('📤 [Reminder Creator] Enviando petición a /api/reminders');
    
    // Construir URL absoluta usando la URL base del request
    const baseUrl = new URL(request.url).origin;
    const remindersUrl = `${baseUrl}/api/reminders`;
    
    console.log('🔗 [Reminder Creator] URL construida:', remindersUrl);

    const response = await fetch(remindersUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify(reminderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [Reminder Creator] Error en respuesta:', errorData);
      throw new Error(`Error al crear recordatorio: ${errorData.error || response.statusText}`);
    }

    const reminder = await response.json();
    console.log('✅ [Reminder Creator] Recordatorio creado exitosamente:', reminder);

    return {
      success: true,
      reminder
    };

  } catch (error) {
    console.error('❌ [Reminder Creator] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
} 