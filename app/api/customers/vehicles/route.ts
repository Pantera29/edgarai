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
        { message: 'client_id query parameter is required' },
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
        { message: 'Error checking client' },
        { status: 500 }
      );
    }

    if (!client) {
      return NextResponse.json(
        { message: 'Client not found' },
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
        { message: 'Error fetching vehicles' },
        { status: 500 }
      );
    }

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}