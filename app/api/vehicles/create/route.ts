import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

interface VehicleMake {
  id: string;
  name: string;
}

interface VehicleModel {
  id: string;
  make_id: string;
  vehicle_makes: VehicleMake;
}

// Función auxiliar para normalizar strings
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

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
      make, // Opcional
      model, 
      year, 
      license_plate, 
      vin, 
      last_km
    } = payload;

    // Validar campos requeridos
    if (!client_id || !model || !year || !license_plate) {
      console.log('❌ Error: Campos requeridos faltantes:', {
        client_id: !client_id,
        model: !model,
        year: !year,
        license_plate: !license_plate
      });
      return NextResponse.json(
        { message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Si no se proporciona make, el modelo debe existir en la base de datos
    if (!make) {
      // Buscar el modelo en vehicle_models (case-insensitive)
      console.log('🔍 Buscando información del modelo:', model);
      const { data: modelInfo, error: modelError } = await supabase
        .from('vehicle_models')
        .select(`
          id,
          make_id,
          vehicle_makes (
            id,
            name
          )
        `)
        .ilike('name', normalizeString(model))
        .eq('is_active', true)
        .single();

      if (modelError && modelError.code !== 'PGRST116') {
        console.error('❌ Error al buscar el modelo:', {
          error: modelError.message,
          model
        });
        return NextResponse.json(
          { message: 'Error searching for model' },
          { status: 500 }
        );
      }

      // Asegurarnos de que vehicle_makes sea un objeto y no un array
      const typedModelInfo = modelInfo ? {
        ...modelInfo,
        vehicle_makes: Array.isArray(modelInfo.vehicle_makes) 
          ? modelInfo.vehicle_makes[0] 
          : modelInfo.vehicle_makes
      } as VehicleModel : null;

      console.log('🔍 Información del modelo procesada:', {
        modelInfo,
        typedModelInfo,
        vehicle_makes: typedModelInfo?.vehicle_makes
      });

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

      // Crear el vehículo con model_id
      console.log('📝 Creando vehículo con model_id:', {
        client_id,
        make: typedModelInfo?.vehicle_makes.name,
        model,
        year,
        license_plate,
        vin,
        last_km,
        model_id: typedModelInfo?.id || null
      });

      const { data: newVehicle, error: insertError } = await supabase
        .from('vehicles')
        .insert([{
          client_id,
          make: typedModelInfo?.vehicle_makes.name,
          model,
          year,
          license_plate,
          vin: vin || null,
          last_km: last_km || null,
          dealership_id: client.dealership_id,
          model_id: typedModelInfo?.id || null
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
        license_plate: newVehicle.license_plate,
        make: newVehicle.make,
        model: newVehicle.model,
        model_id: newVehicle.model_id
      });

      const modelInfoResponse = typedModelInfo && typedModelInfo.vehicle_makes ? {
        model_id: typedModelInfo.id,
        make: typedModelInfo.vehicle_makes.name
      } : null;

      console.log('📤 Preparando respuesta:', {
        modelInfoResponse,
        typedModelInfo,
        vehicle_makes: typedModelInfo?.vehicle_makes
      });

      return NextResponse.json(
        { 
          message: 'Vehicle created successfully', 
          vehicle: newVehicle,
          model_info: modelInfoResponse
        },
        { status: 201 }
      );
    } else {
      // Si se proporciona make, intentamos buscar el modelo pero permitimos que no exista
      console.log('🔍 Buscando información del modelo (opcional):', model);
      const { data: modelInfo, error: modelError } = await supabase
        .from('vehicle_models')
        .select(`
          id,
          make_id,
          vehicle_makes (
            id,
            name
          )
        `)
        .ilike('name', normalizeString(model))
        .eq('is_active', true)
        .single();

      if (modelError && modelError.code !== 'PGRST116') {
        console.error('❌ Error al buscar el modelo:', {
          error: modelError.message,
          model
        });
        return NextResponse.json(
          { message: 'Error searching for model' },
          { status: 500 }
        );
      }

      // Asegurarnos de que vehicle_makes sea un objeto y no un array
      const typedModelInfo = modelInfo ? {
        ...modelInfo,
        vehicle_makes: Array.isArray(modelInfo.vehicle_makes) 
          ? modelInfo.vehicle_makes[0] 
          : modelInfo.vehicle_makes
      } as VehicleModel : null;

      console.log('🔍 Información del modelo procesada:', {
        modelInfo,
        typedModelInfo,
        vehicle_makes: typedModelInfo?.vehicle_makes
      });

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

      // Crear el vehículo con o sin model_id
      console.log('📝 Creando vehículo:', {
        client_id,
        make,
        model,
        year,
        license_plate,
        vin,
        last_km,
        model_id: typedModelInfo?.id || null
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
          model_id: typedModelInfo?.id || null
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
        license_plate: newVehicle.license_plate,
        make: newVehicle.make,
        model: newVehicle.model,
        model_id: newVehicle.model_id
      });

      const modelInfoResponse = typedModelInfo && typedModelInfo.vehicle_makes ? {
        model_id: typedModelInfo.id,
        make: typedModelInfo.vehicle_makes.name
      } : null;

      console.log('📤 Preparando respuesta:', {
        modelInfoResponse,
        typedModelInfo,
        vehicle_makes: typedModelInfo?.vehicle_makes
      });

      return NextResponse.json(
        { 
          message: 'Vehicle created successfully', 
          vehicle: newVehicle,
          model_info: modelInfoResponse
        },
        { status: 201 }
      );
    }
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