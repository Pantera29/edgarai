import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener datos del vehículo con información del cliente
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select(`
        *,
        client:client_id (
          id,
          names,
          phone_number,
          email
        )
      `)
      .eq('id_uuid', params.id)
      .single()

    if (vehicleError) {
      console.error('Error al obtener vehículo:', vehicleError)
      return NextResponse.json(
        { error: 'No se pudo obtener la información del vehículo' },
        { status: 404 }
      )
    }

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado' },
        { status: 404 }
      )
    }

    // Obtener todas las citas del vehículo ordenadas por fecha (más reciente primero)
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointment')
      .select(`
        *,
        service:service_id (
          id_uuid,
          service_name,
          description,
          duration_minutes,
          price
        ),
        specific_service:specific_service_id (
          id,
          service_name,
          kilometers,
          months,
          price,
          additional_price,
          additional_description,
          includes_additional
        )
      `)
      .eq('vehicle_id', params.id)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })

    if (appointmentsError) {
      console.error('Error al obtener citas:', appointmentsError)
      return NextResponse.json(
        { error: 'No se pudo obtener el historial de citas' },
        { status: 500 }
      )
    }

    // Obtener recordatorios relacionados con el vehículo
    const { data: reminders, error: remindersError } = await supabase
      .from('reminders')
      .select(`
        *,
        service:service_id (
          service_name
        )
      `)
      .eq('vehicle_id', params.id)
      .order('reminder_date', { ascending: false })

    if (remindersError) {
      console.error('Error al obtener recordatorios:', remindersError)
      // No es crítico, continuamos sin recordatorios
    }

    return NextResponse.json({
      vehicle,
      appointments: appointments || [],
      reminders: reminders || []
    })

  } catch (error) {
    console.error('Error en endpoint de vehículo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
