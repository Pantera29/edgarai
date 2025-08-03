import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Iniciando petición GET para citas del cliente:', params.id);
  console.log('📝 URL completa:', request.url);
  
  try {
    console.log('🔑 Inicializando cliente Supabase...');
    const supabase = createServerComponentClient({ cookies });
    const clientId = params.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');

    // Validar y convertir el parámetro limit
    let limit: number | null = null;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
        limit = parsedLimit;
      } else {
        console.log('⚠️ Parámetro limit inválido:', limitParam);
        return NextResponse.json(
          { message: 'Invalid limit parameter. Must be a number between 1 and 100.' },
          { status: 400 }
        );
      }
    }

    console.log('🔍 Parámetros de búsqueda:', { clientId, status, limit });

    if (!clientId) {
      console.log('❌ Error: ID de cliente no proporcionado');
      return NextResponse.json(
        { 
          message: 'Client ID is required in URL path. Please provide a valid client UUID.',
          error_code: 'MISSING_CLIENT_ID',
          details: {
            url_format: '/api/customers/{client_uuid}/appointments',
            example: '/api/customers/123e4567-e89b-12d3-a456-426614174000/appointments'
          }
        },
        { status: 400 }
      );
    }

    console.log('📊 Construyendo consulta a Supabase...');
    // Construir la consulta base
    let query = supabase
      .from('appointment')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        service_id,
        vehicle_id,
        services:service_id (
          id_uuid,
          service_name,
          duration_minutes,
          price
        ),
        vehicles:vehicle_id (
          id_uuid,
          make,
          model,
          license_plate,
          year
        )
      `)
      .eq('client_id', clientId)
      .order('appointment_date', { ascending: false });

    // Aplicar filtro por estado si se proporciona
    if (status) {
      console.log('🔍 Aplicando filtro por estado:', status);
      query = query.eq('status', status);
    }

    // Aplicar límite si se proporciona
    if (limit) {
      console.log('🔍 Aplicando límite de resultados:', limit);
      query = query.limit(limit);
    }

    console.log('⏳ Ejecutando consulta a Supabase...');
    const { data, error } = await query;
    console.log('✅ Consulta completada');

    if (error) {
      console.error('❌ Error en la consulta:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Verificar si es un error de autenticación
      if (error.message.includes('auth')) {
        console.log('🔒 Error de autenticación detectado');
        return NextResponse.json(
          { message: 'Error de autenticación. Por favor, inicie sesión nuevamente.' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { message: 'Error al obtener las citas', error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('ℹ️ No se encontraron citas para el cliente:', clientId);
      return NextResponse.json(
        { message: 'No se encontraron citas para este cliente' },
        { status: 404 }
      );
    }

    console.log('✅ Citas encontradas:', data.length);
    return NextResponse.json({ 
      appointments: data,
      total: data.length,
      limit: limit || 'unlimited'
    });
  } catch (error) {
    console.error('💥 Error inesperado:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    return NextResponse.json(
      { message: 'Error interno del servidor', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}