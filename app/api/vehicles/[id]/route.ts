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

    console.log('🚗 Obteniendo vehículo:', {
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

    console.log('🔍 Consultando vehículo en la base de datos:', vehicleId);
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        id_uuid,
        client_id,
        make,
        model,
        year,
        license_plate,
        vin,
        last_km,
        created_at,
        updated_at,
        client:client_id (
          id,
          names,
          email,
          phone_number
        )
      `)
      .eq('id_uuid', vehicleId)
      .single();

    if (error) {
      console.error('❌ Error al obtener vehículo:', {
        error: error.message,
        vehicleId
      });
      return NextResponse.json(
        { message: 'Error fetching vehicle' },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('ℹ️ Vehículo no encontrado:', vehicleId);
      return NextResponse.json(
        { message: 'Vehicle not found' },
        { status: 404 }
      );
    }

    console.log('✅ Vehículo encontrado:', {
      id: data.id_uuid,
      license_plate: data.license_plate,
      make: data.make,
      model: data.model
    });

    return NextResponse.json(data);
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