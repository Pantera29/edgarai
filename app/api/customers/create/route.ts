import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getDealershipId } from "@/lib/config";

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Obtener datos del cuerpo de la solicitud
    const payload = await request.json();
    console.log('Payload recibido:', JSON.stringify(payload, null, 2));

    const { names, email, phone_number, dealership_id, dealership_phone, external_id } = payload;

    // Validar campos requeridos
    if (!names || !email || !phone_number) {
      console.log('Campos faltantes:', {
        names: !names,
        email: !email,
        phone_number: !phone_number
      });
      return NextResponse.json(
        { message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validar formato de email (básico)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Email inválido:', email);
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Normalizar número de teléfono
    const normalizedPhone = phone_number.replace(/[^0-9]/g, '');
    console.log('Número de teléfono normalizado:', normalizedPhone);

    // Verificar si el cliente ya existe
    const { data: existingClient, error: searchError } = await supabase
      .from("client")
      .select("id")
      .or(`email.eq.${email},phone_number.eq.${normalizedPhone}`)
      .maybeSingle();

    if (searchError) {
      console.error('Error buscando cliente existente:', {
        error: searchError.message,
        email,
        phone_number: normalizedPhone
      });
      return NextResponse.json(
        { message: 'Error checking for existing client' },
        { status: 500 }
      );
    }

    if (existingClient) {
      console.log('Cliente ya existe:', existingClient);
      return NextResponse.json(
        { message: 'Client already exists', clientId: existingClient.id },
        { status: 409 }
      );
    }

    // Determinar el dealership_id a usar
    const dealershipIdToUse = dealership_id || await getDealershipId({ 
      dealershipPhone: dealership_phone, 
      supabase 
    });
    console.log('Dealership ID a usar:', dealershipIdToUse);

    // Crear nuevo cliente
    const { data: newClient, error: insertError } = await supabase
      .from('client')
      .insert([{ 
        names, 
        email, 
        phone_number: normalizedPhone, 
        dealership_id: dealershipIdToUse,
        external_id: external_id || null
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error insertando cliente:', {
        error: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      return NextResponse.json(
        { message: 'Failed to create client', error: insertError.message },
        { status: 500 }
      );
    }

    console.log('Cliente creado exitosamente:', newClient);
    return NextResponse.json(
      { message: 'Client created successfully', client: newClient },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error inesperado:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}