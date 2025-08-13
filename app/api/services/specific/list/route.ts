import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const dealership_id = searchParams.get('dealership_id');
    const make_id = searchParams.get('make_id');
    const model_id = searchParams.get('model_id');
    const service_id = searchParams.get('service_id');
    const is_active = searchParams.get('is_active');
    const search = searchParams.get('search');

    console.log('🔄 [SpecificServiceList] Consulta recibida:', { 
      dealership_id, 
      make_id, 
      model_id, 
      service_id, 
      is_active,
      search 
    });

    if (!dealership_id) {
      console.log('❌ [SpecificServiceList] Faltan parámetros requeridos');
      return NextResponse.json({
        error: 'Faltan parámetros requeridos: dealership_id es obligatorio.'
      }, { status: 400 });
    }

    let query = supabase
      .from('specific_services')
      .select(`
        id,
        model_id,
        dealership_id,
        service_name,
        kilometers,
        months,
        price,
        is_active,
        service_id,
        additional_price,
        additional_description,
        includes_additional,
        created_at,
        updated_at,
        model:vehicle_models (
          name,
          make:vehicle_makes (
            id,
            name
          )
        ),
        service:services (
          service_name
        )
      `)
      .eq('dealership_id', dealership_id);

    // Aplicar filtros
    if (model_id) {
      query = query.eq('model_id', model_id);
    }

    if (service_id) {
      query = query.eq('service_id', service_id);
    }

    if (is_active !== null && is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    if (make_id) {
      query = query.eq('model.vehicle_makes.id', make_id);
    }

    if (search) {
      query = query.or(`service_name.ilike.%${search}%,model.vehicle_models.name.ilike.%${search}%,model.vehicle_makes.name.ilike.%${search}%`);
    }

    // Ordenar por fecha de creación (más recientes primero)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.log('❌ [SpecificServiceList] Error al consultar specific_services:', error.message);
      return NextResponse.json({ 
        error: 'Error al consultar servicios específicos.' 
      }, { status: 500 });
    }

    console.log('✅ [SpecificServiceList] Servicios específicos encontrados:', data?.length || 0);
    return NextResponse.json({ 
      specific_services: data || [],
      total: data?.length || 0
    });

  } catch (error) {
    console.log('💥 [SpecificServiceList] Error inesperado:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor.' 
    }, { status: 500 });
  }
}
