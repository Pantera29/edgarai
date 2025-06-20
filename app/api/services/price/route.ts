import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Función auxiliar para normalizar strings
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function GET(request: Request) {
  try {
    console.log('💰 [Price API] Nueva petición recibida');
    console.log('📝 [Price API] Headers:', Object.fromEntries(request.headers.entries()));
    
    const supabase = createServerComponentClient({ cookies });
    
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicle_id');
    const modelId = searchParams.get('model_id');
    const modelName = searchParams.get('model_name');
    const kilometers = searchParams.get('kilometers');
    const months = searchParams.get('months');

    console.log('🔍 [Price API] Parámetros recibidos:', {
      vehicleId,
      modelId,
      modelName,
      kilometers,
      months,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    // Validar que se proporcione al menos un identificador del modelo
    if (!vehicleId && !modelId && !modelName) {
      console.log('❌ [Price API] Error: No se proporcionó ningún identificador de modelo');
      return NextResponse.json(
        { message: 'Se requiere vehicle_id, model_id o model_name' },
        { status: 400 }
      );
    }

    // Validar que se proporcione al menos un parámetro de tiempo
    if (!kilometers && !months) {
      console.log('❌ [Price API] Error: No se proporcionó ningún parámetro de tiempo');
      return NextResponse.json(
        { message: 'Se requiere kilometers o months' },
        { status: 400 }
      );
    }

    let finalModelId: string | null = null;

    // Caso 1: Si se proporciona vehicle_id
    if (vehicleId) {
      console.log('🔍 [Price API] Buscando modelo por vehicle_id:', vehicleId);
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('model_id')
        .eq('id_uuid', vehicleId)
        .single();

      if (vehicleError) {
        console.error('❌ [Price API] Error al buscar vehículo:', {
          error: vehicleError.message,
          vehicleId
        });
        return NextResponse.json(
          { message: 'Error al buscar vehículo' },
          { status: 500 }
        );
      }

      if (!vehicle) {
        console.log('❌ [Price API] Vehículo no encontrado:', vehicleId);
        return NextResponse.json(
          { message: 'Vehículo no encontrado' },
          { status: 404 }
        );
      }

      finalModelId = vehicle.model_id;
      console.log('✅ [Price API] Modelo encontrado por vehicle_id:', finalModelId);
    }
    // Caso 2: Si se proporciona model_id
    else if (modelId) {
      console.log('✅ [Price API] Usando model_id proporcionado:', modelId);
      finalModelId = modelId;
    }
    // Caso 3: Si se proporciona model_name
    else if (modelName) {
      console.log('🔍 [Price API] Buscando modelo por nombre con lógica flexible:', modelName);

      const normalizedModelName = normalizeString(modelName);
      const searchTerms = [...new Set(normalizedModelName.split(' ').filter(Boolean))];

      console.log('🔍 [Price API] Términos de búsqueda:', searchTerms);

      if (searchTerms.length === 0) {
        console.log('❌ [Price API] No hay suficientes términos de búsqueda válidos.');
        return NextResponse.json({ message: 'Nombre de modelo no es válido' }, { status: 400 });
      }

      const orFilter = searchTerms.map(term => `name.ilike.%${term}%`).join(',');

      const { data: candidateModels, error: modelError } = await supabase
        .from('vehicle_models')
        .select('id, name')
        .eq('is_active', true)
        .or(orFilter);

      if (modelError) {
        console.error('❌ [Price API] Error al buscar modelos candidatos:', {
          error: modelError.message,
          modelName,
        });
        return NextResponse.json({ message: 'Error al buscar modelo' }, { status: 500 });
      }

      if (!candidateModels || candidateModels.length === 0) {
        console.log('❌ [Price API] No se encontraron modelos candidatos para:', modelName);
        return NextResponse.json({ message: 'Modelo no encontrado' }, { status: 404 });
      }

      console.log(`✅ [Price API] Encontrados ${candidateModels.length} modelos candidatos. Analizando...`);
      
      const rankedModels = candidateModels.map(model => {
        const modelNameLower = model.name.toLowerCase();
        const score = searchTerms.reduce((acc, term) => {
            if (modelNameLower.includes(term)) {
                return acc + 1;
            }
            return acc;
        }, 0);
        return { ...model, score };
      })
      .filter(model => model.score > 0)
      .sort((a, b) => {
          if (b.score !== a.score) {
              return b.score - a.score;
          }
          return a.name.length - b.name.length;
      });

      console.log('📊 [Price API] Modelos clasificados:', rankedModels.map(m => ({name: m.name, score: m.score})));

      const bestMatch = rankedModels[0];

      if (!bestMatch) {
          console.log('❌ [Price API] Ningún modelo candidato pasó el filtro de puntuación.');
          return NextResponse.json({ message: 'Modelo no encontrado' }, { status: 404 });
      }

      finalModelId = bestMatch.id;
      console.log(`✅ [Price API] Mejor coincidencia encontrada: ${bestMatch.name} (ID: ${finalModelId}) con puntaje de ${bestMatch.score}`);
    }

    // Si no se pudo obtener el model_id, retornar error
    if (!finalModelId) {
      console.log('❌ [Price API] No se pudo determinar el modelo');
      return NextResponse.json(
        { message: 'No se pudo determinar el modelo' },
        { status: 400 }
      );
    }

    // Construir la consulta base
    console.log('🔍 [Price API] Construyendo consulta para modelo:', finalModelId);
    let query = supabase
      .from('specific_services')
      .select('price, service_name, kilometers, months')
      .eq('model_id', finalModelId)
      .eq('is_active', true);

    // Agregar filtro por kilometers o months
    if (kilometers) {
      console.log('🔍 [Price API] Aplicando filtro por kilometers:', kilometers);
      const kmValue = parseInt(kilometers);
      query = query
        .gte('kilometers', kmValue)  // Buscar servicios con kilómetros mayores o iguales
        .order('kilometers', { ascending: true })  // Ordenar de menor a mayor
        .limit(1);  // Tomar el más cercano
    }
    if (months) {
      console.log('🔍 [Price API] Aplicando filtro por months:', months);
      const monthsValue = parseInt(months);
      query = query
        .gte('months', monthsValue)  // Buscar servicios con meses mayores o iguales
        .order('months', { ascending: true })  // Ordenar de menor a mayor
        .limit(1);  // Tomar el más cercano
    }

    // Ejecutar la consulta
    console.log('⏳ [Price API] Ejecutando consulta a Supabase...');
    const { data: service, error: serviceError } = await query.single();

    if (serviceError) {
      console.error('❌ [Price API] Error al buscar servicio:', {
        error: serviceError.message,
        modelId: finalModelId,
        parameters: { kilometers, months }
      });
      return NextResponse.json(
        { message: 'Error al buscar servicio' },
        { status: 500 }
      );
    }

    if (!service) {
      console.log('❌ [Price API] No se encontró servicio para los parámetros:', {
        modelId: finalModelId,
        parameters: { kilometers, months }
      });
      return NextResponse.json(
        { message: 'No se encontró un servicio específico para los parámetros proporcionados' },
        { status: 404 }
      );
    }

    console.log('✅ [Price API] Servicio encontrado:', {
      service_name: service.service_name,
      price: service.price,
      model_id: finalModelId,
      kilometers: service.kilometers,
      months: service.months
    });

    return NextResponse.json({
      price: service.price,
      service_name: service.service_name,
      model_id: finalModelId,
      parameters: {
        kilometers: service.kilometers,
        months: service.months
      }
    });

  } catch (error) {
    console.error('💥 [Price API] Error inesperado:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 