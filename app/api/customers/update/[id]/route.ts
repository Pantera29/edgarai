import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const clientId = params.id;

    if (!clientId) {
      return NextResponse.json(
        { 
          message: 'Client ID is required in URL path. Please provide a valid client UUID in the URL path.',
          error_code: 'MISSING_CLIENT_ID',
          details: {
            url_format: '/api/customers/update/{client_uuid}',
            example: '/api/customers/update/123e4567-e89b-12d3-a456-426614174000'
          }
        },
        { status: 400 }
      );
    }

    // Verificar si el cliente existe y obtener su dealership_id
    const { data: clientExists, error: checkError } = await supabase
      .from('client')
      .select('id, dealership_id')
      .eq('id', clientId)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { message: 'Error checking client existence in database.' },
        { status: 500 }
      );
    }

    if (!clientExists) {
      return NextResponse.json(
        { 
          message: 'Client not found with the provided ID. Please ensure you are using the correct client UUID (not phone number or email). Use the client ID from the client record, not the phone number.',
          error_code: 'CLIENT_NOT_FOUND',
          details: {
            provided_id: clientId,
            id_length: clientId?.length,
            is_uuid_format: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId || ''),
            suggestion: 'If you have a phone number, first search for the client using the phone number to get the correct client ID, then use that ID for updates.'
          }
        },
        { status: 404 }
      );
    }

    // Obtener y validar el cuerpo de la petición
    const body = await request.json();
    const { names, email, phone_number, external_id, agent_active } = body;

    // Validar email si se proporciona
    if (email !== undefined && email !== null && email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { message: 'Formato de email inválido.' },
          { status: 400 }
        );
      }
    }

    // Validar teléfono si se proporciona
    let normalizedPhone = undefined;
    if (phone_number !== undefined && phone_number !== null && phone_number !== "") {
      normalizedPhone = phone_number.replace(/[^0-9]/g, '');
      if (normalizedPhone.length !== 10) {
        return NextResponse.json(
          { message: 'El teléfono debe tener exactamente 10 dígitos numéricos.' },
          { status: 400 }
        );
      }
    }

    // Validar duplicados en la misma agencia (excluyendo el propio cliente)
    if ((email && email.trim() !== "") || normalizedPhone) {
      let orConditions = [];
      if (normalizedPhone) orConditions.push(`phone_number.eq.${normalizedPhone}`);
      if (email && email.trim() !== "") orConditions.push(`email.eq.${email}`);

      const { data: existingClients, error: searchError } = await supabase
        .from("client")
        .select("id")
        .eq("dealership_id", clientExists.dealership_id)
        .or(orConditions.join(","))
        .neq("id", clientId);

      if (searchError) {
        return NextResponse.json(
          { message: 'Error consultando la base de datos para duplicados.' },
          { status: 500 }
        );
      }

      if (existingClients && existingClients.length > 1) {
        return NextResponse.json(
          { message: 'Ya existen múltiples clientes con este teléfono o email en esta agencia. Contacta a soporte para resolver la duplicidad.' },
          { status: 409 }
        );
      }
      if (existingClients && existingClients.length === 1) {
        return NextResponse.json(
          { message: 'Ya existe otro cliente con este teléfono o email en esta agencia.' },
          { status: 409 }
        );
      }
    }

    // Preparar objeto de actualización solo con los campos enviados
    const updateData: any = {};
    if (names !== undefined) updateData.names = names;
    if (email !== undefined) updateData.email = email;
    if (normalizedPhone !== undefined) updateData.phone_number = normalizedPhone;
    if (external_id !== undefined) updateData.external_id = external_id;
    if (agent_active !== undefined) updateData.agent_active = agent_active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No se proporcionaron campos para actualizar.' },
        { status: 400 }
      );
    }

    // Actualizar el cliente
    const { data, error } = await supabase
      .from('client')
      .update(updateData)
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { message: 'Error al actualizar el cliente.', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Cliente actualizado exitosamente.',
      client: data
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Error inesperado al actualizar el cliente.' },
      { status: 500 }
    );
  }
} 