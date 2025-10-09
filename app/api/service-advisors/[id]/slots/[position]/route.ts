import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * DELETE /api/service-advisors/[id]/slots/[position]
 * Elimina un slot específico de la configuración de un asesor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; position: string } }
) {
  try {
    const slotPosition = parseInt(params.position, 10);

    console.log('🔧 [SERVICE-ADVISORS] Eliminando slot:', {
      advisor_id: params.id,
      position: slotPosition,
    });

    // Validar que la posición es un número válido
    if (isNaN(slotPosition) || slotPosition < 1) {
      return NextResponse.json(
        { 
          error: 'Posición inválida',
          message: 'La posición del slot debe ser un número positivo'
        },
        { status: 400 }
      );
    }

    // Verificar que el asesor existe
    const { data: advisor, error: advisorError } = await supabase
      .from('service_advisors')
      .select('id, name')
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

    // Verificar que el slot existe
    const { data: existingSlot, error: slotError } = await supabase
      .from('advisor_slot_configuration')
      .select(`
        id,
        slot_position,
        service:services(
          service_name
        )
      `)
      .eq('advisor_id', params.id)
      .eq('slot_position', slotPosition)
      .single();

    if (slotError || !existingSlot) {
      return NextResponse.json(
        { 
          error: 'Slot no encontrado',
          message: `No existe un slot en la posición ${slotPosition} para el asesor ${advisor.name}`
        },
        { status: 404 }
      );
    }

    // Eliminar el slot
    const { error: deleteError } = await supabase
      .from('advisor_slot_configuration')
      .delete()
      .eq('advisor_id', params.id)
      .eq('slot_position', slotPosition);

    if (deleteError) {
      console.error('❌ [SERVICE-ADVISORS] Error al eliminar slot:', deleteError);
      return NextResponse.json(
        { 
          error: 'Error al eliminar el slot',
          details: deleteError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ [SERVICE-ADVISORS] Slot eliminado exitosamente');

    return NextResponse.json({
      success: true,
      message: `Slot ${slotPosition} eliminado exitosamente`,
      deleted: {
        advisor_id: params.id,
        advisor_name: advisor.name,
        slot_position: slotPosition,
        service: existingSlot.service,
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

