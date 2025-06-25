import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createAutomaticReminder } from '@/lib/simple-reminder-creator';

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
      .select('id, status')
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
      'notes'
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
        { message: 'No valid fields to update. Please provide at least one of: status, appointment_date, appointment_time, notes.' },
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

    // Si se está reprogramando (cambiando fecha u hora)
    if (filteredUpdates.appointment_date || filteredUpdates.appointment_time) {
      console.log('🔍 Verificando disponibilidad para reprogramación');
      
      // Obtener la cita actual para tener todos los datos necesarios
      const { data: currentAppointment, error: fetchError } = await supabase
        .from('appointment')
        .select('appointment_date, appointment_time, service_id, client_id')
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

      console.log('🔍 Verificando disponibilidad:', {
        date: newDate,
        time: newTime,
        appointmentId
      });

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

      // Verificar disponibilidad usando el endpoint de disponibilidad
      const baseUrl = new URL(request.url).origin;
      const availabilityUrl = `${baseUrl}/api/appointments/availability?` + 
        new URLSearchParams({
          date: newDate,
          service_id: currentAppointment.service_id,
          dealership_id: client.dealership_id
        });

      console.log('🔍 URL de disponibilidad:', {
        url: availabilityUrl,
        dealership_id: client.dealership_id,
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