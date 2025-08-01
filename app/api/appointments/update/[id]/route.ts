import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createAutomaticReminder } from '@/lib/simple-reminder-creator';
import { createConfirmationReminder } from '@/lib/confirmation-reminder-creator';
import { resolveWorkshopId } from '@/lib/workshop-resolver';

// Definimos los estados permitidos en inglés
type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const appointmentId = params.id;
    
    console.log('📅 Actualizando cita:', {
      id: appointmentId,
      url: request.url
    });

    if (!appointmentId) {
      console.log('❌ Error: ID de cita no proporcionado');
      return NextResponse.json(
        { message: 'Appointment ID is required. Please provide a valid appointment ID in the URL.' },
        { status: 400 }
      );
    }

    // Verificar si la cita existe
    console.log('🔍 Verificando existencia de la cita:', appointmentId);
    const { data: appointmentExists, error: checkError } = await supabase
      .from('appointment')
      .select('id, status, service_id')
      .eq('id', appointmentId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error al verificar cita:', {
        error: checkError.message,
        appointmentId
      });
      return NextResponse.json(
        { message: 'Error checking appointment' },
        { status: 500 }
      );
    }

    if (!appointmentExists) {
      console.log('❌ Cita no encontrada:', appointmentId);
      return NextResponse.json(
        { message: 'Appointment not found. Please verify the appointment ID or check if the appointment exists.' },
        { status: 404 }
      );
    }

    // Obtener datos del cuerpo de la solicitud
    const updates = await request.json();
    console.log('📝 Payload de actualización recibido:', updates);

    const allowedFields = [
      'status',
      'appointment_date',
      'appointment_time',
      'notes',
      'service_id',
      'workshop_id'
    ];

    // Filtrar solo los campos permitidos
    const filteredUpdates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    console.log('🔍 Campos a actualizar:', filteredUpdates);

    // Si no hay campos válidos para actualizar
    if (Object.keys(filteredUpdates).length === 0) {
      console.log('❌ Error: No hay campos válidos para actualizar');
      return NextResponse.json(
        { message: 'No valid fields to update. Please provide at least one of: status, appointment_date, appointment_time, notes, workshop_id.' },
        { status: 400 }
      );
    }

    // Validar el estado si se está actualizando
    if (filteredUpdates.status) {
      const validStatus: AppointmentStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatus.includes(filteredUpdates.status as AppointmentStatus)) {
        console.log('❌ Error: Estado inválido:', filteredUpdates.status);
        return NextResponse.json(
          { message: 'Invalid status. Allowed values: pending, confirmed, in_progress, completed, cancelled. Please use one of these valid status values.' },
          { status: 400 }
        );
      }
      
      // Si el estado se actualiza a "cancelled", establecer cancelled_at
      if (filteredUpdates.status === 'cancelled') {
        filteredUpdates.cancelled_at = new Date().toISOString();
        console.log('📝 Estableciendo fecha de cancelación:', filteredUpdates.cancelled_at);
      }
    }

    // Si se está reprogramando (cambiando fecha u hora) O cambiando de taller
    // PERO NO cuando solo se está cancelando
    if ((filteredUpdates.appointment_date || filteredUpdates.appointment_time || filteredUpdates.workshop_id) && 
        filteredUpdates.status !== 'cancelled') {
      console.log('🔍 Verificando disponibilidad para reprogramación o cambio de taller');
      
      // Obtener la cita actual para tener todos los datos necesarios
      const { data: currentAppointment, error: fetchError } = await supabase
        .from('appointment')
        .select('appointment_date, appointment_time, service_id, client_id, workshop_id')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !currentAppointment) {
        console.error('❌ Error al obtener cita actual:', {
          error: fetchError?.message,
          appointmentId
        });
        return NextResponse.json(
          { message: 'Error fetching current appointment' },
          { status: 500 }
        );
      }

      // Usar los valores actuales para los campos que no se están actualizando
      const newDate = filteredUpdates.appointment_date || currentAppointment.appointment_date;
      const newTime = filteredUpdates.appointment_time || currentAppointment.appointment_time;
      const newWorkshopId = filteredUpdates.workshop_id || currentAppointment.workshop_id;

      console.log('🔍 Verificando disponibilidad:', {
        date: newDate,
        time: newTime,
        workshop_id: newWorkshopId,
        appointmentId
      });

      // Si se está cambiando de taller, validar que el nuevo taller pertenezca al mismo dealership
      if (filteredUpdates.workshop_id && filteredUpdates.workshop_id !== currentAppointment.workshop_id) {
        console.log('🏭 Validando cambio de taller:', {
          oldWorkshopId: currentAppointment.workshop_id,
          newWorkshopId: filteredUpdates.workshop_id
        });

        // Obtener el dealership_id del cliente
        const { data: client, error: clientError } = await supabase
          .from('client')
          .select('dealership_id')
          .eq('id', currentAppointment.client_id)
          .single();

        if (clientError || !client) {
          console.error('❌ Error al obtener información del cliente:', {
            error: clientError?.message,
            clientId: currentAppointment.client_id
          });
          return NextResponse.json(
            { message: 'Error fetching client information' },
            { status: 500 }
          );
        }

        // Verificar que el nuevo taller pertenezca al mismo dealership
        const { data: workshopConfig, error: workshopError } = await supabase
          .from('dealership_configuration')
          .select('workshop_id')
          .eq('workshop_id', filteredUpdates.workshop_id)
          .eq('dealership_id', client.dealership_id)
          .maybeSingle();

        if (workshopError) {
          console.error('❌ Error al verificar taller:', workshopError);
          return NextResponse.json(
            { message: 'Error verifying workshop' },
            { status: 500 }
          );
        }

        if (!workshopConfig) {
          console.log('❌ Taller no válido para este dealership:', {
            workshop_id: filteredUpdates.workshop_id,
            dealership_id: client.dealership_id
          });
          return NextResponse.json(
            { message: 'Invalid workshop for this dealership. Please select a valid workshop.' },
            { status: 400 }
          );
        }

        console.log('✅ Taller válido para el dealership');
      }

      // Obtener el dealership_id del cliente
      console.log('🔍 Consultando información del cliente:', {
        client_id: currentAppointment.client_id
      });

      const { data: clientDetails, error: clientDetailsError } = await supabase
        .from('client')
        .select('*')
        .eq('id', currentAppointment.client_id)
        .single();

      console.log('📊 Detalles del cliente:', {
        client: clientDetails,
        error: clientDetailsError
      });

      const { data: client, error: clientError } = await supabase
        .from('client')
        .select('dealership_id')
        .eq('id', currentAppointment.client_id)
        .single();

      if (clientError || !client) {
        console.error('❌ Error al obtener información del cliente:', {
          error: clientError?.message,
          clientId: currentAppointment.client_id
        });
        return NextResponse.json(
          { message: 'Error fetching client information' },
          { status: 500 }
        );
      }

      console.log('📊 Información del cliente obtenida:', {
        client_id: currentAppointment.client_id,
        dealership_id: client.dealership_id,
        dealership_id_length: client.dealership_id?.length,
        dealership_id_last_chars: client.dealership_id?.slice(-4)
      });

      // Verificar disponibilidad usando el endpoint de disponibilidad con workshop_id
      const baseUrl = new URL(request.url).origin;
      const availabilityParams = new URLSearchParams({
        date: newDate,
        service_id: currentAppointment.service_id,
        dealership_id: client.dealership_id
      });

      // Agregar workshop_id si se está especificando
      if (newWorkshopId) {
        availabilityParams.append('workshop_id', newWorkshopId);
      }

      const availabilityUrl = `${baseUrl}/api/appointments/availability?${availabilityParams}`;

      console.log('🔍 URL de disponibilidad:', {
        url: availabilityUrl,
        dealership_id: client.dealership_id,
        workshop_id: newWorkshopId,
        dealership_id_length: client.dealership_id?.length,
        dealership_id_last_chars: client.dealership_id?.slice(-4)
      });

      const availabilityResponse = await fetch(
        availabilityUrl,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📊 Respuesta de disponibilidad:', {
        status: availabilityResponse.status,
        statusText: availabilityResponse.statusText,
        url: availabilityResponse.url,
        params: {
          date: newDate,
          service_id: currentAppointment.service_id,
          dealership_id: client.dealership_id
        }
      });

      if (!availabilityResponse.ok) {
        const errorData = await availabilityResponse.text();
        console.error('❌ Error al verificar disponibilidad:', {
          status: availabilityResponse.status,
          statusText: availabilityResponse.statusText,
          errorData
        });
        return NextResponse.json(
          { message: 'Error checking availability', details: errorData },
          { status: 500 }
        );
      }

      const availabilityData = await availabilityResponse.json();
      console.log('📊 Datos de disponibilidad recibidos:', availabilityData);
      
      // Verificar si el horario solicitado está disponible
      const isTimeAvailable = availabilityData.availableSlots.includes(newTime);
      
      if (!isTimeAvailable) {
        console.log('❌ Horario no disponible:', {
          date: newDate,
          time: newTime,
          availableSlots: availabilityData.availableSlots
        });
        return NextResponse.json(
          { message: 'Time slot is not available. Please try a different time. You might check 30 minutes prior or after.' },
          { status: 409 }
        );
      }

      // Validación de límite diario cuando se cambia el service_id
      if (filteredUpdates.service_id && filteredUpdates.service_id !== currentAppointment.service_id) {
        console.log('🔍 Validando límite diario para cambio de servicio:', {
          newServiceId: filteredUpdates.service_id,
          oldServiceId: currentAppointment.service_id
        });

        // Obtener información del nuevo servicio
        const { data: newService, error: newServiceError } = await supabase
          .from('services')
          .select('daily_limit')
          .eq('id_uuid', filteredUpdates.service_id)
          .single();

        if (newServiceError) {
          console.error('❌ Error al obtener información del nuevo servicio:', newServiceError);
          return NextResponse.json(
            { message: 'Error fetching new service information' },
            { status: 500 }
          );
        }

        // Si el nuevo servicio tiene límite diario, verificarlo
        if (newService.daily_limit) {
          const appointmentDate = filteredUpdates.appointment_date || currentAppointment.appointment_date;
          
          const { data: sameServiceAppointments, error: countError } = await supabase
            .from('appointment')
            .select('id')
            .eq('service_id', filteredUpdates.service_id)
            .eq('appointment_date', appointmentDate)
            .neq('id', appointmentId); // Excluir la cita actual

          if (countError) {
            console.error('❌ Error al contar citas del mismo servicio:', countError);
            return NextResponse.json(
              { message: 'Error checking daily service limit' },
              { status: 500 }
            );
          }

          if (sameServiceAppointments.length >= newService.daily_limit) {
            console.log('❌ Límite diario alcanzado para el nuevo servicio:', {
              serviceId: filteredUpdates.service_id,
              dailyLimit: newService.daily_limit,
              currentCount: sameServiceAppointments.length
            });
            
            return NextResponse.json(
              { message: `Daily limit reached for this service (${newService.daily_limit} appointments per day). Please choose a different date or service.` },
              { status: 409 }
            );
          }
        }
      }
    }

    // Actualizar la cita
    console.log('📝 Actualizando cita:', {
      id: appointmentId,
      updates: filteredUpdates
    });

    const { data, error } = await supabase
      .from('appointment')
      .update(filteredUpdates)
      .eq('id', appointmentId)
      .select(`
        *,
        client:client_id (
          id,
          dealership_id
        ),
        vehicle:vehicle_id (
          id_uuid
        ),
        service:service_id (
          id_uuid
        )
      `)
      .single();

    if (error) {
      console.error('❌ Error al actualizar cita:', {
        error: error.message,
        appointmentId,
        updates: filteredUpdates
      });
      return NextResponse.json(
        { message: 'Failed to update appointment', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Cita actualizada exitosamente:', {
      id: data.id,
      date: data.appointment_date,
      time: data.appointment_time,
      status: data.status
    });

    // NUEVO: Manejar recordatorios de confirmación en reagendamiento
    if (filteredUpdates.appointment_date) {
      const newAppointmentDate = new Date(filteredUpdates.appointment_date);
      const today = new Date();
      
      // Normalizar fechas para comparar solo el día
      const newDateOnly = new Date(newAppointmentDate.getFullYear(), newAppointmentDate.getMonth(), newAppointmentDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      try {
        if (newDateOnly > todayOnly) {
          // Nueva fecha es futura - actualizar o crear recordatorio
          const newReminderDate = new Date(newAppointmentDate);
          newReminderDate.setDate(newReminderDate.getDate() - 1);
          
          // Intentar actualizar recordatorio existente
          const { data: updatedReminder, error: updateError } = await supabase
            .from('reminders')
            .update({
              reminder_date: newReminderDate.toISOString().split('T')[0],
              base_date: filteredUpdates.appointment_date,
              notes: `Recordatorio de confirmación para cita reagendada al ${filteredUpdates.appointment_date}`,
              status: 'pending' // Resetear a pending si estaba cancelled
            })
            .eq('appointment_id', appointmentId)
            .eq('reminder_type', 'confirmation')
            .select()
            .maybeSingle();
          
          if (updateError && updateError.code !== 'PGRST116') {
            console.error('Error actualizando recordatorio:', updateError);
          } else if (!updatedReminder) {
            // No existía recordatorio, crear uno nuevo
            await createConfirmationReminder({
              appointment_id: appointmentId,
              client_id: data.client.id,
              vehicle_id: data.vehicle.id_uuid,
              service_id: data.service.id_uuid,
              appointment_date: filteredUpdates.appointment_date,
              dealership_id: data.client.dealership_id
            });
            console.log('✅ Nuevo recordatorio creado para cita reagendada');
          } else {
            console.log('✅ Recordatorio actualizado para nueva fecha');
          }
          
        } else {
          // Nueva fecha es para hoy - cancelar recordatorio
          await supabase
            .from('reminders')
            .update({ 
              status: 'cancelled',
              notes: 'Cancelado: cita reagendada para hoy'
            })
            .eq('appointment_id', appointmentId)
            .eq('reminder_type', 'confirmation');
          
          console.log('🚫 Recordatorio cancelado: cita reagendada para hoy');
        }
        
      } catch (error) {
        console.log('⚠️ Error manejando recordatorio en reagendamiento:', error);
      }
    }

    // Si la cita se marcó como completada, crear recordatorio automático y transacción
    if (filteredUpdates.status === 'completed' && appointmentExists.status !== 'completed') {
      console.log('🔔 Cita completada, creando recordatorio automático y transacción...');
      
      try {
        // 1. Crear recordatorio automático
        const reminderResult = await createAutomaticReminder({
          appointment_id: data.id,
          client_id: data.client.id,
          vehicle_id: data.vehicle.id_uuid,
          service_id: data.service.id_uuid,
          appointment_date: data.appointment_date,
          dealership_id: data.client.dealership_id
        }, request);

        if (reminderResult.success) {
          console.log('✅ Recordatorio automático creado exitosamente:', reminderResult.reminder);
        } else {
          console.log('⚠️ No se pudo crear recordatorio:', reminderResult.error);
        }

        // 2. Crear transacción automática
        console.log('💰 Creando transacción automática...');
        const { data: transaction, error: transactionError } = await supabase
          .from('service_transactions')
          .insert({
            appointment_id: data.id,
            transaction_date: data.appointment_date,
            notes: 'Transacción creada automáticamente al completar la cita',
            dealership_id: data.client.dealership_id
          })
          .select(`
            *,
            specific_services (
              service_name,
              kilometers,
              months,
              price
            )
          `)
          .single();

        if (transactionError) {
          console.error('❌ Error al crear transacción automática:', transactionError);
          // No fallamos la actualización de la cita si falla la transacción
        } else {
          console.log('✅ Transacción automática creada exitosamente:', transaction);

          // 3. Crear registro NPS
          console.log('📊 Creando registro NPS...');
          try {
            const npsResponse = await fetch(`${new URL(request.url).origin}/api/nps/create`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || ''
              },
              body: JSON.stringify({
                transaction_id: transaction.transaction_id,
                customer_id: data.client.id
              })
            });

            if (!npsResponse.ok) {
              console.error('❌ Error al crear registro NPS:', await npsResponse.text());
            } else {
              console.log('✅ Registro NPS creado exitosamente');
            }
          } catch (npsError) {
            console.error('❌ Error en proceso de creación de NPS:', npsError);
            // No fallamos la actualización de la cita si falla la creación del NPS
          }

          // 4. Crear recordatorio NPS con configuración personalizada por agencia
          try {
            console.log('📊 [NPS Reminder] Obteniendo configuración de días para agencia:', data.client.dealership_id);
            
            // Obtener configuración de días NPS para esta agencia
            const { data: reminderSettings, error: settingsError } = await supabase
              .from('dealership_reminder_settings')
              .select('nps_days_after, nps_enabled')
              .eq('dealership_id', data.client.dealership_id)
              .single();

            if (settingsError && settingsError.code !== 'PGRST116') {
              console.error('❌ [NPS Reminder] Error obteniendo configuración:', settingsError);
            }

            // Usar configuración personalizada o valores por defecto
            const npsDaysAfter = reminderSettings?.nps_days_after ?? 1;
            const npsEnabled = reminderSettings?.nps_enabled ?? true;

            console.log('⚙️ [NPS Reminder] Configuración obtenida:', {
              nps_days_after: npsDaysAfter,
              nps_enabled: npsEnabled,
              dealership_id: data.client.dealership_id
            });

            // Solo crear recordatorio si está habilitado
            if (npsEnabled) {
              const appointmentDate = new Date(data.appointment_date);
              const npsReminderDate = new Date(appointmentDate);
              npsReminderDate.setDate(npsReminderDate.getDate() + npsDaysAfter);

              console.log('📅 [NPS Reminder] Fechas calculadas:', {
                appointment_date: data.appointment_date,
                nps_days_after: npsDaysAfter,
                reminder_date: npsReminderDate.toISOString().split('T')[0]
              });

              const { data: npsReminder, error: npsReminderError } = await supabase
                .from('reminders')
                .insert({
                  client_id_uuid: data.client.id,
                  vehicle_id: data.vehicle.id_uuid,
                  service_id: data.service.id_uuid,
                  base_date: data.appointment_date,
                  reminder_date: npsReminderDate.toISOString().split('T')[0],
                  notes: `Recordatorio NPS post-servicio (${npsDaysAfter} día${npsDaysAfter > 1 ? 's' : ''} después)`,
                  status: 'pending',
                  reminder_type: 'nps',
                  dealership_id: data.client.dealership_id
                })
                .select()
                .single();

              if (npsReminderError) {
                console.error('❌ [NPS Reminder] Error al crear recordatorio NPS:', npsReminderError);
              } else {
                console.log('✅ [NPS Reminder] Recordatorio NPS creado exitosamente:', {
                  reminder_id: npsReminder?.reminder_id,
                  days_after: npsDaysAfter,
                  reminder_date: npsReminderDate.toISOString().split('T')[0]
                });
              }
            } else {
              console.log('🚫 [NPS Reminder] Recordatorio NPS deshabilitado para esta agencia');
            }
          } catch (npsReminderCatchError) {
            console.error('❌ [NPS Reminder] Error inesperado al crear recordatorio NPS:', npsReminderCatchError);
          }
        }

      } catch (error) {
        // IMPORTANTE: No fallar la actualización de la cita si falla el recordatorio o la transacción
        console.error('❌ Error en proceso automático:', error);
      }
    }

    return NextResponse.json({ 
      message: 'Appointment updated successfully',
      appointment: data
    });
    
  } catch (error) {
    console.error('💥 Error inesperado:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}