import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const body = await request.json();
    const { id } = params;
    
    const {
      model_id,
      service_name,
      kilometers,
      months,
      price,
      service_id,
      additional_price,
      additional_description,
      includes_additional,
      is_active
    } = body;

    // Validaciones
    if (!model_id || !service_name || !kilometers || !months) {
      return NextResponse.json({
        error: 'Faltan campos requeridos: model_id, service_name, kilometers, months son obligatorios.'
      }, { status: 400 });
    }

    if (kilometers <= 0 || months <= 0) {
      return NextResponse.json({
        error: 'Kilometraje y meses deben ser valores positivos.'
      }, { status: 400 });
    }

    console.log('🔄 [SpecificServiceUpdate] Actualizando servicio específico:', id);

    const { data, error } = await supabase
      .from('specific_services')
      .update({
        model_id,
        service_name,
        kilometers,
        months,
        price: price || 0,
        service_id: service_id || null,
        additional_price: additional_price || 0,
        additional_description: additional_description || "",
        includes_additional: includes_additional !== undefined ? includes_additional : true,
        is_active: is_active !== undefined ? is_active : true
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.log('❌ [SpecificServiceUpdate] Error al actualizar servicio específico:', error.message);
      return NextResponse.json({ 
        error: 'Error al actualizar el servicio específico.',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ [SpecificServiceUpdate] Servicio específico actualizado:', id);
    return NextResponse.json({ 
      success: true, 
      specific_service: data 
    });

  } catch (error) {
    console.log('💥 [SpecificServiceUpdate] Error inesperado:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor.' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { id } = params;

    console.log('🔄 [SpecificServiceDelete] Eliminando servicio específico:', id);

    const { error } = await supabase
      .from('specific_services')
      .delete()
      .eq('id', id);

    if (error) {
      console.log('❌ [SpecificServiceDelete] Error al eliminar servicio específico:', error.message);
      return NextResponse.json({ 
        error: 'Error al eliminar el servicio específico.',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ [SpecificServiceDelete] Servicio específico eliminado:', id);
    return NextResponse.json({ 
      success: true 
    });

  } catch (error) {
    console.log('💥 [SpecificServiceDelete] Error inesperado:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor.' 
    }, { status: 500 });
  }
}
