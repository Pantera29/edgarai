import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const dealership_id = searchParams.get('dealership_id');
    const workshop_id = searchParams.get('workshop_id');

    console.log('🔧 Obteniendo lista de servicios:', {
      category,
      dealership_id,
      workshop_id,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    // Verificar si se proporcionó el dealership_id
    if (!dealership_id) {
      console.log('❌ Error: dealership_id no proporcionado');
      return NextResponse.json(
        { message: 'El parámetro dealership_id es obligatorio' },
        { status: 400 }
      );
    }

    console.log('🔍 Construyendo consulta para dealership:', dealership_id);
    
    // Si se proporciona workshop_id, filtrar por servicios disponibles en ese taller
    if (workshop_id) {
      console.log('🔍 Aplicando filtro por workshop_id:', workshop_id);
      
      // Consulta que incluye JOIN con workshop_services
      let query = supabase
        .from('services')
        .select(`
          *,
          workshop_services!inner (
            workshop_id,
            is_available
          )
        `)
        .eq('dealership_id', dealership_id)
        .eq('client_visible', true)
        .eq('workshop_services.workshop_id', workshop_id)
        .eq('workshop_services.is_available', true)
        .order('service_name');

      // Si se proporciona una categoría, filtrar por ella
      if (category) {
        console.log('🔍 Aplicando filtro por categoría:', category);
        query = query.eq('category', category);
      }

      console.log('⏳ Ejecutando consulta con filtro de workshop...');
      const { data, error } = await query;

      if (error) {
        console.error('❌ Error al obtener servicios por workshop:', {
          error: error.message,
          dealership_id,
          workshop_id,
          category
        });
        return NextResponse.json(
          { message: 'Error fetching services for workshop' },
          { status: 500 }
        );
      }

      // Limpiar la respuesta para remover los datos de workshop_services
      const cleanData = data?.map(service => {
        const { workshop_services, ...cleanService } = service;
        return cleanService;
      });

      console.log('✅ Servicios obtenidos exitosamente para workshop:', {
        count: cleanData?.length || 0,
        dealership_id,
        workshop_id,
        category
      });

      return NextResponse.json({ services: cleanData });
    } else {
      // Consulta original sin filtro de workshop
      let query = supabase
        .from('services')
        .select('*')
        .eq('dealership_id', dealership_id)
        .eq('client_visible', true)
        .order('service_name');

      // Si se proporciona una categoría, filtrar por ella
      if (category) {
        console.log('🔍 Aplicando filtro por categoría:', category);
        query = query.eq('category', category);
      }

      console.log('⏳ Ejecutando consulta sin filtro de workshop...');
      const { data, error } = await query;

      if (error) {
        console.error('❌ Error al obtener servicios:', {
          error: error.message,
          dealership_id,
          category
        });
        return NextResponse.json(
          { message: 'Error fetching services' },
          { status: 500 }
        );
      }

      console.log('✅ Servicios obtenidos exitosamente:', {
        count: data?.length || 0,
        dealership_id,
        category
      });

      return NextResponse.json({ services: data });
    }
  } catch (error) {
    console.error('💥 Error inesperado:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}