import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UpdateServiceAdvisorInput } from '@/types/database.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/service-advisors/[id]
 * Obtiene los datos completos de un asesor específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔧 [SERVICE-ADVISORS] Obteniendo asesor específico:', params.id);
    
    const { data: advisor, error } = await supabase
      .from('service_advisors')
      .select(`
        *,
        workshop:workshops(
          id,
          name,
          address,
          city,
          phone
        ),
        dealership:dealerships(
          id,
          name,
          address
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !advisor) {
      console.error('❌ [SERVICE-ADVISORS] Asesor no encontrado:', error);
      return NextResponse.json(
        { 
          error: 'Asesor no encontrado',
          message: `No existe un asesor con el ID: ${params.id}`
        },
        { status: 404 }
      );
    }

    console.log('✅ [SERVICE-ADVISORS] Asesor encontrado:', advisor.name);

    return NextResponse.json({
      success: true,
      data: advisor,
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
 * PATCH /api/service-advisors/[id]
 * Actualiza un asesor de servicio existente
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateServiceAdvisorInput = await request.json();
    
    console.log('🔧 [SERVICE-ADVISORS] Actualizando asesor:', params.id, body);

    // Verificar que el asesor existe
    const { data: existingAdvisor, error: fetchError } = await supabase
      .from('service_advisors')
      .select('id, name, email, dealership_id, workshop_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingAdvisor) {
      return NextResponse.json(
        { 
          error: 'Asesor no encontrado',
          message: `No existe un asesor con el ID: ${params.id}`
        },
        { status: 404 }
      );
    }

    // Validar dealership si se proporciona
    if (body.dealership_id && body.dealership_id !== existingAdvisor.dealership_id) {
      const { data: dealership, error: dealershipError } = await supabase
        .from('dealerships')
        .select('id, name')
        .eq('id', body.dealership_id)
        .single();

      if (dealershipError || !dealership) {
        return NextResponse.json(
          { 
            error: 'Dealership no encontrado',
            message: `No existe un dealership con el ID: ${body.dealership_id}`
          },
          { status: 404 }
        );
      }
    }

    // Validar workshop si se proporciona
    if (body.workshop_id && body.workshop_id !== existingAdvisor.workshop_id) {
      const { data: workshop, error: workshopError } = await supabase
        .from('workshops')
        .select('id, name, dealership_id')
        .eq('id', body.workshop_id)
        .single();

      if (workshopError || !workshop) {
        return NextResponse.json(
          { 
            error: 'Workshop no encontrado',
            message: `No existe un workshop con el ID: ${body.workshop_id}`
          },
          { status: 404 }
        );
      }

      // Validar que el workshop pertenece al dealership
      const targetDealershipId = body.dealership_id || existingAdvisor.dealership_id;
      if (workshop.dealership_id !== targetDealershipId) {
        return NextResponse.json(
          { 
            error: 'Workshop no pertenece al dealership',
            message: `El workshop ${workshop.name} no pertenece al dealership especificado`
          },
          { status: 400 }
        );
      }
    }

    // Validar formato de horarios si se proporcionan
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (body.shift_start_time && !timeRegex.test(body.shift_start_time)) {
      return NextResponse.json(
        { 
          error: 'Formato de hora inválido',
          message: 'shift_start_time debe estar en formato HH:MM o HH:MM:SS'
        },
        { status: 400 }
      );
    }
    if (body.shift_end_time && !timeRegex.test(body.shift_end_time)) {
      return NextResponse.json(
        { 
          error: 'Formato de hora inválido',
          message: 'shift_end_time debe estar en formato HH:MM o HH:MM:SS'
        },
        { status: 400 }
      );
    }
    if (body.lunch_start_time && !timeRegex.test(body.lunch_start_time)) {
      return NextResponse.json(
        { 
          error: 'Formato de hora inválido',
          message: 'lunch_start_time debe estar en formato HH:MM o HH:MM:SS'
        },
        { status: 400 }
      );
    }
    if (body.lunch_end_time && !timeRegex.test(body.lunch_end_time)) {
      return NextResponse.json(
        { 
          error: 'Formato de hora inválido',
          message: 'lunch_end_time debe estar en formato HH:MM o HH:MM:SS'
        },
        { status: 400 }
      );
    }

    // Validar email único si se proporciona y es diferente al actual
    if (body.email && body.email !== existingAdvisor.email) {
      const { data: existingEmailAdvisor, error: emailError } = await supabase
        .from('service_advisors')
        .select('id, name')
        .eq('email', body.email)
        .eq('dealership_id', existingAdvisor.dealership_id)
        .neq('id', params.id)
        .single();

      if (existingEmailAdvisor && !emailError) {
        return NextResponse.json(
          { 
            error: 'Email duplicado',
            message: `Ya existe otro asesor con el email ${body.email}`,
            existing: existingEmailAdvisor
          },
          { status: 409 }
        );
      }
    }

    // Validar que los valores de slots diarios sean números positivos si se proporcionan
    const slotFields = [
      { field: 'max_slots_monday', value: body.max_slots_monday },
      { field: 'max_slots_tuesday', value: body.max_slots_tuesday },
      { field: 'max_slots_wednesday', value: body.max_slots_wednesday },
      { field: 'max_slots_thursday', value: body.max_slots_thursday },
      { field: 'max_slots_friday', value: body.max_slots_friday },
      { field: 'max_slots_saturday', value: body.max_slots_saturday },
      { field: 'max_slots_sunday', value: body.max_slots_sunday },
    ];

    for (const { field, value } of slotFields) {
      if (value !== undefined && (typeof value !== 'number' || value < 0)) {
        return NextResponse.json(
          { 
            error: `Campo ${field} inválido`,
            message: `${field} debe ser un número entero mayor o igual a 0`
          },
          { status: 400 }
        );
      }
    }

    // Construir objeto de actualización solo con los campos proporcionados
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.dealership_id !== undefined) updateData.dealership_id = body.dealership_id;
    if (body.workshop_id !== undefined) updateData.workshop_id = body.workshop_id;
    if (body.shift_start_time !== undefined) updateData.shift_start_time = body.shift_start_time;
    if (body.shift_end_time !== undefined) updateData.shift_end_time = body.shift_end_time;
    if (body.lunch_start_time !== undefined) updateData.lunch_start_time = body.lunch_start_time;
    if (body.lunch_end_time !== undefined) updateData.lunch_end_time = body.lunch_end_time;
    if (body.works_monday !== undefined) updateData.works_monday = body.works_monday;
    if (body.works_tuesday !== undefined) updateData.works_tuesday = body.works_tuesday;
    if (body.works_wednesday !== undefined) updateData.works_wednesday = body.works_wednesday;
    if (body.works_thursday !== undefined) updateData.works_thursday = body.works_thursday;
    if (body.works_friday !== undefined) updateData.works_friday = body.works_friday;
    if (body.works_saturday !== undefined) updateData.works_saturday = body.works_saturday;
    if (body.works_sunday !== undefined) updateData.works_sunday = body.works_sunday;
    if (body.max_consecutive_services !== undefined) updateData.max_consecutive_services = body.max_consecutive_services;
    // Límites diarios de slots por día de la semana
    if (body.max_slots_monday !== undefined) updateData.max_slots_monday = body.max_slots_monday;
    if (body.max_slots_tuesday !== undefined) updateData.max_slots_tuesday = body.max_slots_tuesday;
    if (body.max_slots_wednesday !== undefined) updateData.max_slots_wednesday = body.max_slots_wednesday;
    if (body.max_slots_thursday !== undefined) updateData.max_slots_thursday = body.max_slots_thursday;
    if (body.max_slots_friday !== undefined) updateData.max_slots_friday = body.max_slots_friday;
    if (body.max_slots_saturday !== undefined) updateData.max_slots_saturday = body.max_slots_saturday;
    if (body.max_slots_sunday !== undefined) updateData.max_slots_sunday = body.max_slots_sunday;

    // Actualizar el asesor
    const { data: updatedAdvisor, error: updateError } = await supabase
      .from('service_advisors')
      .update(updateData)
      .eq('id', params.id)
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

    if (updateError) {
      console.error('❌ [SERVICE-ADVISORS] Error al actualizar asesor:', updateError);
      return NextResponse.json(
        { 
          error: 'Error al actualizar el asesor',
          details: updateError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ [SERVICE-ADVISORS] Asesor actualizado exitosamente:', params.id);

    return NextResponse.json({
      success: true,
      message: 'Asesor actualizado exitosamente',
      data: updatedAdvisor,
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
 * DELETE /api/service-advisors/[id]
 * Desactiva un asesor (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔧 [SERVICE-ADVISORS] Desactivando asesor:', params.id);
    
    // Verificar que el asesor existe
    const { data: existingAdvisor, error: fetchError } = await supabase
      .from('service_advisors')
      .select('id, name, is_active')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingAdvisor) {
      return NextResponse.json(
        { 
          error: 'Asesor no encontrado',
          message: `No existe un asesor con el ID: ${params.id}`
        },
        { status: 404 }
      );
    }

    if (!existingAdvisor.is_active) {
      return NextResponse.json(
        { 
          error: 'Asesor ya está inactivo',
          message: `El asesor ${existingAdvisor.name} ya está desactivado`
        },
        { status: 400 }
      );
    }

    // Verificar si tiene citas futuras asignadas
    const today = new Date().toISOString().split('T')[0];
    const { data: futureAppointments, error: appointmentsError } = await supabase
      .from('appointment')
      .select('id, appointment_date, appointment_time')
      .eq('assigned_advisor_id', params.id)
      .gte('appointment_date', today)
      .neq('status', 'cancelled')
      .neq('status', 'completed')
      .limit(5);

    if (appointmentsError) {
      console.error('❌ [SERVICE-ADVISORS] Error al verificar citas:', appointmentsError);
    }

    if (futureAppointments && futureAppointments.length > 0) {
      return NextResponse.json(
        { 
          error: 'Asesor tiene citas futuras',
          message: `El asesor ${existingAdvisor.name} tiene ${futureAppointments.length} cita(s) futura(s) asignada(s). Reasigna las citas antes de desactivarlo.`,
          appointments: futureAppointments
        },
        { status: 409 }
      );
    }

    // Realizar soft delete (marcar como inactivo)
    const { data: deactivatedAdvisor, error: deleteError } = await supabase
      .from('service_advisors')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (deleteError) {
      console.error('❌ [SERVICE-ADVISORS] Error al desactivar asesor:', deleteError);
      return NextResponse.json(
        { 
          error: 'Error al desactivar el asesor',
          details: deleteError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ [SERVICE-ADVISORS] Asesor desactivado exitosamente:', params.id);

    return NextResponse.json({
      success: true,
      message: `Asesor ${existingAdvisor.name} desactivado exitosamente`,
      data: deactivatedAdvisor,
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

