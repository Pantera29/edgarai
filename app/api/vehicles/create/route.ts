import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Obtener datos del cuerpo de la solicitud
    const { 
      client_id, 
      make, 
      model, 
      year, 
      license_plate, 
      vin, 
      last_km 
    } = await request.json();

    // Validar campos requeridos
    if (!client_id || !make || !model || !year || !license_plate) {
      return NextResponse.json(
        { message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verificar que el cliente existe
    const { data: client, error: clientError } = await supabase
      .from('client')
      .select('id')
      .eq('id', client_id)
      .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json(
        { message: 'Client not found or error checking client' },
        { status: 404 }
      );
    }

    // Verificar si ya existe un vehículo con la misma placa
    const { data: existingVehiclePlate, error: searchPlateError } = await supabase
      .from('vehicles')
      .select('id_uuid')
      .eq('license_plate', license_plate)
      .maybeSingle();

    if (searchPlateError) {
      console.error('Error searching for existing vehicle by plate:', searchPlateError.message);
      return NextResponse.json(
        { message: 'Error checking for existing vehicle' },
        { status: 500 }
      );
    }

    if (existingVehiclePlate) {
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

    // Crear nuevo vehículo
    const { data: newVehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert([{ 
        client_id, 
        make, 
        model, 
        year, 
        license_plate, 
        vin: vin || null, 
        last_km: last_km || 0 
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting vehicle:', insertError.message);
      return NextResponse.json(
        { message: 'Failed to create vehicle', error: insertError.message },
        { status: 500 }
      );
    }

    // Devolver vehículo creado
    return NextResponse.json(
      { message: 'Vehicle created successfully', vehicle: newVehicle },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}