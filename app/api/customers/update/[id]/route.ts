import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from 'zod';

// Esquema de validación para actualización
const updateClientSchema = z.object({
  agent_active: z.boolean()
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const clientId = params.id;
    
    console.log('👤 Actualizando cliente:', {
      id: clientId,
      url: request.url
    });

    if (!clientId) {
      console.log('❌ Error: ID de cliente no proporcionado');
      return NextResponse.json(
        { message: 'Client ID is required in URL path. Usage: /api/customers/update/{client_id}. You can find client IDs by verifying with phone at /api/customers/verify?phone={phone_number}' },
        { status: 400 }
      );
    }

    // Verificar si el cliente existe
    console.log('🔍 Verificando existencia del cliente:', clientId);
    const { data: clientExists, error: checkError } = await supabase
      .from('client')
      .select('id')
      .eq('id', clientId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error al verificar cliente:', {
        error: checkError.message,
        clientId
      });
      return NextResponse.json(
        { message: 'Error checking client existence in database. This is a temporary system issue. Please verify the client ID is correct or find it using /api/customers/verify?phone={phone_number}' },
        { status: 500 }
      );
    }

    if (!clientExists) {
      console.log('❌ Cliente no encontrado:', clientId);
      return NextResponse.json(
        { message: 'Client not found with the provided ID. Please verify the client ID is correct. You can search for clients by phone at /api/customers/verify?phone={phone_number} or create a new client at /api/customers/create' },
        { status: 404 }
      );
    }

    // Obtener y validar el cuerpo de la petición
    const body = await request.json();
    console.log('📝 Payload de actualización recibido:', body);
    
    const validationResult = updateClientSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('❌ Error de validación:', validationResult.error);
      return NextResponse.json(
        { 
          message: 'Invalid data format. Currently only \'agent_active\' (boolean) field can be updated. Please provide: {"agent_active": true} or {"agent_active": false}',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { agent_active } = validationResult.data;

    // Actualizar el cliente
    console.log('📝 Actualizando cliente:', {
      id: clientId,
      agent_active
    });

    const { data, error } = await supabase
      .from('client')
      .update({ agent_active })
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error al actualizar cliente:', {
        error: error.message,
        clientId
      });
      return NextResponse.json(
        { message: 'Failed to update client in database. Please verify the client ID exists and the data format is correct (agent_active: boolean). You can verify client existence at /api/customers/verify?phone={phone_number}', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Cliente actualizado exitosamente:', {
      id: data.id,
      agent_active: data.agent_active
    });

    return NextResponse.json({ 
      message: 'Client updated successfully',
      client: data
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
      { message: 'Internal server error during client update. Please verify the client ID and data format, then try again. You can check client existence at /api/customers/verify?phone={phone_number}' },
      { status: 500 }
    );
  }
} 