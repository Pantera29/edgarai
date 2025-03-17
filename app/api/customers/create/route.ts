import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Obtener datos del cuerpo de la solicitud
    const { names, email, phone_number, dealership_id } = await request.json();

    // Validar campos requeridos
    if (!names || !email || !phone_number || !dealership_id) {
      return NextResponse.json(
        { message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validar formato de email (básico)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Verificar si el cliente ya existe
    const { data: existingClient, error: searchError } = await supabase
      .from("client")
      .select("id")
      .or(`email.eq.${email},phone_number.eq.${phone_number}`)
      .maybeSingle();

    if (searchError) {
      console.error('Error searching for existing client:', searchError.message);
      return NextResponse.json(
        { message: 'Error checking for existing client' },
        { status: 500 }
      );
    }

    if (existingClient) {
      return NextResponse.json(
        { message: 'Client already exists', clientId: existingClient.id },
        { status: 409 }
      );
    }

    // Crear nuevo cliente
    const { data: newClient, error: insertError } = await supabase
      .from('client')
      .insert([{ names, email, phone_number, dealership_id }])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting client:', insertError.message);
      return NextResponse.json(
        { message: 'Failed to create client', error: insertError.message },
        { status: 500 }
      );
    }

    // Devolver cliente creado
    return NextResponse.json(
      { message: 'Client created successfully', client: newClient },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}