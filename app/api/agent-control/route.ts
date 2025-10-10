import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Tipos para las solicitudes
interface PostPayloadByClient {
  client_id: string;
  agent_active: boolean;
  notes?: string;
  updated_by?: string;
}

interface PostPayloadByPhone {
  phone_number: string;
  dealership_id: string;
  agent_active: boolean;
  notes?: string;
  updated_by?: string;
}

type PostPayload = PostPayloadByClient | PostPayloadByPhone;

// Función para normalizar número de teléfono
function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.slice(-10); // Tomar los últimos 10 dígitos
}

// Función para validar número de teléfono
function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return normalized.length === 10;
}

export async function POST(request: Request) {
  try {
    console.log('🎯 Iniciando control de agente...');
    
    const supabase = createServerComponentClient({ cookies });
    
    // Obtener y validar el payload
    const payload: PostPayload = await request.json();
    console.log('📝 Payload recibido:', payload);

    // Validar que agent_active esté presente
    if (typeof payload.agent_active !== 'boolean') {
      console.log('❌ Error: agent_active es requerido y debe ser boolean');
      return NextResponse.json(
        { error: 'agent_active is required and must be a boolean' },
        { status: 400 }
      );
    }

    let phone_number: string;
    let dealership_id: string;
    let method: 'via_client_id' | 'via_phone_dealership';

    // Determinar el método de identificación
    if ('client_id' in payload) {
      console.log('🔍 Obteniendo datos del cliente:', payload.client_id);
      method = 'via_client_id';

      // Obtener datos del cliente
      const { data: clientData, error: clientError } = await supabase
        .from('client')
        .select('phone_number, dealership_id, names')
        .eq('id', payload.client_id)
        .single();

      if (clientError || !clientData) {
        console.log('❌ Cliente no encontrado:', payload.client_id);
        return NextResponse.json(
          { error: 'Client not found with the provided ID' },
          { status: 404 }
        );
      }

      console.log('✅ Datos obtenidos del cliente:', clientData);
      phone_number = normalizePhoneNumber(clientData.phone_number);
      dealership_id = clientData.dealership_id;

    } else if ('phone_number' in payload && 'dealership_id' in payload) {
      console.log('📱 Usando datos directos de teléfono y dealership');
      method = 'via_phone_dealership';

      // Validar número de teléfono
      if (!isValidPhoneNumber(payload.phone_number)) {
        console.log('❌ Número de teléfono inválido:', payload.phone_number);
        return NextResponse.json(
          { error: 'Invalid phone number format. Must be a valid 10-digit number' },
          { status: 400 }
        );
      }

      phone_number = normalizePhoneNumber(payload.phone_number);
      dealership_id = payload.dealership_id;

    } else {
      console.log('❌ Error: Debe proporcionar client_id O (phone_number + dealership_id)');
      return NextResponse.json(
        { error: 'Must provide either client_id OR (phone_number + dealership_id)' },
        { status: 400 }
      );
    }

    // Verificar que el dealership existe
    console.log('🏢 Verificando dealership...');
    const { data: dealershipData, error: dealershipError } = await supabase
      .from('dealerships')
      .select('id, name')
      .eq('id', dealership_id)
      .single();

    if (dealershipError || !dealershipData) {
      console.log('❌ Dealership no encontrado:', dealership_id);
      return NextResponse.json(
        { error: 'Dealership not found with the provided ID' },
        { status: 404 }
      );
    }

    console.log('✅ Dealership verificado:', dealershipData.name);

    // Realizar UPSERT en phone_agent_settings
    console.log('💾 Actualizando phone_agent_settings...');
    const { data: upsertData, error: upsertError } = await supabase
      .from('phone_agent_settings')
      .upsert({
        phone_number,
        dealership_id,
        agent_active: payload.agent_active,
        notes: payload.notes || null,
        updated_by: payload.updated_by || 'system',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'phone_number,dealership_id'
      })
      .select()
      .single();

    if (upsertError) {
      console.log('❌ Error en UPSERT:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update agent settings in database' },
        { status: 500 }
      );
    }

    console.log('✅ Configuración de agente actualizada exitosamente');

    // Preparar respuesta
    const response = {
      success: true,
      phone_number,
      dealership_id,
      agent_active: payload.agent_active,
      method,
      dealership_name: dealershipData.name,
      updated_at: upsertData.updated_at,
      was_created: !upsertData.created_at || upsertData.created_at === upsertData.updated_at,
      message: `Agente ${payload.agent_active ? 'activado' : 'desactivado'} para ${phone_number} en ${dealershipData.name}`
    };

    console.log('🎉 Operación completada:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing agent control request' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const startTime = Date.now();
  try {
    console.log('🔍 Consultando estado de agente...');
    
    const supabase = createServerComponentClient({ cookies });
    
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const client_id = searchParams.get('client_id');
    const phone_number = searchParams.get('phone_number');
    const dealership_id = searchParams.get('dealership_id');

    console.log('📝 Parámetros recibidos:', { client_id, phone_number, dealership_id });

    let normalizedPhone: string;
    let targetDealershipId: string;

    // Determinar el método de identificación
    if (client_id) {
      console.log('🔍 Obteniendo datos del cliente:', client_id);

      // Obtener datos del cliente
      const { data: clientData, error: clientError } = await supabase
        .from('client')
        .select('phone_number, dealership_id')
        .eq('id', client_id)
        .single();

      if (clientError || !clientData) {
        console.log('❌ Cliente no encontrado:', client_id);
        return NextResponse.json(
          { error: 'Client not found with the provided ID' },
          { status: 404 }
        );
      }

      normalizedPhone = normalizePhoneNumber(clientData.phone_number);
      targetDealershipId = clientData.dealership_id;

    } else if (phone_number && dealership_id) {
      console.log('📱 Usando datos directos de teléfono y dealership');

      // Validar número de teléfono
      if (!isValidPhoneNumber(phone_number)) {
        console.log('❌ Número de teléfono inválido:', phone_number);
        return NextResponse.json(
          { error: 'Invalid phone number format. Must be a valid 10-digit number' },
          { status: 400 }
        );
      }

      normalizedPhone = normalizePhoneNumber(phone_number);
      targetDealershipId = dealership_id;

    } else {
      console.log('❌ Error: Debe proporcionar client_id O (phone_number + dealership_id)');
      return NextResponse.json(
        { error: 'Must provide either client_id OR (phone_number + dealership_id)' },
        { status: 400 }
      );
    }

    // Consultar configuración de agente (sin verificar dealership para mejor performance)
    console.log('🔍 Consultando configuración de agente...');
    const { data: agentSettings, error: queryError } = await supabase
      .from('phone_agent_settings')
      .select('*')
      .eq('phone_number', normalizedPhone)
      .eq('dealership_id', targetDealershipId)
      .single();

    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.log('❌ Error consultando configuración:', queryError);
      return NextResponse.json(
        { error: 'Failed to query agent settings from database' },
        { status: 500 }
      );
    }

    // Preparar respuesta
    const response = {
      phone_number: normalizedPhone,
      dealership_id: targetDealershipId,
      agent_active: agentSettings?.agent_active ?? true, // Default: true
      exists: !!agentSettings,
      notes: agentSettings?.notes || null,
      created_at: agentSettings?.created_at || null,
      updated_at: agentSettings?.updated_at || null,
      updated_by: agentSettings?.updated_by || null
    };

    console.log('✅ Consulta completada en', Date.now() - startTime, 'ms');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json(
      { error: 'Internal server error while querying agent status' },
      { status: 500 }
    );
  }
}
