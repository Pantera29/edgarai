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
    
    if (!appointmentId) {
      return NextResponse.json(
        { message: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Verificar si la cita existe
    const { data: appointmentExists, error: checkError } = await supabase
      .from('appointment')
      .select('id')
      .eq('id', appointmentId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking appointment:', checkError.message);
      return NextResponse.json(
        { message: 'Error checking appointment' },
        { status: 500 }
      );
    }

    if (!appointmentExists) {
      return NextResponse.json(
        { message: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Obtener datos del cuerpo de la solicitud
    const updates = await request.json();
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

    // Si no hay campos válidos para actualizar
    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Validar el estado si se está actualizando
    if (filteredUpdates.status) {
      const validStatus: AppointmentStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!validStatus.includes(filteredUpdates.status as AppointmentStatus)) {
        return NextResponse.json(
          { message: 'Invalid status. Allowed values: pending, in_progress, completed, cancelled' },
          { status: 400 }
        );
      }
      
      // Si el estado se actualiza a "cancelled", establecer cancelled_at
      if (filteredUpdates.status === 'cancelled') {
        filteredUpdates.cancelled_at = new Date().toISOString();
      }
    }

    // Si se está reprogramando (cambiando fecha u hora)
    if (filteredUpdates.appointment_date || filteredUpdates.appointment_time) {
      // Obtener la cita actual para tener todos los datos necesarios
      const { data: currentAppointment, error: fetchError } = await supabase
        .from('appointment')
        .select('appointment_date, appointment_time, service_id')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !currentAppointment) {
        return NextResponse.json(
          { message: 'Error fetching current appointment' },
          { status: 500 }
        );
      }

      // Usar los valores actuales para los campos que no se están actualizando
      const newDate = filteredUpdates.appointment_date || currentAppointment.appointment_date;
      const newTime = filteredUpdates.appointment_time || currentAppointment.appointment_time;

      // Verificar disponibilidad (implementación simplificada)
      const { data: existingAppointments, error: availabilityError } = await supabase
        .from('appointment')
        .select('id')
        .eq('appointment_date', newDate)
        .eq('appointment_time', newTime)
        .neq('id', appointmentId);

      if (availabilityError) {
        return NextResponse.json(
          { message: 'Error checking availability' },
          { status: 500 }
        );
      }
    }

    // Actualizar la cita
    const { data, error } = await supabase
      .from('appointment')
      .update(filteredUpdates)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error.message);
      return NextResponse.json(
        { message: 'Failed to update appointment', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Appointment updated successfully',
      appointment: data
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}