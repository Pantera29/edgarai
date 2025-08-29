import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    console.log('🔄 Iniciando reactivación de agente...');
    
    const supabase = createServerComponentClient({ cookies });
    
    // Obtener y validar el cuerpo de la petición
    const body = await request.json();
    const { client_id } = body;

    if (!client_id) {
      console.log('❌ Error: client_id es requerido');
      return NextResponse.json(
        { error: 'client_id is required' },
        { status: 400 }
      );
    }

    console.log('📊 Reactivando agente para client_id:', client_id);

    // Verificar si el cliente existe y obtener su información
    const { data: clientExists, error: checkError } = await supabase
      .from('client')
      .select('id, dealership_id, names, phone_number')
      .eq('id', client_id)
      .maybeSingle();

    if (checkError) {
      console.log('❌ Error verificando cliente:', checkError);
      return NextResponse.json(
        { error: 'Error checking client existence in database' },
        { status: 500 }
      );
    }

    if (!clientExists) {
      console.log('❌ Cliente no encontrado:', client_id);
      return NextResponse.json(
        { error: 'Client not found with the provided ID' },
        { status: 404 }
      );
    }

    // Verificar si el agente ya está activo usando el nuevo endpoint
    try {
      const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agent-control?client_id=${client_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.agent_active) {
          console.log('⚠️ Agente ya está activo para cliente:', client_id);
          return NextResponse.json(
            { error: 'Agent is already active for this client' },
            { status: 400 }
          );
        }
      }
    } catch (checkError) {
      console.warn('⚠️ No se pudo verificar estado actual del agente, continuando con reactivación:', checkError);
    }

    // Usar el nuevo endpoint agent-control para reactivar el agente
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agent-control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: client_id,
        agent_active: true,
        notes: 'Reactivado desde endpoint legacy /api/clients/reactivate',
        updated_by: 'legacy_reactivate_endpoint'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Error reactivando agente via agent-control:', errorData);
      return NextResponse.json(
        { error: 'Error reactivating agent', details: errorData.message || `HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Agente reactivado exitosamente via agent-control:', result);

    return NextResponse.json({
      success: true,
      message: 'Agent reactivated successfully',
      client: {
        id: clientExists.id,
        names: clientExists.names,
        phone_number: clientExists.phone_number,
        dealership_id: clientExists.dealership_id,
        agent_active: true
      },
      agent_control_result: result
    });

  } catch (error) {
    console.log('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: 'Unexpected error reactivating agent' },
      { status: 500 }
    );
  }
} 