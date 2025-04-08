import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const licensePlate = searchParams.get('plate');

    if (!licensePlate) {
      return NextResponse.json(
        { message: 'License plate parameter is required' },
        { status: 400 }
      );
    }

    // Buscar el vehículo por su matrícula
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('license_plate', licensePlate)
      .maybeSingle();

    if (vehicleError) {
      console.error('Error fetching vehicle:', vehicleError.message);
      return NextResponse.json(
        { message: 'Error fetching vehicle details', details: vehicleError.message },
        { status: 500 }
      );
    }

    if (!vehicle) {
      return NextResponse.json(
        { message: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Una vez encontrado el vehículo, obtener datos del cliente
    let clientData = null;
    if (vehicle.client_id) {
      const { data: client, error: clientError } = await supabase
        .from('client')
        .select('id, names, email, phone_number')
        .eq('id', vehicle.client_id)
        .maybeSingle();
        
      if (!clientError && client) {
        clientData = client;
      } else if (clientError) {
        console.error('Error fetching client data:', clientError.message);
      }
    }

    // Obtener historial de citas del vehículo
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointment')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        service_id,
        services:service_id (
          id_uuid,
          service_name,
          duration_minutes,
          price
        )
      `)
      .eq('vehicle_id', vehicle.id_uuid)
      .order('appointment_date', { ascending: false });

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError.message);
    }

    // Respuesta completa
    return NextResponse.json({ 
      vehicle: {
        ...vehicle,
        client: clientData,
        appointments: appointments || []
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}