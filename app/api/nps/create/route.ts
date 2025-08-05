import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { appointment_id, customer_id } = await request.json();

    console.log('📝 Creando nuevo registro NPS:', {
      appointment_id,
      customer_id
    });

    // Validar campos requeridos
    if (!appointment_id || !customer_id) {
      console.log('❌ Error: Campos requeridos faltantes');
      return NextResponse.json(
        { message: 'appointment_id y customer_id son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la cita existe
    console.log('🔍 Verificando existencia de la cita:', appointment_id);
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointment')
      .select('id')
      .eq('id', appointment_id)
      .maybeSingle();

    if (appointmentError) {
      console.error('❌ Error al verificar cita:', appointmentError);
      return NextResponse.json(
        { message: 'Error al verificar cita' },
        { status: 500 }
      );
    }

    if (!appointment) {
      console.log('❌ Cita no encontrada:', appointment_id);
      return NextResponse.json(
        { message: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el cliente existe
    console.log('🔍 Verificando existencia del cliente:', customer_id);
    const { data: customer, error: customerError } = await supabase
      .from('client')
      .select('id')
      .eq('id', customer_id)
      .maybeSingle();

    if (customerError) {
      console.error('❌ Error al verificar cliente:', customerError);
      return NextResponse.json(
        { message: 'Error al verificar cliente' },
        { status: 500 }
      );
    }

    if (!customer) {
      console.log('❌ Cliente no encontrado:', customer_id);
      return NextResponse.json(
        { message: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Crear registro NPS
    console.log('💾 Creando registro NPS...');
    const { data: npsRecord, error: npsError } = await supabase
      .from('nps')
      .insert({
        appointment_id,
        customer_id,
        status: 'pending',
        score: null,
        classification: null,
        comments: null
      })
      .select()
      .single();

    if (npsError) {
      console.error('❌ Error al crear registro NPS:', npsError);
      return NextResponse.json(
        { message: 'Error al crear registro NPS' },
        { status: 500 }
      );
    }

    console.log('✅ Registro NPS creado exitosamente:', npsRecord);
    return NextResponse.json(npsRecord, { status: 201 });
  } catch (error) {
    console.error('💥 Error inesperado:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 