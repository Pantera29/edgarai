import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const clientId = params.id;
    
    console.log('🗑️ Iniciando eliminación de cliente:', {
      client_id: clientId,
      id_length: clientId?.length,
      is_uuid_format: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId || ''),
      user_agent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    if (!clientId) {
      return NextResponse.json(
        { 
          message: 'Client ID is required in URL path. Please provide a valid client UUID in the URL path.',
          error_code: 'MISSING_CLIENT_ID',
          details: {
            url_format: '/api/customers/delete/{client_uuid}',
            example: '/api/customers/delete/123e4567-e89b-12d3-a456-426614174000'
          }
        },
        { status: 400 }
      );
    }

    // Validar formato del UUID
    const isUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId || '');

    if (!isUuidFormat) {
      console.log('❌ Formato de UUID inválido:', {
        provided_id: clientId,
        id_length: clientId?.length,
        timestamp: new Date().toISOString(),
        error_type: 'INVALID_UUID_FORMAT'
      });
      
      return NextResponse.json(
        { 
          message: 'Invalid client ID format. The client ID must be a UUID.',
          error_code: 'INVALID_UUID_FORMAT',
          details: {
            provided_id: clientId,
            correct_format: 'UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
          }
        },
        { status: 400 }
      );
    }

    // Verificar si el cliente existe
    const { data: clientExists, error: checkError } = await supabase
      .from('client')
      .select('id, names, dealership_id')
      .eq('id', clientId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error de base de datos al verificar cliente:', {
        client_id: clientId,
        error: checkError.message,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          message: 'Database error while checking client. Please verify the client ID format and try again.',
          error_code: 'DATABASE_ERROR',
          details: {
            provided_id: clientId,
            error_type: 'client_existence_check_failed'
          }
        },
        { status: 500 }
      );
    }

    if (!clientExists) {
      console.log('❌ Cliente no encontrado:', {
        provided_id: clientId,
        timestamp: new Date().toISOString(),
        error_type: 'CLIENT_NOT_FOUND'
      });
      
      return NextResponse.json(
        { 
          message: 'Client not found. The specified client ID does not exist.',
          error_code: 'CLIENT_NOT_FOUND',
          details: {
            provided_id: clientId
          }
        },
        { status: 404 }
      );
    }

    // Verificar si el cliente tiene citas asociadas
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointment')
      .select('id')
      .eq('client_id', clientId);

    if (appointmentsError) {
      console.error('❌ Error al verificar citas del cliente:', {
        client_id: clientId,
        error: appointmentsError.message,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          message: 'Error checking client appointments. Please try again.',
          error_code: 'APPOINTMENTS_CHECK_ERROR'
        },
        { status: 500 }
      );
    }

    if (appointments && appointments.length > 0) {
      console.log('❌ Cliente tiene citas asociadas:', {
        client_id: clientId,
        client_name: clientExists.names,
        appointments_count: appointments.length,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          message: `No se puede eliminar el cliente "${clientExists.names}" porque tiene ${appointments.length} cita(s) asociada(s). Primero debe eliminar o reasignar las citas.`,
          error_code: 'CLIENT_HAS_APPOINTMENTS',
          details: {
            client_name: clientExists.names,
            appointments_count: appointments.length
          }
        },
        { status: 409 }
      );
    }

    // Verificar si el cliente tiene conversaciones asociadas
    const { data: conversations, error: conversationsError } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('client_id', clientId);

    if (conversationsError) {
      console.error('❌ Error al verificar conversaciones del cliente:', {
        client_id: clientId,
        error: conversationsError.message,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          message: 'Error checking client conversations. Please try again.',
          error_code: 'CONVERSATIONS_CHECK_ERROR'
        },
        { status: 500 }
      );
    }

    if (conversations && conversations.length > 0) {
      console.log('❌ Cliente tiene conversaciones asociadas:', {
        client_id: clientId,
        client_name: clientExists.names,
        conversations_count: conversations.length,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          message: `No se puede eliminar el cliente "${clientExists.names}" porque tiene ${conversations.length} conversación(es) asociada(s).`,
          error_code: 'CLIENT_HAS_CONVERSATIONS',
          details: {
            client_name: clientExists.names,
            conversations_count: conversations.length
          }
        },
        { status: 409 }
      );
    }

    // Eliminar el cliente
    const { error: deleteError } = await supabase
      .from('client')
      .delete()
      .eq('id', clientId);

    if (deleteError) {
      console.error('❌ Error al eliminar cliente:', {
        client_id: clientId,
        client_name: clientExists.names,
        error: deleteError.message,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          message: 'Error deleting client. Please try again.',
          error_code: 'DELETE_ERROR',
          details: {
            client_name: clientExists.names
          }
        },
        { status: 500 }
      );
    }

    console.log('✅ Cliente eliminado exitosamente:', {
      client_id: clientId,
      client_name: clientExists.names,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      message: `Cliente "${clientExists.names}" eliminado exitosamente.`,
      deleted_client: {
        id: clientId,
        names: clientExists.names
      }
    });

  } catch (error) {
    console.error('💥 Error inesperado al eliminar el cliente:', {
      client_id: params?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { message: 'Error inesperado al eliminar el cliente.' },
      { status: 500 }
    );
  }
}
