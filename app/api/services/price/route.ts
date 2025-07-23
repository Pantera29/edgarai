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
    const dealership_id = searchParams.get('dealership_id'); // ← NUEVO PARÁMETRO

    console.log('🔍 [Price API] Parámetros recibidos:', {
      vehicleId,
      modelId,
      modelName,
      kilometers,
      months,
      dealership_id: dealership_id || 'no especificado',
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

    // Logging condicional para dealership_id
    if (dealership_id) {
      console.log('🔍 [Price API] Filtrando por dealership_id:', dealership_id);
    } else {
      console.log('⚠️ [Price API] Sin filtro de dealership_id - búsqueda global');
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
      .select(`
        id,
        service_name,
        price,
        kilometers,
        months,
        service_id,
        additional_price,
        additional_description,
        includes_additional
      `)
      .eq('model_id', finalModelId)
      .eq('is_active', true);

    // Agregar filtro de dealership_id solo si se proporciona
    if (dealership_id) {
      query = query.eq('dealership_id', dealership_id);
      console.log('🔍 [Price API] Filtro de dealership_id aplicado:', dealership_id);
    }

    // Agregar filtro por kilometers o months
    if (kilometers) {
      console.log('🔍 [Price API] Aplicando filtro por kilometers:', kilometers);
      const kmValue = parseInt(kilometers);
      query = query
        .gte('kilometers', kmValue)  // Buscar servicios con kilómetros mayores o iguales
        .order('kilometers', { ascending: true });  // Ordenar de menor a mayor
    }
    if (months) {
      console.log('🔍 [Price API] Aplicando filtro por months:', months);
      const monthsValue = parseInt(months);
      query = query
        .gte('months', monthsValue)  // Buscar servicios con meses mayores o iguales
        .order('months', { ascending: true });  // Ordenar de menor a mayor
    }

    // Ejecutar la consulta
    console.log('⏳ [Price API] Ejecutando consulta a Supabase...');
    const { data: services, error: serviceError } = await query.limit(10); // Obtener hasta 10 resultados para debugging

    if (serviceError) {
      console.error('❌ [Price API] Error al buscar servicio:', {
        error: serviceError.message,
        modelId: finalModelId,
        dealership_id: dealership_id || 'no especificado',
        parameters: { kilometers, months }
      });
      return NextResponse.json(
        { message: 'Error al buscar servicio' },
        { status: 500 }
      );
    }

    console.log('📊 [Price API] Servicios encontrados:', {
      count: services?.length || 0,
      services: services?.map(s => ({
        id: s.id,
        kilometers: s.kilometers,
        months: s.months,
        price: s.price
      }))
    });

    // Si no hay servicios en la agencia específica, buscar en otras agencias
    if (!services || services.length === 0) {
      console.log('❌ [Price API] No se encontró servicio en la agencia específica:', {
        modelId: finalModelId,
        dealership_id: dealership_id || 'no especificado',
        parameters: { kilometers, months }
      });

      // Obtener información del modelo para el mensaje de error
      let modelName = 'Unknown model';
      try {
        const { data: modelInfo } = await supabase
          .from('vehicle_models')
          .select('name')
          .eq('id', finalModelId)
          .single();
        if (modelInfo) {
          modelName = modelInfo.name;
        }
      } catch (error) {
        console.log('⚠️ [Price API] Could not get model name:', error);
      }

      // Buscar el mismo modelo en otras agencias
      console.log('🔍 [Price API] Searching for same model in other dealerships...');
      let crossDealershipQuery = supabase
        .from('specific_services')
        .select(`
          id,
          service_name,
          price,
          kilometers,
          months,
          service_id,
          additional_price,
          additional_description,
          includes_additional,
          dealership_id
        `)
        .eq('model_id', finalModelId)
        .eq('is_active', true);

      // Aplicar filtros de kilometers/months si se proporcionan
      if (kilometers) {
        const kmValue = parseInt(kilometers);
        crossDealershipQuery = crossDealershipQuery
          .gte('kilometers', kmValue)
          .order('kilometers', { ascending: true });
      }
      if (months) {
        const monthsValue = parseInt(months);
        crossDealershipQuery = crossDealershipQuery
          .gte('months', monthsValue)
          .order('months', { ascending: true });
      }

      const { data: crossDealershipServices, error: crossDealershipError } = await crossDealershipQuery.limit(5);

      if (crossDealershipError) {
        console.error('❌ [Price API] Error searching other dealerships:', crossDealershipError);
      }

      console.log('📊 [Price API] Services found in other dealerships:', {
        count: crossDealershipServices?.length || 0,
        services: crossDealershipServices?.map(s => ({
          id: s.id,
          kilometers: s.kilometers,
          months: s.months,
          price: s.price,
          dealership_id: s.dealership_id
        }))
      });

      // Si encontramos servicios en otras agencias, retornar el primero
      if (crossDealershipServices && crossDealershipServices.length > 0) {
        const crossDealershipService = crossDealershipServices[0];
        
        console.log('✅ [Price API] Using service from other dealership:', {
          specific_service_id: crossDealershipService.id,
          service_name: crossDealershipService.service_name,
          price: crossDealershipService.price,
          dealership_id: crossDealershipService.dealership_id,
          original_dealership_id: dealership_id
        });

        return NextResponse.json({
          price: crossDealershipService.price,
          service_name: crossDealershipService.service_name,
          model_id: finalModelId,
          parameters: {
            kilometers: crossDealershipService.kilometers,
            months: crossDealershipService.months
          },
          service_id: crossDealershipService.service_id,
          specific_service_id: crossDealershipService.id,
          additional: {
            price: crossDealershipService.additional_price || 0,
            description: crossDealershipService.additional_description || '',
            included_by_default: crossDealershipService.includes_additional || true,
            total_price: crossDealershipService.price + (crossDealershipService.additional_price || 0)
          },
          // Indicar que el precio viene de otra agencia
          cross_dealership_price: {
            original_dealership_id: dealership_id,
            source_dealership_id: crossDealershipService.dealership_id,
            note: "Price obtained from another dealership as this model has no specific services in the requested dealership"
          }
        });
      }

      // Si no hay servicios en ninguna agencia, retornar error descriptivo
      const errorMessage = {
        message: `No specific services found for model "${modelName}" in any dealership`,
        details: {
          model_id: finalModelId,
          model_name: modelName,
          requested_dealership_id: dealership_id || 'not specified',
          requested_parameters: {
            kilometers: kilometers || 'not specified',
            months: months || 'not specified'
          },
          search_scope: 'All dealerships',
          possible_reasons: [
            'The model does not have specific services configured in any dealership',
            'All specific services for this model are inactive',
            'The kilometers or months parameters are outside the available range',
            'The model requires specific service configuration'
          ],
          recommended_actions: [
            'Contact an administrator to configure specific services for this model',
            'Refer the client to a human agent for manual service configuration',
            'Use a different model that has specific services available'
          ]
        },
        error_code: 'NO_SPECIFIC_SERVICES_FOUND_ANYWHERE',
        status: 'requires_human_intervention'
      };

      return NextResponse.json(errorMessage, { status: 404 });
    }

    // Tomar el primer servicio (el más cercano según el ordenamiento)
    const service = services[0];

    console.log('✅ [Price API] Servicio encontrado:', {
      specific_service_id: service.id,
      service_name: service.service_name,
      base_price: service.price,
      additional_price: service.additional_price,
      includes_additional: service.includes_additional,
      total_price: service.price + (service.additional_price || 0),
      service_id: service.service_id,
      dealership_id: dealership_id || 'no especificado',
      model_id: finalModelId,
      kilometers: service.kilometers,
      months: service.months
    });

    return NextResponse.json({
      // Campos existentes (MANTENER)
      price: service.price,
      service_name: service.service_name,
      model_id: finalModelId,
      parameters: {
        kilometers: service.kilometers,
        months: service.months
      },
      
      // NUEVOS campos
      service_id: service.service_id,
      specific_service_id: service.id,           // ← NUEVO CAMPO
      additional: {
        price: service.additional_price || 0,
        description: service.additional_description || '',
        included_by_default: service.includes_additional || true,
        total_price: service.price + (service.additional_price || 0)
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