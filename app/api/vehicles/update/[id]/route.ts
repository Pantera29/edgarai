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
        { message: 'Vehicle ID is required' },
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
        { message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Verificar si el vehículo existe
    console.log('🔍 Verificando existencia del vehículo:', vehicleId);
    const { data: vehicleExists, error: checkError } = await supabase
      .from('vehicles')
      .select('id_uuid')
      .eq('id_uuid', vehicleId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error al verificar vehículo:', {
        error: checkError.message,
        vehicleId
      });
      return NextResponse.json(
        { message: 'Error checking vehicle' },
        { status: 500 }
      );
    }

    if (!vehicleExists) {
      console.log('❌ Vehículo no encontrado:', vehicleId);
      return NextResponse.json(
        { message: 'Vehicle not found' },
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
          { message: 'Error checking client' },
          { status: 500 }
        );
      }

      if (!clientExists) {
        console.log('❌ Cliente no encontrado:', filteredUpdates.client_id);
        return NextResponse.json(
          { message: 'Client not found' },
          { status: 404 }
        );
      }
    }

    // Si se va a actualizar license_plate, verificar que no exista ya
    if (filteredUpdates.license_plate) {
      console.log('🔍 Verificando placa duplicada:', filteredUpdates.license_plate);
      const { data: plateExists, error: plateCheckError } = await supabase
        .from('vehicles')
        .select('id_uuid')
        .eq('license_plate', filteredUpdates.license_plate)
        .neq('id_uuid', vehicleId)
        .maybeSingle();

      if (plateCheckError) {
        console.error('❌ Error al verificar placa:', {
          error: plateCheckError.message,
          license_plate: filteredUpdates.license_plate
        });
        return NextResponse.json(
          { message: 'Error checking license plate' },
          { status: 500 }
        );
      }

      if (plateExists) {
        console.log('❌ Placa duplicada encontrada:', {
          license_plate: filteredUpdates.license_plate,
          existing_id: plateExists.id_uuid
        });
        return NextResponse.json(
          { message: 'License plate already exists on another vehicle' },
          { status: 409 }
        );
      }
    }

    // Si se va a actualizar VIN, verificar que no exista ya
    if (filteredUpdates.vin) {
      console.log('🔍 Verificando VIN duplicado:', filteredUpdates.vin);
      const { data: vinExists, error: vinCheckError } = await supabase
        .from('vehicles')
        .select('id_uuid')
        .eq('vin', filteredUpdates.vin)
        .neq('id_uuid', vehicleId)
        .maybeSingle();

      if (vinCheckError) {
        console.error('❌ Error al verificar VIN:', {
          error: vinCheckError.message,
          vin: filteredUpdates.vin
        });
        return NextResponse.json(
          { message: 'Error checking VIN' },
          { status: 500 }
        );
      }

      if (vinExists) {
        console.log('❌ VIN duplicado encontrado:', {
          vin: filteredUpdates.vin,
          existing_id: vinExists.id_uuid
        });
        return NextResponse.json(
          { message: 'VIN already exists on another vehicle' },
          { status: 409 }
        );
      }
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
        { message: 'Failed to update vehicle', error: error.message },
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
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}