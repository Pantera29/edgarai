import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { getWorkshopConfiguration, resolveWorkshopId } from '@/lib/workshop-resolver';

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

    if (!clientId) {
      console.log('❌ Error: ID de cliente no proporcionado');
      return NextResponse.json(
        { message: 'Client ID is required' },
        { status: 400 }
      );
    }

    // 1. Obtener información del cliente para extraer dealership_id
    console.log('🔍 Obteniendo información del cliente...');
    const { data: client, error: clientError } = await supabase
      .from('client')
      .select('id, dealership_id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error('❌ Cliente no encontrado:', {
        clientId,
        error: clientError?.message
      });
      return NextResponse.json(
        { message: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Cliente encontrado:', {
      clientId: client.id,
      dealershipId: client.dealership_id
    });

    // 2. Obtener configuración del dealership para timezone
    try {
      const workshopId = await resolveWorkshopId(client.dealership_id, supabase);
      const dealershipConfig = await getWorkshopConfiguration(client.dealership_id, workshopId, supabase);
      
      const timezone = dealershipConfig?.timezone || 'America/Mexico_City';
      console.log('🌎 Configuración de timezone:', {
        dealershipId: client.dealership_id,
        workshopId,
        timezone
      });

      // 3. Calcular la fecha actual en la zona horaria del dealership
      const now = new Date();
      const localDate = utcToZonedTime(now, timezone);
      const todayString = format(localDate, 'yyyy-MM-dd');

      console.log('📅 Cálculo de fecha local:', {
        utcDate: now.toISOString(),
        timezone,
        localDate: localDate.toISOString(),
        todayString
      });

      console.log('🔍 Parámetros de búsqueda:', { 
        clientId,
        endpoint: 'active-appointments',
        statusFilter: ['pending', 'confirmed'],
        dateFilter: `>= ${todayString}`, // Solo citas de hoy en adelante (hora local del dealership)
        timezone
             });

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

    } catch (configError) {
      console.error('❌ Error al obtener configuración del dealership:', {
        error: configError instanceof Error ? configError.message : configError,
        dealershipId: client?.dealership_id,
        clientId
      });
      
      // Fallback: usar UTC como fecha de hoy si falla la configuración
      console.log('⚠️ Usando fallback a UTC para el filtrado de fecha');
      const todayString = new Date().toISOString().split('T')[0];
      
      console.log('🔍 Parámetros de búsqueda (fallback):', { 
        clientId,
        endpoint: 'active-appointments',
        statusFilter: ['pending', 'confirmed'],
        dateFilter: `>= ${todayString}`,
        timezone: 'UTC (fallback)'
      });

      console.log('📊 Construyendo consulta a Supabase (fallback)...');
      // Construir la consulta con fallback
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
        .in('status', ['pending', 'confirmed'])
        .gte('appointment_date', todayString)
        .order('appointment_date', { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error en consulta fallback:', error);
        return NextResponse.json(
          { message: 'Error al obtener las citas', error: error.message },
          { status: 500 }
        );
      }

      console.log('✅ Citas activas encontradas (fallback):', {
        count: data?.length || 0,
        clientId,
        dateFilter: `>= ${todayString}`,
        timezone: 'UTC (fallback)'
      });

      return NextResponse.json({ appointments: data || [] });
    }
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