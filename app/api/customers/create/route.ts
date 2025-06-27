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
        { message: 'Missing required parameters. Please provide: names, email, phone_number. Optional: dealership_id, dealership_phone, external_id. You can verify if a client already exists at /api/customers/verify?phone={phone_number}' },
        { status: 400 }
      );
    }

    // Validar formato de email (básico)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Email inválido:', email);
      return NextResponse.json(
        { message: 'Invalid email format. Please provide a valid email address (example: usuario@dominio.com). The email will be used for appointment notifications and client communications.' },
        { status: 400 }
      );
    }

    // Normalizar número de teléfono
    const normalizedPhone = phone_number.replace(/[^0-9]/g, '');
    console.log('Número de teléfono normalizado:', normalizedPhone);

    // Validar longitud del número de teléfono
    if (normalizedPhone.length !== 10) {
      console.log('Teléfono inválido - longitud incorrecta:', {
        original: phone_number,
        normalized: normalizedPhone,
        length: normalizedPhone.length
      });
      return NextResponse.json(
        { message: `Invalid phone number format. Phone number must contain exactly 10 digits after removing non-numeric characters. Received: ${normalizedPhone.length} digits. Example: 5551234567` },
        { status: 400 }
      );
    }

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
        { message: 'Error checking for existing client in database. This is a temporary system issue. Please try again in a few seconds or verify client manually at /api/customers/verify?phone={phone_number}' },
        { status: 500 }
      );
    }

    if (existingClient) {
      console.log('Cliente ya existe:', existingClient);
      return NextResponse.json(
        { message: 'Client already exists with this email or phone number. Use the existing client ID for operations or update client information at /api/customers/update/{client_id}. You can also retrieve client vehicles at /api/customers/{client_id}/vehicles', clientId: existingClient.id },
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
        { message: 'Failed to create client in database. This may be due to data validation or system issues. Please verify all required fields (names, email, phone_number) and try again. If the problem persists, check if the client already exists at /api/customers/verify?phone={phone_number}', error: insertError.message },
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
      { message: 'Internal server error while processing client creation. Please try again in a few moments. If the issue persists, verify client data format and check if the client already exists at /api/customers/verify?phone={phone_number}' },
      { status: 500 }
    );
  }
}