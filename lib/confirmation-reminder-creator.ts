import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface CreateConfirmationReminderParams {
  appointment_id: string;
  client_id: string;
  vehicle_id: string;
  service_id: string;
  appointment_date: string;
  dealership_id: string;
}

export async function createConfirmationReminder(params: CreateConfirmationReminderParams) {
  console.log('🔔 [Confirmation Reminder] Creando recordatorio de confirmación para cita:', params.appointment_id);
  console.log('🔍 [Confirmation Reminder] Parámetros recibidos:', params);
  
  try {
    console.log('🔍 [Confirmation Reminder] Creando cliente Supabase...');
    const supabase = createRouteHandlerClient({ cookies });
    console.log('🔍 [Confirmation Reminder] Cliente Supabase creado exitosamente');
    
    // Calcular fecha del recordatorio (1 día antes de la cita)
    const appointmentDate = new Date(params.appointment_date);
    const reminderDate = new Date(appointmentDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    
    console.log('🔍 [Confirmation Reminder] Fechas calculadas:', {
      appointmentDate: appointmentDate.toISOString(),
      reminderDate: reminderDate.toISOString(),
      reminderDateStr: reminderDate.toISOString().split('T')[0]
    });
    
    const reminderData = {
      client_id_uuid: params.client_id,
      vehicle_id: params.vehicle_id,
      service_id: params.service_id,
      appointment_id: params.appointment_id, // ← Para confirmación
      base_date: params.appointment_date,
      reminder_date: reminderDate.toISOString().split('T')[0],
      notes: `Recordatorio de confirmación para cita del ${params.appointment_date}`,
      status: 'pending' as const,
      reminder_type: 'confirmation' as const,
      dealership_id: params.dealership_id
    };
    
    console.log('🔍 [Confirmation Reminder] Datos del recordatorio preparados:', reminderData);
    
    // Usar el endpoint existente de reminders
    // En producción, usar la URL del servidor actual
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.edgarai.com.mx')
      : new URL('http://localhost:3000');
    const remindersUrl = `${baseUrl.origin}/api/reminders`;
    
    console.log('🔍 [Confirmation Reminder] URL del endpoint:', remindersUrl);
    console.log('🔍 [Confirmation Reminder] Enviando petición POST...');
    
    const response = await fetch(remindersUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reminderData)
    });
    
    console.log('🔍 [Confirmation Reminder] Respuesta recibida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al crear recordatorio: ${errorData.error || response.statusText}`);
    }
    
    const reminder = await response.json();
    console.log('✅ [Confirmation Reminder] Recordatorio de confirmación creado:', reminder.reminder_id);
    return { success: true, reminder };
    
  } catch (error) {
    console.error('❌ [Confirmation Reminder] Error creando recordatorio de confirmación:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
} 