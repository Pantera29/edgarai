import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Definimos los estados permitidos en inglés
type AppointmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

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
        { message: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Verificar si la cita existe
    console.log('🔍 Verificando existencia de la cita:', appointmentId);
    const { data: appointmentExists, error: checkError } = await supabase
      .from('appointment')
      .select('id')
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
        { message: 'Appointment not found' },
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
        { message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Validar el estado si se está actualizando
    if (filteredUpdates.status) {
      const validStatus: AppointmentStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!validStatus.includes(filteredUpdates.status as AppointmentStatus)) {
        console.log('❌ Error: Estado inválido:', filteredUpdates.status);
        return NextResponse.json(
          { message: 'Invalid status. Allowed values: pending, in_progress, completed, cancelled' },
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
        .select('appointment_date, appointment_time, service_id')
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

      // Verificar disponibilidad
      const { data: existingAppointments, error: availabilityError } = await supabase
        .from('appointment')
        .select('id')
        .eq('appointment_date', newDate)
        .eq('appointment_time', newTime)
        .neq('id', appointmentId);

      if (availabilityError) {
        console.error('❌ Error al verificar disponibilidad:', {
          error: availabilityError.message,
          date: newDate,
          time: newTime
        });
        return NextResponse.json(
          { message: 'Error checking availability' },
          { status: 500 }
        );
      }

      if (existingAppointments && existingAppointments.length > 0) {
        console.log('❌ Horario no disponible:', {
          date: newDate,
          time: newTime,
          existingAppointments: existingAppointments.length
        });
        return NextResponse.json(
          { message: 'Time slot is not available' },
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
      .select()
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