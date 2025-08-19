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

    console.log('🚗 Obteniendo vehículos del cliente:', {
      clientId,
      limit,
      url: request.url
    });

    if (!clientId) {
      console.log('❌ Error: ID de cliente no proporcionado');
      return NextResponse.json(
        { message: 'Client ID is required in URL path. Usage: /api/customers/{client_id}/vehicles. You can find client IDs by verifying with phone at /api/customers/verify?phone={phone_number}' },
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
        { message: 'Error checking client existence in database. This is a temporary system issue. Please verify the client ID is correct using /api/customers/verify?phone={phone_number}' },
        { status: 500 }
      );
    }

    if (!client) {
      console.log('❌ Cliente no encontrado:', clientId);
      return NextResponse.json(
        { message: 'Client not found with the provided ID. Please verify the client ID is correct. You can search for clients by phone at /api/customers/verify?phone={phone_number} or view all customer vehicles using /api/customers/vehicles?client_id={client_id}' },
        { status: 404 }
      );
    }

    // Construir la consulta base
    let query = supabase
      .from('vehicles')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false }); // Ordenar por fecha de creación descendente

    // Aplicar límite si se proporciona
    if (limit) {
      console.log('🔍 Aplicando límite de resultados:', limit);
      query = query.limit(limit);
    }

    // Obtener vehículos del cliente
    console.log('🔍 Obteniendo vehículos del cliente:', clientId);
    const { data: vehicles, error: vehiclesError } = await query;

    if (vehiclesError) {
      console.error('❌ Error al obtener vehículos:', {
        error: vehiclesError.message,
        clientId
      });
      return NextResponse.json(
        { message: 'Error fetching vehicles from database. This is a temporary system issue. The client exists but there was a problem retrieving their vehicles. Please try again or add a new vehicle at /api/vehicles/create' },
        { status: 500 }
      );
    }

    console.log('✅ Vehículos obtenidos exitosamente:', {
      clientId,
      count: vehicles?.length || 0,
      limit: limit || 'unlimited'
    });

    return NextResponse.json({ 
      vehicles,
      total: vehicles?.length || 0,
      limit: limit || 'unlimited'
    });
  } catch (error) {
    console.error('💥 Error inesperado:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    return NextResponse.json(
      { message: 'Internal server error while fetching client vehicles. Please verify the client ID and try again. You can check client existence at /api/customers/verify?phone={phone_number}' },
      { status: 500 }
    );
  }
}