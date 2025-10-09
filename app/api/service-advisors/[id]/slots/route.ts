import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ConfigureAdvisorSlotsInput } from '@/types/database.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/service-advisors/[id]/slots
 * Obtiene la configuración de slots de un asesor con información del servicio
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔧 [SERVICE-ADVISORS] Obteniendo slots del asesor:', params.id);
    
    // Verificar que el asesor existe
    const { data: advisor, error: advisorError } = await supabase
      .from('service_advisors')
      .select('id, name, dealership_id')
      .eq('id', params.id)
      .single();

    if (advisorError || !advisor) {
      return NextResponse.json(
        { 
          error: 'Asesor no encontrado',
          message: `No existe un asesor con el ID: ${params.id}`
        },
        { status: 404 }
      );
    }

    // Obtener configuración de slots con JOIN a services
    const { data: slots, error: slotsError } = await supabase
      .from('advisor_slot_configuration')
      .select(`
        id,
        advisor_id,
        slot_position,
        service_id,
        created_at,
        service:services(
          id_uuid,
          service_name,
          description,
          duration_minutes,
          price
        )
      `)
      .eq('advisor_id', params.id)
      .order('slot_position', { ascending: true });

    if (slotsError) {
      console.error('❌ [SERVICE-ADVISORS] Error al obtener slots:', slotsError);
      return NextResponse.json(
        { 
          error: 'Error al obtener configuración de slots',
          details: slotsError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ [SERVICE-ADVISORS] Slots obtenidos:', slots?.length || 0);

    return NextResponse.json({
      success: true,
      data: {
        advisor_id: params.id,
        advisor_name: advisor.name,
        slots: slots || [],
        total_slots: slots?.length || 0,
      },
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
 * POST /api/service-advisors/[id]/slots
 * Configura los slots de un asesor (reemplaza toda la configuración anterior)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: ConfigureAdvisorSlotsInput = await request.json();
    
    console.log('🔧 [SERVICE-ADVISORS] Configurando slots del asesor:', params.id, body);

    // Validar que el body tenga el formato correcto
    if (!body.slots || !Array.isArray(body.slots)) {
      return NextResponse.json(
        { 
          error: 'Formato de datos inválido',
          message: 'Se requiere un array de slots con formato: { slots: [{ position: number, serviceId: string }] }'
        },
        { status: 400 }
      );
    }

    // Verificar que el asesor existe
    const { data: advisor, error: advisorError } = await supabase
      .from('service_advisors')
      .select('id, name, dealership_id, max_consecutive_services')
      .eq('id', params.id)
      .single();

    if (advisorError || !advisor) {
      return NextResponse.json(
        { 
          error: 'Asesor no encontrado',
          message: `No existe un asesor con el ID: ${params.id}`
        },
        { status: 404 }
      );
    }

    // Validar que no se excede el máximo de servicios consecutivos
    if (body.slots.length > advisor.max_consecutive_services) {
      return NextResponse.json(
        { 
          error: 'Excede el límite de servicios',
          message: `El asesor puede atender máximo ${advisor.max_consecutive_services} servicios consecutivos. Se intentó configurar ${body.slots.length}.`
        },
        { status: 400 }
      );
    }

    // Validar que todas las posiciones son únicas y válidas
    const positions = body.slots.map(s => s.position);
    const uniquePositions = new Set(positions);
    
    if (positions.length !== uniquePositions.size) {
      return NextResponse.json(
        { 
          error: 'Posiciones duplicadas',
          message: 'Cada slot debe tener una posición única'
        },
        { status: 400 }
      );
    }

    // Validar que las posiciones son números positivos
    if (body.slots.some(s => s.position < 1)) {
      return NextResponse.json(
        { 
          error: 'Posición inválida',
          message: 'Las posiciones de los slots deben ser números positivos (1, 2, 3...)'
        },
        { status: 400 }
      );
    }

    // Validar que todos los servicios existen y pertenecen al dealership
    for (const slot of body.slots) {
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('id_uuid, service_name, dealership_id')
        .eq('id_uuid', slot.serviceId)
        .single();

      if (serviceError || !service) {
        return NextResponse.json(
          { 
            error: 'Servicio no encontrado',
            message: `No existe un servicio con el ID: ${slot.serviceId}`
          },
          { status: 404 }
        );
      }

      if (service.dealership_id !== advisor.dealership_id) {
        return NextResponse.json(
          { 
            error: 'Servicio no pertenece al dealership',
            message: `El servicio ${service.service_name} no pertenece al mismo dealership del asesor`
          },
          { status: 400 }
        );
      }
    }

    // Eliminar configuración anterior (dentro de una transacción lógica)
    const { error: deleteError } = await supabase
      .from('advisor_slot_configuration')
      .delete()
      .eq('advisor_id', params.id);

    if (deleteError) {
      console.error('❌ [SERVICE-ADVISORS] Error al eliminar slots anteriores:', deleteError);
      return NextResponse.json(
        { 
          error: 'Error al limpiar configuración anterior',
          details: deleteError.message 
        },
        { status: 500 }
      );
    }

    // Si no hay slots nuevos, solo retornar éxito
    if (body.slots.length === 0) {
      console.log('✅ [SERVICE-ADVISORS] Configuración de slots limpiada');
      return NextResponse.json({
        success: true,
        message: 'Configuración de slots eliminada exitosamente',
        data: {
          advisor_id: params.id,
          slots: [],
        },
      });
    }

    // Insertar nueva configuración
    const slotsToInsert = body.slots.map(slot => ({
      advisor_id: params.id,
      slot_position: slot.position,
      service_id: slot.serviceId,
    }));

    const { data: newSlots, error: insertError } = await supabase
      .from('advisor_slot_configuration')
      .insert(slotsToInsert)
      .select(`
        id,
        advisor_id,
        slot_position,
        service_id,
        created_at,
        service:services(
          id_uuid,
          service_name,
          description,
          duration_minutes
        )
      `);

    if (insertError) {
      console.error('❌ [SERVICE-ADVISORS] Error al crear slots:', insertError);
      return NextResponse.json(
        { 
          error: 'Error al crear configuración de slots',
          details: insertError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ [SERVICE-ADVISORS] Slots configurados exitosamente:', newSlots?.length);

    return NextResponse.json({
      success: true,
      message: `${newSlots?.length || 0} slot(s) configurado(s) exitosamente`,
      data: {
        advisor_id: params.id,
        advisor_name: advisor.name,
        slots: newSlots,
        total_slots: newSlots?.length || 0,
      },
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

