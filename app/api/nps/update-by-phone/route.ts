import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function PATCH(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { phone_number, score, comments } = await request.json();

    console.log('📱 Actualizando NPS por WhatsApp:', {
      phone_number,
      score,
      comments: comments ? 'presente' : 'ausente'
    });

    // Validar parámetros requeridos
    if (!phone_number) {
      console.log('❌ Error: phone_number es requerido');
      return NextResponse.json(
        { message: 'phone_number es requerido' },
        { status: 400 }
      );
    }

    if (score === undefined || score < 0 || score > 10) {
      console.log('❌ Error: score debe ser un número entre 0 y 10');
      return NextResponse.json(
        { message: 'score debe ser un número entre 0 y 10' },
        { status: 400 }
      );
    }

    // Normalizar número de teléfono
    const normalizedPhone = phone_number.replace(/[^0-9]/g, '');
    console.log('📱 Número normalizado:', normalizedPhone);

    // Buscar cliente con diferentes variaciones del número
    console.log('🔍 Buscando cliente...');
    let client = null;
    let clientError = null;

    // Probar diferentes formatos del número
    const phoneVariations = [
      normalizedPhone,
      phone_number,
      phone_number.startsWith('+52') ? phone_number : `+52${normalizedPhone}`,
      phone_number.startsWith('+52') ? phone_number.substring(3) : normalizedPhone
    ];

    for (const phoneVar of phoneVariations) {
      console.log('🔍 Probando variación:', phoneVar);
      const { data, error } = await supabase
        .from('client')
        .select('id, names, phone_number, dealership_id')
        .eq('phone_number', phoneVar)
        .maybeSingle();

      if (error) {
        console.error('❌ Error buscando cliente con variación:', phoneVar, error);
        clientError = error;
        continue;
      }

      if (data) {
        client = data;
        console.log('✅ Cliente encontrado con variación:', phoneVar);
        break;
      }
    }

    if (!client) {
      console.log('❌ Cliente no encontrado con ninguna variación del número');
      return NextResponse.json(
        { 
          message: 'Cliente no encontrado con el número de teléfono proporcionado',
          phone_number: normalizedPhone,
          tried_variations: phoneVariations
        },
        { status: 404 }
      );
    }

    console.log('👤 Cliente encontrado:', {
      id: client.id,
      name: client.names,
      phone: client.phone_number,
      dealership_id: client.dealership_id
    });

    // Buscar NPS pendiente más reciente del cliente
    console.log('🔍 Buscando NPS pendiente...');
    const { data: npsRecords, error: npsError } = await supabase
      .from('nps')
      .select('id, transaction_id, status, created_at')
      .eq('customer_id', client.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (npsError) {
      console.error('❌ Error buscando NPS pendiente:', npsError);
      return NextResponse.json(
        { message: 'Error al buscar encuesta NPS pendiente' },
        { status: 500 }
      );
    }

    if (!npsRecords || npsRecords.length === 0) {
      console.log('❌ No se encontró NPS pendiente para el cliente');
      return NextResponse.json(
        { 
          message: 'No se encontró encuesta NPS pendiente para este cliente',
          client_id: client.id,
          phone_number: client.phone_number
        },
        { status: 404 }
      );
    }

    const npsRecord = npsRecords[0];
    console.log('📊 NPS pendiente encontrado:', {
      id: npsRecord.id,
      transaction_id: npsRecord.transaction_id,
      created_at: npsRecord.created_at
    });

    // Determinar clasificación basada en el score
    let classification: 'promoter' | 'neutral' | 'detractor';
    if (score >= 9) {
      classification = 'promoter';
    } else if (score >= 7) {
      classification = 'neutral';
    } else {
      classification = 'detractor';
    }

    console.log('📊 Clasificación calculada:', {
      score,
      classification
    });

    // Actualizar registro NPS
    console.log('💾 Actualizando registro NPS...');
    const { data: updatedNps, error: updateError } = await supabase
      .from('nps')
      .update({
        score,
        classification,
        comments,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', npsRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error al actualizar registro NPS:', updateError);
      return NextResponse.json(
        { message: 'Error al actualizar encuesta NPS' },
        { status: 500 }
      );
    }

    console.log('✅ NPS actualizado exitosamente:', {
      id: updatedNps.id,
      score: updatedNps.score,
      classification: updatedNps.classification,
      status: updatedNps.status
    });

    // Preparar respuesta
    const response = {
      message: 'Encuesta NPS completada exitosamente',
      nps: {
        id: updatedNps.id,
        score: updatedNps.score,
        classification: updatedNps.classification,
        status: updatedNps.status,
        comments: updatedNps.comments,
        created_at: updatedNps.created_at,
        updated_at: updatedNps.updated_at
      },
      client: {
        id: client.id,
        names: client.names,
        phone_number: client.phone_number,
        dealership_id: client.dealership_id
      }
    };

    return NextResponse.json(response);
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