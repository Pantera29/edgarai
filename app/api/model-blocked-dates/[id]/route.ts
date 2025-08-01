import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// PUT - Actualizar bloqueo por modelo
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const body = await request.json();
    
    const {
      make,
      model,
      start_date,
      end_date,
      reason,
      is_active
    } = body;

    console.log('🔄 Actualizando bloqueo por modelo:', params.id);

    // Preparar datos de actualización
    const updateData: any = {};
    if (make !== undefined) updateData.make = make.trim();
    if (model !== undefined) updateData.model = model.trim();
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (reason !== undefined) updateData.reason = reason.trim();
    if (is_active !== undefined) updateData.is_active = is_active;

    // Validar que end_date >= start_date si ambos están presentes
    if (updateData.start_date && updateData.end_date) {
      if (new Date(updateData.end_date) < new Date(updateData.start_date)) {
        return NextResponse.json(
          { message: 'end_date must be greater than or equal to start_date' },
          { status: 400 }
        );
      }
    }

    const { data: updatedBlock, error } = await supabase
      .from('model_blocked_dates')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error al actualizar bloqueo por modelo:', error);
      return NextResponse.json(
        { message: 'Error updating model blocked date', error: error.message },
        { status: 500 }
      );
    }

    if (!updatedBlock) {
      return NextResponse.json(
        { message: 'Model blocked date not found' },
        { status: 404 }
      );
    }

    console.log('✅ Bloqueo por modelo actualizado exitosamente:', params.id);
    return NextResponse.json({ 
      message: 'Model blocked date updated successfully',
      blockedDate: updatedBlock 
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar bloqueo por modelo (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });

    console.log('🔄 Eliminando bloqueo por modelo:', params.id);

    const { error } = await supabase
      .from('model_blocked_dates')
      .update({ is_active: false })
      .eq('id', params.id);

    if (error) {
      console.error('❌ Error al eliminar bloqueo por modelo:', error);
      return NextResponse.json(
        { message: 'Error deleting model blocked date', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Bloqueo por modelo eliminado exitosamente:', params.id);
    return NextResponse.json({ 
      message: 'Model blocked date deleted successfully' 
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 