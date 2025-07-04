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

    // Validar campos requeridos (solo names y phone_number son obligatorios)
    if (!names || !phone_number) {
      console.log('Campos faltantes:', {
        names: !names,
        phone_number: !phone_number
      });
      return NextResponse.json(
        { message: 'Missing required parameters. Please provide: names, phone_number. Optional: email, dealership_id, dealership_phone, external_id. You can verify if a client already exists at /api/customers/verify?phone={phone_number}' },
        { status: 400 }
      );
    }

    // Validar formato de email solo si se proporciona
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('Email inválido:', email);
        return NextResponse.json(
          { message: 'Invalid email format. Please provide a valid email address (example: usuario@dominio.com). The email will be used for appointment notifications and client communications.' },
          { status: 400 }
        );
      }
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

    // Determinar el dealership_id a usar
    const dealershipIdToUse = dealership_id || await getDealershipId({ 
      dealershipPhone: dealership_phone, 
      supabase,
      useFallback: false
    });
    
    if (!dealershipIdToUse) {
      console.log('❌ Error: No se pudo determinar el ID de la agencia');
      
      // Si se proporcionó un teléfono pero no se encontró, dar mensaje específico
      if (dealership_phone) {
        return NextResponse.json(
          { message: 'No se encontró ningún dealership con ese número de teléfono' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { message: 'Could not determine dealership ID' },
        { status: 400 }
      );
    }
    
    console.log('Dealership ID a usar:', dealershipIdToUse);

    // Verificar si el cliente ya existe
    // Buscar por teléfono O email en la misma agencia
    let existingClients = [];
    let searchError = null;
    if (email && email.trim() !== '') {
      const { data, error } = await supabase
        .from("client")
        .select("id")
        .eq("dealership_id", dealershipIdToUse)
        .or(`phone_number.eq.${normalizedPhone},email.eq.${email}`);
      existingClients = data || [];
      searchError = error;
    } else {
      const { data, error } = await supabase
        .from("client")
        .select("id")
        .eq("dealership_id", dealershipIdToUse)
        .eq("phone_number", normalizedPhone);
      existingClients = data || [];
      searchError = error;
    }

    if (searchError) {
      console.error('Error buscando cliente existente:', {
        error: searchError.message,
        email,
        phone_number: normalizedPhone,
        dealership_id: dealershipIdToUse
      });
      return NextResponse.json(
        { message: 'Error consultando la base de datos. Intenta nuevamente o contacta a soporte si el problema persiste.' },
        { status: 500 }
      );
    }

    if (existingClients.length > 1) {
      console.log('Múltiples clientes encontrados con el mismo teléfono/email en esta agencia:', existingClients);
      return NextResponse.json(
        { message: 'Ya existen múltiples clientes con este teléfono o email en esta agencia. Contacta a soporte para resolver la duplicidad.' },
        { status: 409 }
      );
    }

    if (existingClients.length === 1) {
      console.log('Cliente ya existe en esta agencia:', existingClients[0]);
      return NextResponse.json(
        { message: 'Ya existe un cliente con este teléfono o email en esta agencia.', clientId: existingClients[0].id },
        { status: 409 }
      );
    }

    // Preparar objeto de cliente para inserción
    const clientData: any = {
      names,
      phone_number: normalizedPhone,
      dealership_id: dealershipIdToUse,
      external_id: external_id || null
    };

    // Solo incluir email si se proporciona y no está vacío
    if (email && email.trim() !== '') {
      clientData.email = email;
    }

    // Crear nuevo cliente
    const { data: newClient, error: insertError } = await supabase
      .from('client')
      .insert([clientData])
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
        { message: 'Failed to create client in database. This may be due to data validation or system issues. Please verify all required fields (names, phone_number) and try again. If the problem persists, check if the client already exists at /api/customers/verify?phone={phone_number}', error: insertError.message },
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