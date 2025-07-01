import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const licensePlate = searchParams.get('plate');
    const vin = searchParams.get('vin');

    console.log('🚗 Buscando vehículo por placa o VIN:', {
      plate: licensePlate,
      vin: vin,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    if (!licensePlate && !vin) {
      console.log('❌ Error: Placa o VIN no proporcionados');
      return NextResponse.json(
        { message: 'License plate or VIN parameter is required in URL query. Usage: /api/vehicles/find-by-plate?plate={license_plate} OR /api/vehicles/find-by-plate?vin={vin}. The plate should match exactly as registered (case-sensitive).' },
        { status: 400 }
      );
    }

    // Buscar el vehículo por su matrícula o VIN
    let query = supabase.from('vehicles').select('*');
    
    if (licensePlate) {
      console.log('🔍 Consultando vehículo por placa en la base de datos:', licensePlate);
      query = query.eq('license_plate', licensePlate);
    } else if (vin) {
      console.log('🔍 Consultando vehículo por VIN en la base de datos:', vin);
      query = query.eq('vin', vin);
    }
    
    const { data: vehicle, error: vehicleError } = await query.maybeSingle();

    if (vehicleError) {
      console.error('❌ Error al obtener vehículo:', {
        error: vehicleError.message,
        plate: licensePlate,
        vin: vin
      });
      return NextResponse.json(
        { message: 'Error fetching vehicle details from database. This is a temporary system issue. Please verify the license plate or VIN format and try again. If the vehicle doesn\'t exist, you can create it at /api/vehicles/create', details: vehicleError.message },
        { status: 500 }
      );
    }

    if (!vehicle) {
      const searchTerm = licensePlate || vin;
      console.log('ℹ️ Vehículo no encontrado:', searchTerm);
      return NextResponse.json(
        { message: `Vehicle not found with the provided ${licensePlate ? 'license plate' : 'VIN'}. Please verify the ${licensePlate ? 'plate number' : 'VIN'} is correct (case-sensitive). You can create a new vehicle at /api/vehicles/create (requires: client_id, model, year, license_plate)` },
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
      vin: vehicle.vin,
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
        message: 'Internal server error during vehicle search. Please verify the license plate or VIN format and try again. If the vehicle doesn\'t exist, you can create it at /api/vehicles/create', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}