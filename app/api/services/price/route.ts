import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Función auxiliar para normalizar strings
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicle_id');
    const modelId = searchParams.get('model_id');
    const modelName = searchParams.get('model_name');
    const kilometers = searchParams.get('kilometers');
    const months = searchParams.get('months');

    // Validar que se proporcione al menos un identificador del modelo
    if (!vehicleId && !modelId && !modelName) {
      return NextResponse.json(
        { message: 'Se requiere vehicle_id, model_id o model_name' },
        { status: 400 }
      );
    }

    // Validar que se proporcione al menos un parámetro de tiempo
    if (!kilometers && !months) {
      return NextResponse.json(
        { message: 'Se requiere kilometers o months' },
        { status: 400 }
      );
    }

    let finalModelId: string | null = null;

    // Caso 1: Si se proporciona vehicle_id
    if (vehicleId) {
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('model_id')
        .eq('id_uuid', vehicleId)
        .single();

      if (vehicleError) {
        console.error('Error al buscar vehículo:', vehicleError);
        return NextResponse.json(
          { message: 'Error al buscar vehículo' },
          { status: 500 }
        );
      }

      if (!vehicle) {
        return NextResponse.json(
          { message: 'Vehículo no encontrado' },
          { status: 404 }
        );
      }

      finalModelId = vehicle.model_id;
    }
    // Caso 2: Si se proporciona model_id
    else if (modelId) {
      finalModelId = modelId;
    }
    // Caso 3: Si se proporciona model_name
    else if (modelName) {
      const { data: model, error: modelError } = await supabase
        .from('vehicle_models')
        .select('id')
        .ilike('name', normalizeString(modelName))
        .eq('is_active', true)
        .single();

      if (modelError) {
        console.error('Error al buscar modelo:', modelError);
        return NextResponse.json(
          { message: 'Error al buscar modelo' },
          { status: 500 }
        );
      }

      if (!model) {
        return NextResponse.json(
          { message: 'Modelo no encontrado' },
          { status: 404 }
        );
      }

      finalModelId = model.id;
    }

    // Si no se pudo obtener el model_id, retornar error
    if (!finalModelId) {
      return NextResponse.json(
        { message: 'No se pudo determinar el modelo' },
        { status: 400 }
      );
    }

    // Construir la consulta base
    let query = supabase
      .from('specific_services')
      .select('price, service_name')
      .eq('model_id', finalModelId)
      .eq('is_active', true);

    // Agregar filtro por kilometers o months
    if (kilometers) {
      query = query.eq('kilometers', parseInt(kilometers));
    }
    if (months) {
      query = query.eq('months', parseInt(months));
    }

    // Ejecutar la consulta
    const { data: service, error: serviceError } = await query.single();

    if (serviceError) {
      console.error('Error al buscar servicio:', serviceError);
      return NextResponse.json(
        { message: 'Error al buscar servicio' },
        { status: 500 }
      );
    }

    if (!service) {
      return NextResponse.json(
        { message: 'No se encontró un servicio específico para los parámetros proporcionados' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      price: service.price,
      service_name: service.service_name,
      model_id: finalModelId,
      parameters: {
        kilometers: kilometers ? parseInt(kilometers) : null,
        months: months ? parseInt(months) : null
      }
    });

  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 