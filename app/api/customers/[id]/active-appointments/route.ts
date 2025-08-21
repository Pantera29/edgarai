import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Iniciando petición GET para citas activas del cliente:', params.id);
  console.log('📝 URL completa:', request.url);
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  try {
    console.log('🔑 Inicializando cliente Supabase...');
    const supabase = createServerComponentClient({ cookies });
    const clientId = params.id;
    const { searchParams } = new URL(request.url);
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

    console.log('🔍 Parámetros de búsqueda:', { 
      clientId,
      endpoint: 'active-appointments',
      statusFilter: ['pending', 'confirmed'],
      limit
    });

    if (!clientId) {
      console.log('❌ Error: ID de cliente no proporcionado');
      return NextResponse.json(
        { message: 'Client ID is required' },
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
        specific_service_id,
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
        ),
        specific_services:specific_service_id (
          id,
          service_name,
          price,
          kilometers,
          months,
          additional_price,
          additional_description,
          includes_additional,
          model:vehicle_models (
            name,
            make:vehicle_makes (
              name
            )
          ),
          service:services (
            service_name
          )
        )
      `)
      .eq('client_id', clientId)
      .in('status', ['pending', 'confirmed']) // Filtrar solo citas pendientes y confirmadas
      .order('appointment_date', { ascending: false });

    // Aplicar límite si se proporciona
    if (limit) {
      console.log('🔍 Aplicando límite de resultados:', limit);
      query = query.limit(limit);
    }

    console.log('⏳ Ejecutando consulta a Supabase...');
    console.log('🔍 Query construida:', {
      table: 'appointment',
      filters: {
        client_id: clientId,
        status: ['pending', 'confirmed']
      },
      order: 'appointment_date DESC',
      limit: limit || 'unlimited'
    });

    const { data, error } = await query;
    console.log('✅ Consulta completada');

    if (error) {
      console.error('❌ Error en la consulta:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        timestamp: new Date().toISOString()
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
      console.log('ℹ️ No se encontraron citas activas para el cliente:', {
        clientId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { message: 'No se encontraron citas activas para este cliente' },
        { status: 404 }
      );
    }

    console.log('✅ Citas activas encontradas:', {
      count: data.length,
      clientId,
      statuses: data.map(app => app.status),
      timestamp: new Date().toISOString()
    });

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
      } : error,
      timestamp: new Date().toISOString(),
      clientId: params.id
    });
    return NextResponse.json(
      { message: 'Error interno del servidor', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 