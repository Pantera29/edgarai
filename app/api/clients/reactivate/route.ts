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
      .select('id, dealership_id, agent_active, names, phone_number')
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

    // Verificar si el agente ya está activo
    if (clientExists.agent_active) {
      console.log('⚠️ Agente ya está activo para cliente:', client_id);
      return NextResponse.json(
        { error: 'Agent is already active for this client' },
        { status: 400 }
      );
    }

    // Actualizar el agente a activo
    const { data, error } = await supabase
      .from('client')
      .update({ agent_active: true })
      .eq('id', client_id)
      .select()
      .single();

    if (error) {
      console.log('❌ Error actualizando agente:', error);
      return NextResponse.json(
        { error: 'Error updating agent status', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Agente reactivado exitosamente:', data);

    return NextResponse.json({
      success: true,
      message: 'Agent reactivated successfully',
      client: data
    });

  } catch (error) {
    console.log('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: 'Unexpected error reactivating agent' },
      { status: 500 }
    );
  }
} 