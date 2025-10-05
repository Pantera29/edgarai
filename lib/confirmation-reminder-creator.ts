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
    
    // NUEVO: Verificar si el servicio requiere recordatorio de confirmación
    console.log('🔍 [Confirmation Reminder] Verificando configuración del servicio:', params.service_id);
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('service_name, requires_confirmation_reminder')
      .eq('id_uuid', params.service_id)
      .single();

    if (serviceError) {
      console.error('❌ [Confirmation Reminder] Error obteniendo configuración del servicio:', serviceError);
      // Continuar con comportamiento por defecto si hay error
    }

    console.log('🔍 [Confirmation Reminder] Configuración del servicio obtenida:', serviceData);

    // Si el servicio no requiere recordatorio, salir temprano
    if (serviceData && serviceData.requires_confirmation_reminder === false) {
      console.log('🚫 [Confirmation Reminder] Servicio "' + serviceData.service_name + '" no requiere recordatorio de confirmación');
      return { success: true, skipped: true, reason: 'service_config' };
    }
    
    // Obtener configuración de días de confirmación para esta agencia
    console.log('⚙️ [Confirmation Reminder] Obteniendo configuración para agencia:', params.dealership_id);
    const { data: reminderSettings, error: settingsError } = await supabase
      .from('dealership_reminder_settings')
      .select('confirmation_days_before, confirmation_enabled')
      .eq('dealership_id', params.dealership_id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('❌ [Confirmation Reminder] Error obteniendo configuración:', settingsError);
    }

    // Usar configuración personalizada o valores por defecto
    const confirmationDaysBefore = reminderSettings?.confirmation_days_before ?? 1;
    const confirmationEnabled = reminderSettings?.confirmation_enabled ?? true;

    console.log('⚙️ [Confirmation Reminder] Configuración obtenida:', {
      confirmation_days_before: confirmationDaysBefore,
      confirmation_enabled: confirmationEnabled
    });

    // Solo crear recordatorio si está habilitado
    if (!confirmationEnabled) {
      console.log('🚫 [Confirmation Reminder] Recordatorio de confirmación deshabilitado para esta agencia');
      return { success: true, skipped: true };
    }

    // Calcular fecha del recordatorio con configuración personalizada
    const appointmentDate = new Date(params.appointment_date);
    const reminderDate = new Date(appointmentDate);
    reminderDate.setDate(reminderDate.getDate() - confirmationDaysBefore);
    
    console.log('🔍 [Confirmation Reminder] Fechas calculadas:', {
      appointmentDate: appointmentDate.toISOString(),
      confirmation_days_before: confirmationDaysBefore,
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
      notes: `Recordatorio de confirmación para cita del ${params.appointment_date} (${confirmationDaysBefore} día${confirmationDaysBefore > 1 ? 's' : ''} antes)`,
      status: 'pending' as const,
      reminder_type: 'confirmation' as const,
      dealership_id: params.dealership_id
    };
    
    console.log('🔍 [Confirmation Reminder] Datos del recordatorio preparados:', reminderData);
    
    // Usar el endpoint existente de reminders
    // En producción, usar la URL del servidor actual
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://muvi.mx')
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