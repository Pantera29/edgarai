import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/workshops - Listar talleres
export async function GET(request: NextRequest) {
  try {
    console.log('🏭 [WORKSHOPS] Iniciando listado de talleres...');
    
    const { searchParams } = new URL(request.url);
    const dealershipId = searchParams.get('dealership_id');
    const isActive = searchParams.get('is_active');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Construir query base
    let query = supabase
      .from('workshops')
      .select(`
        id,
        name,
        address,
        city,
        phone,
        location_url,
        is_active,
        is_main,
        dealership_id,
        created_at,
        dealerships!workshops_dealership_id_fkey (
          id,
          name
        )
      `)
      .order('is_main', { ascending: false })
      .order('name', { ascending: true });

    // Aplicar filtros
    if (dealershipId) {
      query = query.eq('dealership_id', dealershipId);
      console.log('🏭 [WORKSHOPS] Filtro por dealership_id:', dealershipId);
    }

    if (isActive !== null && isActive !== undefined) {
      const activeFilter = isActive === 'true';
      query = query.eq('is_active', activeFilter);
      console.log('🏭 [WORKSHOPS] Filtro por is_active:', activeFilter);
    }

    // Aplicar paginación
    if (limit) {
      const limitNum = parseInt(limit);
      query = query.limit(limitNum);
    }

    if (offset) {
      const offsetNum = parseInt(offset);
      query = query.range(offsetNum, offsetNum + (limit ? parseInt(limit) - 1 : 9));
    }

    const { data: workshops, error, count } = await query;

    if (error) {
      console.error('❌ [WORKSHOPS] Error al obtener talleres:', error);
      return NextResponse.json(
        { 
          error: 'Error al obtener talleres',
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ [WORKSHOPS] Talleres obtenidos exitosamente:', workshops?.length || 0);

    return NextResponse.json({
      success: true,
      data: workshops,
      count: workshops?.length || 0,
      filters: {
        dealership_id: dealershipId,
        is_active: isActive,
        limit: limit,
        offset: offset
      }
    });

  } catch (error) {
    console.error('❌ [WORKSHOPS] Error inesperado:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST /api/workshops - Crear nuevo taller
export async function POST(request: NextRequest) {
  try {
    console.log('🏭 [WORKSHOPS] Iniciando creación de taller...');
    
    const body = await request.json();
    const { 
      name, 
      address, 
      city, 
      phone, 
      location_url, 
      is_active = true, 
      is_main = false,
      dealership_id 
    } = body;

    // Validaciones
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del taller es requerido' },
        { status: 400 }
      );
    }

    if (!dealership_id) {
      return NextResponse.json(
        { error: 'El dealership_id es requerido' },
        { status: 400 }
      );
    }

    // Validar que el dealership existe
    const { data: dealership, error: dealershipError } = await supabase
      .from('dealerships')
      .select('id, name')
      .eq('id', dealership_id)
      .single();

    if (dealershipError || !dealership) {
      return NextResponse.json(
        { error: 'Dealership no encontrado' },
        { status: 404 }
      );
    }

    // Si se marca como principal, desmarcar otros talleres principales del mismo dealership
    if (is_main) {
      const { error: updateError } = await supabase
        .from('workshops')
        .update({ is_main: false })
        .eq('dealership_id', dealership_id)
        .eq('is_main', true);

      if (updateError) {
        console.error('❌ [WORKSHOPS] Error al actualizar talleres primarios:', updateError);
        return NextResponse.json(
          { 
            error: 'Error al actualizar talleres primarios',
            details: updateError.message 
          },
          { status: 500 }
        );
      }
    }

    // Crear el taller
    const { data: newWorkshop, error: createError } = await supabase
      .from('workshops')
      .insert({
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        phone: phone?.trim() || null,
        location_url: location_url?.trim() || null,
        is_active,
        is_main,
        dealership_id
      })
      .select(`
        id,
        name,
        address,
        city,
        phone,
        location_url,
        is_active,
        is_main,
        dealership_id,
        created_at,
        dealerships!workshops_dealership_id_fkey (
          id,
          name
        )
      `)
      .single();

    if (createError) {
      console.error('❌ [WORKSHOPS] Error al crear taller:', createError);
      return NextResponse.json(
        { 
          error: 'Error al crear taller',
          details: createError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ [WORKSHOPS] Taller creado exitosamente:', newWorkshop.id);

    return NextResponse.json({
      success: true,
      data: newWorkshop,
      message: `Taller ${newWorkshop.name} creado exitosamente`
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [WORKSHOPS] Error inesperado:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
