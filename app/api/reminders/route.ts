import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  console.log('🔔 [Reminders API] Nueva petición recibida');
  console.log('📝 [Reminders API] Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    console.log('📦 [Reminders API] Body recibido:', JSON.stringify(body, null, 2));

    // Validar campos requeridos
    const requiredFields = ['client_id_uuid', 'vehicle_id', 'service_id', 'base_date', 'reminder_date'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      console.log('❌ [Reminders API] Campos requeridos faltantes:', missingFields);
      return NextResponse.json(
        { error: `Campos requeridos faltantes: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Convertir fechas a UTC
    const baseDateUTC = new Date(body.base_date + "T00:00:00Z").toISOString();
    const reminderDateUTC = new Date(body.reminder_date + "T00:00:00Z").toISOString();
    console.log('📅 [Reminders API] Fechas convertidas:', {
      base_date: { original: body.base_date, utc: baseDateUTC },
      reminder_date: { original: body.reminder_date, utc: reminderDateUTC }
    });

    // Preparar datos del recordatorio
    const recordatorioData = {
      client_id_uuid: body.client_id_uuid,
      vehicle_id: body.vehicle_id,
      service_id: body.service_id,
      base_date: baseDateUTC,
      reminder_date: reminderDateUTC,
      notes: body.notes || '',
      status: 'pending' as const
    };
    console.log('📋 [Reminders API] Datos preparados para inserción:', JSON.stringify(recordatorioData, null, 2));

    // Insertar recordatorio
    console.log('💾 [Reminders API] Intentando insertar recordatorio en Supabase...');
    const { data, error } = await supabase
      .from('reminders')
      .insert([recordatorioData])
      .select(`
        *,
        client!reminders_client_id_fkey (
          names,
          email,
          phone_number,
          dealership_id
        ),
        vehicles!reminders_vehicle_id_fkey (
          make,
          model,
          year,
          license_plate
        ),
        services (
          service_name,
          description,
          dealership_id
        )
      `)
      .single();

    if (error) {
      console.error('❌ [Reminders API] Error al crear recordatorio:', error);
      return NextResponse.json(
        { error: 'Error al crear el recordatorio', details: error },
        { status: 500 }
      );
    }

    console.log('✅ [Reminders API] Recordatorio creado exitosamente:', JSON.stringify(data, null, 2));
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('❌ [Reminders API] Error no manejado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 