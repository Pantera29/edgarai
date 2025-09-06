import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/mechanics/[id] - Obtener mecánico específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔧 [MECHANICS] Obteniendo mecánico específico:', params.id);
    
    const { data: mechanic, error } = await supabase
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
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('❌ [MECHANICS] Error al obtener mecánico:', error);
      return NextResponse.json(
        { 
          error: 'Mecánico no encontrado',
          details: error.message 
        },
        { status: 404 }
      );
    }

    console.log('✅ [MECHANICS] Mecánico obtenido exitosamente:', mechanic.name);

    return NextResponse.json({
      success: true,
      data: mechanic
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

// PUT /api/mechanics/[id] - Actualizar mecánico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔧 [MECHANICS] Actualizando mecánico:', params.id);
    
    const body = await request.json();
    const { 
      name, 
      email, 
      phone, 
      specialties, 
      is_active, 
      dealership_id, 
      workshop_id 
    } = body;

    // Verificar que el mecánico existe
    const { data: existingMechanic, error: fetchError } = await supabase
      .from('mechanics')
      .select('id, name, email, dealership_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingMechanic) {
      return NextResponse.json(
        { error: 'Mecánico no encontrado' },
        { status: 404 }
      );
    }

    // Validaciones
    if (name !== undefined && (!name || name.trim() === '')) {
      return NextResponse.json(
        { error: 'El nombre del mecánico no puede estar vacío' },
        { status: 400 }
      );
    }

    // Validar dealership si se proporciona
    if (dealership_id) {
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
      const targetDealershipId = dealership_id || existingMechanic.dealership_id;
      if (workshop.dealership_id !== targetDealershipId) {
        return NextResponse.json(
          { error: 'El workshop no pertenece al dealership especificado' },
          { status: 400 }
        );
      }
    }

    // Validar email único si se proporciona y es diferente al actual
    if (email && email !== existingMechanic.email) {
      const { data: existingEmailMechanic, error: emailError } = await supabase
        .from('mechanics')
        .select('id, name')
        .eq('email', email)
        .neq('id', params.id)
        .single();

      if (existingEmailMechanic) {
        return NextResponse.json(
          { error: 'Ya existe otro mecánico con este email' },
          { status: 409 }
        );
      }
    }

    // Preparar datos para actualización
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (specialties !== undefined) updateData.specialties = specialties;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (dealership_id !== undefined) updateData.dealership_id = dealership_id;
    if (workshop_id !== undefined) updateData.workshop_id = workshop_id;

    // Actualizar el mecánico
    const { data: updatedMechanic, error: updateError } = await supabase
      .from('mechanics')
      .update(updateData)
      .eq('id', params.id)
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

    if (updateError) {
      console.error('❌ [MECHANICS] Error al actualizar mecánico:', updateError);
      return NextResponse.json(
        { 
          error: 'Error al actualizar mecánico',
          details: updateError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ [MECHANICS] Mecánico actualizado exitosamente:', updatedMechanic.name);

    return NextResponse.json({
      success: true,
      data: updatedMechanic,
      message: `Mecánico ${updatedMechanic.name} actualizado exitosamente`
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

// DELETE /api/mechanics/[id] - Eliminar mecánico (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔧 [MECHANICS] Eliminando mecánico:', params.id);
    
    // Verificar que el mecánico existe
    const { data: existingMechanic, error: fetchError } = await supabase
      .from('mechanics')
      .select('id, name, is_active')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingMechanic) {
      return NextResponse.json(
        { error: 'Mecánico no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si tiene citas asignadas
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointment')
      .select('id, appointment_date, appointment_time')
      .eq('assigned_mechanic_id', params.id)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .eq('status', 'confirmed');

    if (appointmentsError) {
      console.error('❌ [MECHANICS] Error al verificar citas:', appointmentsError);
      return NextResponse.json(
        { 
          error: 'Error al verificar citas del mecánico',
          details: appointmentsError.message 
        },
        { status: 500 }
      );
    }

    if (appointments && appointments.length > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar el mecánico porque tiene citas futuras asignadas',
          details: `Citas futuras: ${appointments.length}`,
          appointments: appointments
        },
        { status: 409 }
      );
    }

    // Realizar soft delete (marcar como inactivo)
    const { data: deletedMechanic, error: deleteError } = await supabase
      .from('mechanics')
      .update({ is_active: false })
      .eq('id', params.id)
      .select(`
        id,
        name,
        email,
        phone,
        specialties,
        is_active,
        dealership_id,
        workshop_id,
        created_at
      `)
      .single();

    if (deleteError) {
      console.error('❌ [MECHANICS] Error al eliminar mecánico:', deleteError);
      return NextResponse.json(
        { 
          error: 'Error al eliminar mecánico',
          details: deleteError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ [MECHANICS] Mecánico eliminado exitosamente:', deletedMechanic.name);

    return NextResponse.json({
      success: true,
      data: deletedMechanic,
      message: `Mecánico ${deletedMechanic.name} eliminado exitosamente`
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
