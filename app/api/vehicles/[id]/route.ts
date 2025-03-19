import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const vehicleId = params.id;

    if (!vehicleId) {
      return NextResponse.json(
        { message: 'Vehicle ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching vehicle with ID: ${vehicleId}`);

    // Simplificamos al máximo: obtener solo datos del vehículo sin relaciones
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id_uuid', vehicleId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching vehicle:', error.message);
      return NextResponse.json(
        { message: 'Error fetching vehicle details', details: error.message },
        { status: 500 }
      );
    }

    if (!vehicle) {
      return NextResponse.json(
        { message: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Una vez confirmado que podemos obtener el vehículo, intentamos obtener datos del cliente
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

    // Respuesta completa
    return NextResponse.json({ 
      vehicle: {
        ...vehicle,
        client: clientData
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