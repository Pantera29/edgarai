import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const model_id = searchParams.get('model_id');
    const dealership_id = searchParams.get('dealership_id');

    console.log('🔄 [SpecificByModel] Consulta recibida:', { model_id, dealership_id });

    if (!model_id || !dealership_id) {
      console.log('❌ [SpecificByModel] Faltan parámetros requeridos');
      return NextResponse.json({
        error: 'Faltan parámetros requeridos: model_id y dealership_id son obligatorios.'
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('specific_services')
      .select('id, service_name, price, kilometers, months, additional_description, service_id, includes_additional')
      .eq('model_id', model_id)
      .eq('dealership_id', dealership_id)
      .eq('is_active', true)
      .order('kilometers', { ascending: true });

    if (error) {
      console.log('❌ [SpecificByModel] Error al consultar specific_services:', error.message);
      return NextResponse.json({ error: 'Error al consultar servicios específicos.' }, { status: 500 });
    }

    console.log('✅ [SpecificByModel] Servicios específicos encontrados:', data?.length || 0);
    return NextResponse.json({ specific_services: data });
  } catch (error) {
    console.log('💥 [SpecificByModel] Error inesperado:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
} 