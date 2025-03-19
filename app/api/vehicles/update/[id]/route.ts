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
    
    if (!vehicleId) {
      return NextResponse.json(
        { message: 'Vehicle ID is required' },
        { status: 400 }
      );
    }

    // Verificar si el vehículo existe
    const { data: vehicleExists, error: checkError } = await supabase
      .from('vehicles')
      .select('id_uuid')
      .eq('id_uuid', vehicleId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking vehicle:', checkError.message);
      return NextResponse.json(
        { message: 'Error checking vehicle' },
        { status: 500 }
      );
    }

    if (!vehicleExists) {
      return NextResponse.json(
        { message: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Obtener datos del cuerpo de la solicitud
    const updates = await request.json();
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

    // Si no hay campos válidos para actualizar
    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Si se va a actualizar client_id, verificar que el cliente existe
    if (filteredUpdates.client_id) {
      const { data: clientExists, error: clientCheckError } = await supabase
        .from('client')
        .select('id')
        .eq('id', filteredUpdates.client_id)
        .maybeSingle();

      if (clientCheckError) {
        console.error('Error checking client:', clientCheckError.message);
        return NextResponse.json(
          { message: 'Error checking client' },
          { status: 500 }
        );
      }

      if (!clientExists) {
        return NextResponse.json(
          { message: 'Client not found' },
          { status: 404 }
        );
      }
    }

    // Si se va a actualizar license_plate, verificar que no exista ya (excepto para este vehículo)
    if (filteredUpdates.license_plate) {
      const { data: plateExists, error: plateCheckError } = await supabase
        .from('vehicles')
        .select('id_uuid')
        .eq('license_plate', filteredUpdates.license_plate)
        .neq('id_uuid', vehicleId)
        .maybeSingle();

      if (plateCheckError) {
        console.error('Error checking license plate:', plateCheckError.message);
        return NextResponse.json(
          { message: 'Error checking license plate' },
          { status: 500 }
        );
      }

      if (plateExists) {
        return NextResponse.json(
          { message: 'License plate already exists on another vehicle' },
          { status: 409 }
        );
      }
    }

    // Si se va a actualizar VIN, verificar que no exista ya (excepto para este vehículo)
    if (filteredUpdates.vin) {
      const { data: vinExists, error: vinCheckError } = await supabase
        .from('vehicles')
        .select('id_uuid')
        .eq('vin', filteredUpdates.vin)
        .neq('id_uuid', vehicleId)
        .maybeSingle();

      if (vinCheckError) {
        console.error('Error checking VIN:', vinCheckError.message);
        return NextResponse.json(
          { message: 'Error checking VIN' },
          { status: 500 }
        );
      }

      if (vinExists) {
        return NextResponse.json(
          { message: 'VIN already exists on another vehicle' },
          { status: 409 }
        );
      }
    }

    // Actualizar el vehículo
    const { data, error } = await supabase
      .from('vehicles')
      .update(filteredUpdates)
      .eq('id_uuid', vehicleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error.message);
      return NextResponse.json(
        { message: 'Failed to update vehicle', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Vehicle updated successfully',
      vehicle: data
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}