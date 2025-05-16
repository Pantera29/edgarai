import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Obtener datos del cuerpo de la solicitud
    const payload = await request.json();
    console.log('🚗 Creando nuevo vehículo:', {
      payload,
      url: request.url
    });

    const { 
      client_id, 
      make, 
      model, 
      year, 
      license_plate, 
      vin, 
      last_km,
      model_id
    } = payload;

    // Validar campos requeridos
    if (!client_id || !make || !model || !year || !license_plate) {
      console.log('❌ Error: Campos requeridos faltantes:', {
        client_id: !client_id,
        make: !make,
        model: !model,
        year: !year,
        license_plate: !license_plate
      });
      return NextResponse.json(
        { message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verificar que el cliente existe y obtener su dealership_id
    console.log('🔍 Verificando existencia del cliente:', client_id);
    const { data: client, error: clientError } = await supabase
      .from('client')
      .select('id, dealership_id')
      .eq('id', client_id)
      .maybeSingle();

    if (clientError) {
      console.error('❌ Error al verificar cliente:', {
        error: clientError.message,
        client_id
      });
      return NextResponse.json(
        { message: 'Error checking client' },
        { status: 500 }
      );
    }

    if (!client) {
      console.log('❌ Cliente no encontrado:', client_id);
      return NextResponse.json(
        { message: 'Client not found' },
        { status: 404 }
      );
    }

    // Verificar si ya existe un vehículo con la misma placa
    console.log('🔍 Verificando placa duplicada:', license_plate);
    const { data: existingVehiclePlate, error: searchPlateError } = await supabase
      .from('vehicles')
      .select('id_uuid')
      .eq('license_plate', license_plate)
      .maybeSingle();

    if (searchPlateError) {
      console.error('❌ Error al buscar vehículo por placa:', {
        error: searchPlateError.message,
        license_plate
      });
      return NextResponse.json(
        { message: 'Error checking for existing vehicle' },
        { status: 500 }
      );
    }

    if (existingVehiclePlate) {
      console.log('❌ Vehículo con placa duplicada:', {
        license_plate,
        existing_id: existingVehiclePlate.id_uuid
      });
      return NextResponse.json(
        { message: 'Vehicle with this license plate already exists', vehicleId: existingVehiclePlate.id_uuid },
        { status: 409 }
      );
    }
    
    // Verificar si ya existe un vehículo con el mismo VIN (solo si se proporciona un VIN)
    if (vin) {
      const { data: existingVehicleVin, error: searchVinError } = await supabase
        .from('vehicles')
        .select('id_uuid')
        .eq('vin', vin)
        .maybeSingle();

      if (searchVinError) {
        console.error('Error searching for existing vehicle by VIN:', searchVinError.message);
        return NextResponse.json(
          { message: 'Error checking for existing vehicle by VIN' },
          { status: 500 }
        );
      }

      if (existingVehicleVin) {
        return NextResponse.json(
          { message: 'Vehicle with this VIN already exists', vehicleId: existingVehicleVin.id_uuid },
          { status: 409 }
        );
      }
    }

    // Crear el vehículo
    console.log('📝 Creando vehículo:', {
      client_id,
      make,
      model,
      year,
      license_plate,
      vin,
      last_km
    });

    const { data: newVehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert([{
        client_id,
        make,
        model,
        year,
        license_plate,
        vin: vin || null,
        last_km: last_km || null,
        dealership_id: client.dealership_id,
        model_id: model_id || null
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error al crear vehículo:', {
        error: insertError.message,
        payload
      });
      return NextResponse.json(
        { message: 'Failed to create vehicle', error: insertError.message },
        { status: 500 }
      );
    }

    console.log('✅ Vehículo creado exitosamente:', {
      id: newVehicle.id_uuid,
      license_plate: newVehicle.license_plate
    });

    return NextResponse.json(
      { message: 'Vehicle created successfully', vehicle: newVehicle },
      { status: 201 }
    );
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