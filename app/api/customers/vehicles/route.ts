import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json(
        { message: 'client_id query parameter is required. Usage: /api/customers/vehicles?client_id={client_id}. You can find client IDs by verifying with phone at /api/customers/verify?phone={phone_number}' },
        { status: 400 }
      );
    }

    // Verificar primero que el cliente existe
    const { data: client, error: clientError } = await supabase
      .from('client')
      .select('id')
      .eq('id', clientId)
      .maybeSingle();

    if (clientError) {
      console.error('Error checking client:', clientError.message);
      return NextResponse.json(
        { message: 'Error checking client existence in database. This is a temporary system issue. Please verify the client_id parameter is correct or find it using /api/customers/verify?phone={phone_number}' },
        { status: 500 }
      );
    }

    if (!client) {
      return NextResponse.json(
        { message: 'Client not found with the provided client_id. Please verify the ID is correct. You can search for clients by phone at /api/customers/verify?phone={phone_number} or use the alternative endpoint /api/customers/{client_id}/vehicles' },
        { status: 404 }
      );
    }

    // Obtener todos los vehículos del cliente
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('client_id', clientId)
      .order('make', { ascending: true });

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError.message);
      return NextResponse.json(
        { message: 'Error fetching vehicles from database. This is a temporary system issue. The client exists but there was a problem retrieving their vehicles. Please try again or add a new vehicle at /api/vehicles/create' },
        { status: 500 }
      );
    }

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error while fetching client vehicles. Please verify the client_id parameter format and try again. You can find the correct client_id at /api/customers/verify?phone={phone_number}' },
      { status: 500 }
    );
  }
}