import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const licensePlate = searchParams.get('plate');

    console.log('🚗 Buscando vehículo por placa:', {
      plate: licensePlate,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    if (!licensePlate) {
      console.log('❌ Error: Placa no proporcionada');
      return NextResponse.json(
        { message: 'License plate parameter is required' },
        { status: 400 }
      );
    }

    // Buscar el vehículo por su matrícula
    console.log('🔍 Consultando vehículo en la base de datos:', licensePlate);
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('license_plate', licensePlate)
      .maybeSingle();

    if (vehicleError) {
      console.error('❌ Error al obtener vehículo:', {
        error: vehicleError.message,
        plate: licensePlate
      });
      return NextResponse.json(
        { message: 'Error fetching vehicle details', details: vehicleError.message },
        { status: 500 }
      );
    }

    if (!vehicle) {
      console.log('ℹ️ Vehículo no encontrado:', licensePlate);
      return NextResponse.json(
        { message: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Una vez encontrado el vehículo, obtener datos del cliente
    console.log('🔍 Obteniendo datos del cliente:', vehicle.client_id);
    let clientData = null;
    if (vehicle.client_id) {
      const { data: client, error: clientError } = await supabase
        .from('client')
        .select('id, names, email, phone_number')
        .eq('id', vehicle.client_id)
        .maybeSingle();
        
      if (!clientError && client) {
        clientData = client;
        console.log('✅ Datos del cliente obtenidos:', {
          id: client.id,
          name: client.names
        });
      } else if (clientError) {
        console.error('❌ Error al obtener datos del cliente:', {
          error: clientError.message,
          clientId: vehicle.client_id
        });
      }
    }

    // Obtener historial de citas del vehículo
    console.log('🔍 Obteniendo historial de citas del vehículo:', vehicle.id_uuid);
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
      console.error('❌ Error al obtener citas:', {
        error: appointmentsError.message,
        vehicleId: vehicle.id_uuid
      });
    }

    console.log('✅ Búsqueda completada:', {
      vehicleId: vehicle.id_uuid,
      plate: vehicle.license_plate,
      hasClientData: !!clientData,
      appointmentsCount: appointments?.length || 0
    });

    // Respuesta completa
    return NextResponse.json({ 
      vehicle: {
        ...vehicle,
        client: clientData,
        appointments: appointments || []
      }
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
      { 
        message: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}