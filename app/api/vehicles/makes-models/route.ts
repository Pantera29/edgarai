import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const make_id = searchParams.get('make_id');

    console.log('🔄 [MakesModels] Consulta recibida:', { make_id });

    if (make_id) {
      // Obtener modelos de una marca específica
      const { data: models, error: modelsError } = await supabase
        .from('vehicle_models')
        .select(`
          id,
          name,
          make_id,
          year_start,
          year_end,
          is_active,
          make:vehicle_makes (
            id,
            name
          )
        `)
        .eq('make_id', make_id)
        .eq('is_active', true)
        .order('name');

      if (modelsError) {
        console.log('❌ [MakesModels] Error al consultar modelos:', modelsError.message);
        return NextResponse.json({ 
          error: 'Error al consultar modelos.' 
        }, { status: 500 });
      }

      console.log('✅ [MakesModels] Modelos encontrados:', models?.length || 0);
      return NextResponse.json({ 
        models: models || []
      });

    } else {
      // Obtener todas las marcas
      const { data: makes, error: makesError } = await supabase
        .from('vehicle_makes')
        .select('id, name, logo_url')
        .order('name');

      if (makesError) {
        console.log('❌ [MakesModels] Error al consultar marcas:', makesError.message);
        return NextResponse.json({ 
          error: 'Error al consultar marcas.' 
        }, { status: 500 });
      }

      console.log('✅ [MakesModels] Marcas encontradas:', makes?.length || 0);
      return NextResponse.json({ 
        makes: makes || []
      });
    }

  } catch (error) {
    console.log('💥 [MakesModels] Error inesperado:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor.' 
    }, { status: 500 });
  }
}
