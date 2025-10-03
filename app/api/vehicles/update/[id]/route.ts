import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const vehicleId = params.id;
    
    console.log('🚗 Actualizando vehículo:', {
      id: vehicleId,
      url: request.url
    });

    if (!vehicleId) {
      console.log('❌ Error: ID de vehículo no proporcionado');
      return NextResponse.json(
        { message: 'Vehicle ID is required in URL path. Usage: /api/vehicles/update/{vehicle_id}. You can find vehicle IDs by searching with license plate at /api/vehicles/find-by-plate?plate={license_plate}' },
        { status: 400 }
      );
    }

    // Obtener datos del cuerpo de la solicitud
    const updates = await request.json();
    console.log('📝 Payload de actualización recibido:', updates);

    const allowedFields = [
      'client_id',
      'make',
      'model',
      'year',
      'license_plate',
      'vin',
      'last_km'
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
        { message: 'No valid fields to update. Allowed fields: client_id, make, model, year, license_plate, vin, last_km. Please provide at least one of these fields in the request body.' },
        { status: 400 }
      );
    }

    // Verificar si el vehículo existe y obtener su dealership_id
    console.log('🔍 Verificando existencia del vehículo:', vehicleId);
    const { data: vehicleExists, error: checkError } = await supabase
      .from('vehicles')
      .select('id_uuid, dealership_id')
      .eq('id_uuid', vehicleId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error al verificar vehículo:', {
        error: checkError.message,
        vehicleId
      });
      return NextResponse.json(
        { message: 'Error checking vehicle existence in database. This is a temporary system issue. Please verify the vehicle ID is correct. You can search for vehicles at /api/vehicles/find-by-plate?plate={license_plate}' },
        { status: 500 }
      );
    }

    if (!vehicleExists) {
      console.log('❌ Vehículo no encontrado:', vehicleId);
      return NextResponse.json(
        { message: 'Vehicle not found with the provided ID. Please verify the vehicle ID is correct. You can search for vehicles by license plate at /api/vehicles/find-by-plate?plate={license_plate} or create a new vehicle at /api/vehicles/create' },
        { status: 404 }
      );
    }

    // Si se va a actualizar client_id, verificar que el cliente existe
    if (filteredUpdates.client_id) {
      console.log('🔍 Verificando existencia del cliente:', filteredUpdates.client_id);
      const { data: clientExists, error: clientCheckError } = await supabase
        .from('client')
        .select('id')
        .eq('id', filteredUpdates.client_id)
        .maybeSingle();

      if (clientCheckError) {
        console.error('❌ Error al verificar cliente:', {
          error: clientCheckError.message,
          clientId: filteredUpdates.client_id
        });
        return NextResponse.json(
          { message: 'Error checking client existence in database. This is a temporary system issue. Please verify the client_id is correct. You can find clients at /api/customers/verify?phone={phone_number}' },
          { status: 500 }
        );
      }

      if (!clientExists) {
        console.log('❌ Cliente no encontrado:', filteredUpdates.client_id);
        return NextResponse.json(
          { message: 'Client not found with the provided client_id. Please verify the ID is correct. You can search for clients by phone at /api/customers/verify?phone={phone_number} or create a new client at /api/customers/create' },
          { status: 404 }
        );
      }
    }

    // Si se va a actualizar license_plate, verificar que no exista ya en la misma agencia (solo si no está vacío)
    if (filteredUpdates.license_plate && filteredUpdates.license_plate.trim() !== '') {
      console.log('🔍 Verificando placa duplicada en la agencia:', filteredUpdates.license_plate);
      const { data: plateExists, error: plateCheckError } = await supabase
        .from('vehicles')
        .select('id_uuid')
        .eq('license_plate', filteredUpdates.license_plate)
        .eq('dealership_id', vehicleExists.dealership_id)
        .neq('id_uuid', vehicleId)
        .maybeSingle();

      if (plateCheckError) {
        console.error('❌ Error al verificar placa:', {
          error: plateCheckError.message,
          license_plate: filteredUpdates.license_plate
        });
        return NextResponse.json(
          { message: 'Error checking license plate uniqueness in database. This is a temporary system issue. Please verify the license plate format and try again. Each vehicle must have a unique license plate within the same dealership.' },
          { status: 500 }
        );
      }

      if (plateExists) {
        console.log('❌ Placa duplicada encontrada en la misma agencia:', {
          license_plate: filteredUpdates.license_plate,
          dealership_id: vehicleExists.dealership_id,
          existing_id: plateExists.id_uuid
        });
        return NextResponse.json(
          { message: 'License plate already exists on another vehicle in this dealership. Each license plate must be unique within the same dealership. Please use a different plate or update the existing vehicle at /api/vehicles/find-by-plate?plate={license_plate}' },
          { status: 409 }
        );
      }
    }

    // Si se va a actualizar VIN, verificar que no exista ya en la misma agencia (solo si no está vacío)
    if (filteredUpdates.vin && filteredUpdates.vin.trim() !== '') {
      console.log('🔍 Verificando VIN duplicado en la agencia:', filteredUpdates.vin);
      const { data: vinExists, error: vinCheckError } = await supabase
        .from('vehicles')
        .select('id_uuid')
        .eq('vin', filteredUpdates.vin)
        .eq('dealership_id', vehicleExists.dealership_id)
        .neq('id_uuid', vehicleId)
        .maybeSingle();

      if (vinCheckError) {
        console.error('❌ Error al verificar VIN:', {
          error: vinCheckError.message,
          vin: filteredUpdates.vin
        });
        return NextResponse.json(
          { message: 'Error checking VIN uniqueness in database. This is a temporary system issue. Please verify the VIN format and try again. Each vehicle must have a unique VIN number within the same dealership.' },
          { status: 500 }
        );
      }

      if (vinExists) {
        console.log('❌ VIN duplicado encontrado en la misma agencia:', {
          vin: filteredUpdates.vin,
          dealership_id: vehicleExists.dealership_id,
          existing_id: vinExists.id_uuid
        });
        return NextResponse.json(
          { message: 'VIN already exists on another vehicle in this dealership. Each VIN must be unique within the same dealership. Please use a different VIN or verify you\'re updating the correct vehicle. You can search for the existing vehicle by its details.' },
          { status: 409 }
        );
      }
    }

    // Convertir VIN y placa vacíos a null para evitar problemas con constraints únicos
    if (filteredUpdates.vin === '') {
      filteredUpdates.vin = null;
    }
    if (filteredUpdates.license_plate === '') {
      filteredUpdates.license_plate = null;
    }

    // Actualizar el vehículo
    console.log('📝 Actualizando vehículo:', {
      id: vehicleId,
      updates: filteredUpdates
    });

    const { data, error } = await supabase
      .from('vehicles')
      .update(filteredUpdates)
      .eq('id_uuid', vehicleId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error al actualizar vehículo:', {
        error: error.message,
        vehicleId,
        updates: filteredUpdates
      });
      return NextResponse.json(
        { message: 'Failed to update vehicle in database. This may be due to data validation or system issues. Please verify all field formats and ensure license_plate and VIN are unique. Check that the client_id exists at /api/customers/verify?phone={phone_number}', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Vehículo actualizado exitosamente:', {
      id: data.id_uuid,
      license_plate: data.license_plate
    });

    return NextResponse.json({ 
      message: 'Vehicle updated successfully',
      vehicle: data
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
      { message: 'Internal server error during vehicle update. Please verify the vehicle ID and all field formats, then try again. You can check vehicle existence at /api/vehicles/find-by-plate?plate={license_plate}' },
      { status: 500 }
    );
  }
}