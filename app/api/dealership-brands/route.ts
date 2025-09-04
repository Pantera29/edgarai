import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const dealershipId = searchParams.get('dealership_id');

    if (!dealershipId) {
      return NextResponse.json(
        { message: 'dealership_id parameter is required' },
        { status: 400 }
      );
    }

    console.log('🏢 Obteniendo marcas permitidas para dealership:', dealershipId);

    // Obtener marcas permitidas para el dealership
    const { data: marcas, error } = await supabase
      .from('dealership_brands')
      .select(`
        make_id,
        vehicle_makes!inner (
          id,
          name
        )
      `)
      .eq('dealership_id', dealershipId);

    if (error) {
      console.error('❌ Error cargando marcas permitidas:', error);
      return NextResponse.json(
        { message: 'Error loading dealership brands', error: error.message },
        { status: 500 }
      );
    }

    // Si no hay marcas configuradas, cargar todas las marcas disponibles
    if (!marcas || marcas.length === 0) {
      console.log('📋 No hay marcas configuradas, cargando todas las marcas disponibles');
      
      const { data: todasMarcas, error: errorTodasMarcas } = await supabase
        .from('vehicle_makes')
        .select('id, name')
        .order('name');

      if (errorTodasMarcas) {
        console.error('❌ Error cargando todas las marcas:', errorTodasMarcas);
        return NextResponse.json(
          { message: 'Error loading all vehicle makes', error: errorTodasMarcas.message },
          { status: 500 }
        );
      }

      console.log('✅ Marcas cargadas exitosamente:', todasMarcas?.length || 0);
      return NextResponse.json(todasMarcas || []);
    }

    // Extraer marcas con IDs del dealership_brands
    const marcasConId = marcas.map((m: any) => m.vehicle_makes);
    
    console.log('✅ Marcas permitidas cargadas exitosamente:', marcasConId.length);
    return NextResponse.json(marcasConId);

  } catch (error) {
    console.error('❌ Error en endpoint dealership-brands:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
