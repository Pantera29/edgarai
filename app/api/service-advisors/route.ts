import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CreateServiceAdvisorInput } from '@/types/database.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/service-advisors
 * Obtiene lista de asesores de servicio con filtros opcionales
 * Query params: dealershipId (required), workshopId (optional), isActive (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dealershipId = searchParams.get('dealershipId');
    const workshopId = searchParams.get('workshopId');
    const isActive = searchParams.get('isActive');

    console.log('🔧 [SERVICE-ADVISORS] Obteniendo asesores:', {
      dealershipId,
      workshopId,
      isActive,
    });

    // Validar dealershipId requerido
    if (!dealershipId) {
      return NextResponse.json(
        { 
          error: 'El parámetro dealershipId es requerido',
          message: 'Debes proporcionar el ID del dealership' 
        },
        { status: 400 }
      );
    }

    // Construir query base con JOIN a workshops
    let query = supabase
      .from('service_advisors')
      .select(`
        *,
        workshop:workshops(
          id,
          name,
          address,
          city
        ),
        dealership:dealerships(
          id,
          name
        )
      `)
      .eq('dealership_id', dealershipId)
      .order('name', { ascending: true });

    // Aplicar filtros opcionales
    if (workshopId) {
      query = query.eq('workshop_id', workshopId);
    }

    if (isActive !== null && isActive !== undefined) {
      const activeFilter = isActive === 'true';
      query = query.eq('is_active', activeFilter);
    }

    const { data: advisors, error } = await query;

    if (error) {
      console.error('❌ [SERVICE-ADVISORS] Error al obtener asesores:', error);
      return NextResponse.json(
        { 
          error: 'Error al obtener asesores de servicio',
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ [SERVICE-ADVISORS] Asesores obtenidos:', advisors?.length);

    return NextResponse.json({
      success: true,
      data: advisors,
      count: advisors?.length || 0,
    });

  } catch (error: any) {
    console.error('❌ [SERVICE-ADVISORS] Error inesperado:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/service-advisors
 * Crea un nuevo asesor de servicio
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateServiceAdvisorInput = await request.json();
    
    console.log('🔧 [SERVICE-ADVISORS] Creando nuevo asesor:', body);

    const {
      dealership_id,
      workshop_id,
      name,
      email,
      phone,
      shift_start_time,
      shift_end_time,
      lunch_start_time,
      lunch_end_time,
      works_monday = true,
      works_tuesday = true,
      works_wednesday = true,
      works_thursday = true,
      works_friday = true,
      works_saturday = false,
      works_sunday = false,
      max_consecutive_services = 10,
    } = body;

    // Validaciones básicas
    if (!dealership_id || !workshop_id || !name || !shift_start_time || !shift_end_time || !lunch_start_time || !lunch_end_time) {
      return NextResponse.json(
        { 
          error: 'Campos requeridos faltantes',
          message: 'dealership_id, workshop_id, name, shift_start_time, shift_end_time, lunch_start_time y lunch_end_time son requeridos',
          required: ['dealership_id', 'workshop_id', 'name', 'shift_start_time', 'shift_end_time', 'lunch_start_time', 'lunch_end_time']
        },
        { status: 400 }
      );
    }

    // Validar formato de horarios (HH:MM:SS)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(shift_start_time) || !timeRegex.test(shift_end_time) || 
        !timeRegex.test(lunch_start_time) || !timeRegex.test(lunch_end_time)) {
      return NextResponse.json(
        { 
          error: 'Formato de hora inválido',
          message: 'Las horas deben estar en formato HH:MM o HH:MM:SS'
        },
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
        { 
          error: 'Dealership no encontrado',
          message: `No existe un dealership con el ID: ${dealership_id}`
        },
        { status: 404 }
      );
    }

    // Validar que el workshop existe y pertenece al dealership
    const { data: workshop, error: workshopError } = await supabase
      .from('workshops')
      .select('id, name, dealership_id')
      .eq('id', workshop_id)
      .single();

    if (workshopError || !workshop) {
      return NextResponse.json(
        { 
          error: 'Workshop no encontrado',
          message: `No existe un workshop con el ID: ${workshop_id}`
        },
        { status: 404 }
      );
    }

    if (workshop.dealership_id !== dealership_id) {
      return NextResponse.json(
        { 
          error: 'Workshop no pertenece al dealership',
          message: `El workshop ${workshop.name} no pertenece al dealership especificado`
        },
        { status: 400 }
      );
    }

    // Validar que el horario de almuerzo está dentro del turno
    if (lunch_start_time < shift_start_time || lunch_end_time > shift_end_time) {
      return NextResponse.json(
        { 
          error: 'Horario de almuerzo inválido',
          message: 'El horario de almuerzo debe estar dentro del horario del turno'
        },
        { status: 400 }
      );
    }

    // Validar que hora fin es después de hora inicio
    if (shift_end_time <= shift_start_time) {
      return NextResponse.json(
        { 
          error: 'Horario de turno inválido',
          message: 'La hora de fin del turno debe ser posterior a la hora de inicio'
        },
        { status: 400 }
      );
    }

    if (lunch_end_time <= lunch_start_time) {
      return NextResponse.json(
        { 
          error: 'Horario de almuerzo inválido',
          message: 'La hora de fin del almuerzo debe ser posterior a la hora de inicio'
        },
        { status: 400 }
      );
    }

    // Validar que al menos un día está marcado como laborable
    if (!works_monday && !works_tuesday && !works_wednesday && !works_thursday && 
        !works_friday && !works_saturday && !works_sunday) {
      return NextResponse.json(
        { 
          error: 'Días laborables requeridos',
          message: 'Debe seleccionar al menos un día laborable'
        },
        { status: 400 }
      );
    }

    // Validar email único si se proporciona
    if (email) {
      const { data: existingAdvisor, error: emailError } = await supabase
        .from('service_advisors')
        .select('id, name')
        .eq('email', email)
        .eq('dealership_id', dealership_id)
        .single();

      if (existingAdvisor && !emailError) {
        return NextResponse.json(
          { 
            error: 'Email duplicado',
            message: `Ya existe un asesor con el email ${email} en este dealership`,
            existing: existingAdvisor
          },
          { status: 409 }
        );
      }
    }

    // Crear el asesor
    const { data: newAdvisor, error: createError } = await supabase
      .from('service_advisors')
      .insert({
        dealership_id,
        workshop_id,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        shift_start_time,
        shift_end_time,
        lunch_start_time,
        lunch_end_time,
        works_monday,
        works_tuesday,
        works_wednesday,
        works_thursday,
        works_friday,
        works_saturday,
        works_sunday,
        max_consecutive_services,
        is_active: true,
      })
      .select(`
        *,
        workshop:workshops(
          id,
          name,
          address
        ),
        dealership:dealerships(
          id,
          name
        )
      `)
      .single();

    if (createError) {
      console.error('❌ [SERVICE-ADVISORS] Error al crear asesor:', createError);
      return NextResponse.json(
        { 
          error: 'Error al crear el asesor de servicio',
          details: createError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ [SERVICE-ADVISORS] Asesor creado exitosamente:', newAdvisor.id);

    return NextResponse.json({
      success: true,
      message: 'Asesor de servicio creado exitosamente',
      data: newAdvisor,
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ [SERVICE-ADVISORS] Error inesperado:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

