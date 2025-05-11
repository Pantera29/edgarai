import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const clientId = params.id;

    console.log('🚗 Obteniendo vehículos del cliente:', {
      clientId,
      url: request.url
    });

    if (!clientId) {
      console.log('❌ Error: ID de cliente no proporcionado');
      return NextResponse.json(
        { message: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Verificar que el cliente existe
    console.log('🔍 Verificando existencia del cliente:', clientId);
    const { data: client, error: clientError } = await supabase
      .from('client')
      .select('id')
      .eq('id', clientId)
      .maybeSingle();

    if (clientError) {
      console.error('❌ Error al verificar cliente:', {
        error: clientError.message,
        clientId
      });
      return NextResponse.json(
        { message: 'Error checking client' },
        { status: 500 }
      );
    }

    if (!client) {
      console.log('❌ Cliente no encontrado:', clientId);
      return NextResponse.json(
        { message: 'Client not found' },
        { status: 404 }
      );
    }

    // Obtener todos los vehículos del cliente
    console.log('🔍 Obteniendo vehículos del cliente:', clientId);
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('client_id', clientId)
      .order('make', { ascending: true });

    if (vehiclesError) {
      console.error('❌ Error al obtener vehículos:', {
        error: vehiclesError.message,
        clientId
      });
      return NextResponse.json(
        { message: 'Error fetching vehicles' },
        { status: 500 }
      );
    }

    console.log('✅ Vehículos obtenidos exitosamente:', {
      clientId,
      count: vehicles?.length || 0
    });

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('💥 Error inesperado:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}