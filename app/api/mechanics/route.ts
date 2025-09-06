import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/mechanics - Listar mecánicos
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 [MECHANICS] Iniciando listado de mecánicos...');
    
    const { searchParams } = new URL(request.url);
    const dealershipId = searchParams.get('dealership_id');
    const workshopId = searchParams.get('workshop_id');
    const isActive = searchParams.get('is_active');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Construir query base
    let query = supabase
      .from('mechanics')
      .select(`
        id,
        name,
        email,
        phone,
        specialties,
        is_active,
        dealership_id,
        workshop_id,
        created_at,
        dealerships!mechanics_dealership_id_fkey (
          id,
          name
        ),
        workshops!mechanics_workshop_id_fkey (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (dealershipId) {
      query = query.eq('dealership_id', dealershipId);
      console.log('🔧 [MECHANICS] Filtro por dealership_id:', dealershipId);
    }

    if (workshopId) {
      query = query.eq('workshop_id', workshopId);
      console.log('🔧 [MECHANICS] Filtro por workshop_id:', workshopId);
    }

    if (isActive !== null && isActive !== undefined) {
      const activeFilter = isActive === 'true';
      query = query.eq('is_active', activeFilter);
      console.log('🔧 [MECHANICS] Filtro por is_active:', activeFilter);
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

    const { data: mechanics, error, count } = await query;

    if (error) {
      console.error('❌ [MECHANICS] Error al obtener mecánicos:', error);
      return NextResponse.json(
        { 
          error: 'Error al obtener mecánicos',
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ [MECHANICS] Mecánicos obtenidos exitosamente:', mechanics?.length || 0);

    return NextResponse.json({
      success: true,
      data: mechanics,
      count: mechanics?.length || 0,
      filters: {
        dealership_id: dealershipId,
        workshop_id: workshopId,
        is_active: isActive,
        limit: limit,
        offset: offset
      }
    });

  } catch (error) {
    console.error('❌ [MECHANICS] Error inesperado:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST /api/mechanics - Crear nuevo mecánico
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [MECHANICS] Iniciando creación de mecánico...');
    
    const body = await request.json();
    const { 
      name, 
      email, 
      phone, 
      specialties, 
      is_active = true, 
      dealership_id, 
      workshop_id 
    } = body;

    // Validaciones
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del mecánico es requerido' },
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

    // Validar workshop si se proporciona
    if (workshop_id) {
      const { data: workshop, error: workshopError } = await supabase
        .from('workshops')
        .select('id, name, dealership_id')
        .eq('id', workshop_id)
        .single();

      if (workshopError || !workshop) {
        return NextResponse.json(
          { error: 'Workshop no encontrado' },
          { status: 404 }
        );
      }

      // Verificar que el workshop pertenece al dealership
      if (workshop.dealership_id !== dealership_id) {
        return NextResponse.json(
          { error: 'El workshop no pertenece al dealership especificado' },
          { status: 400 }
        );
      }
    }

    // Validar email único si se proporciona
    if (email) {
      const { data: existingMechanic, error: emailError } = await supabase
        .from('mechanics')
        .select('id, name')
        .eq('email', email)
        .single();

      if (existingMechanic) {
        return NextResponse.json(
          { error: 'Ya existe un mecánico con este email' },
          { status: 409 }
        );
      }
    }

    // Crear el mecánico
    const { data: newMechanic, error: createError } = await supabase
      .from('mechanics')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        specialties: specialties || null,
        is_active,
        dealership_id,
        workshop_id: workshop_id || null
      })
      .select(`
        id,
        name,
        email,
        phone,
        specialties,
        is_active,
        dealership_id,
        workshop_id,
        created_at,
        dealerships!mechanics_dealership_id_fkey (
          id,
          name
        ),
        workshops!mechanics_workshop_id_fkey (
          id,
          name
        )
      `)
      .single();

    if (createError) {
      console.error('❌ [MECHANICS] Error al crear mecánico:', createError);
      return NextResponse.json(
        { 
          error: 'Error al crear mecánico',
          details: createError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ [MECHANICS] Mecánico creado exitosamente:', newMechanic.id);

    return NextResponse.json({
      success: true,
      data: newMechanic,
      message: `Mecánico ${newMechanic.name} creado exitosamente`
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [MECHANICS] Error inesperado:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
