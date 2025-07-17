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

    // Obtener la fecha actual en formato YYYY-MM-DD para el filtrado
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Formato: YYYY-MM-DD

    console.log('🔍 Parámetros de búsqueda:', { 
      clientId,
      endpoint: 'active-appointments',
      statusFilter: ['pending', 'confirmed'],
      dateFilter: `>= ${todayString}` // Solo citas de hoy en adelante
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
      .in('status', ['pending', 'confirmed']) // Filtrar solo citas pendientes y confirmadas
      .gte('appointment_date', todayString) // Filtrar solo fechas de hoy en adelante
      .order('appointment_date', { ascending: false });

    console.log('⏳ Ejecutando consulta a Supabase...');
    console.log('🔍 Query construida:', {
      table: 'appointment',
      filters: {
        client_id: clientId,
        status: ['pending', 'confirmed'],
        appointment_date: `>= ${todayString}`
      },
      order: 'appointment_date DESC'
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
        dateFilter: `>= ${todayString}`,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { message: 'No se encontraron citas activas (pendientes/confirmadas y fechas futuras) para este cliente' },
        { status: 404 }
      );
    }

    console.log('✅ Citas activas encontradas:', {
      count: data.length,
      clientId,
      statuses: data.map(app => app.status),
      dates: data.map(app => app.appointment_date),
      dateFilter: `>= ${todayString}`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ appointments: data });
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