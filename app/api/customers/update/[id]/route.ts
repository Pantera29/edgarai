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
        { message: 'Client ID is required' },
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
        { message: 'Error checking client' },
        { status: 500 }
      );
    }

    if (!clientExists) {
      console.log('❌ Cliente no encontrado:', clientId);
      return NextResponse.json(
        { message: 'Client not found' },
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
          message: 'Datos inválidos',
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
        { message: 'Failed to update client', error: error.message },
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
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 