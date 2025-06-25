import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    console.log('🔍 Verificando cliente:', {
      phone,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    if (!phone) {
      console.log('❌ Error: Teléfono no proporcionado');
      return NextResponse.json(
        { message: 'Phone parameter is required in URL query. Usage: /api/customers/verify?phone={phone_number}. The phone number should include country code or local format (digits only will be normalized automatically).' },
        { status: 400 }
      );
    }

    // Normalizar el número de teléfono
    const normalizedPhone = phone.replace(/[^0-9]/g, '');
    console.log('📱 Teléfono normalizado:', normalizedPhone);

    const { data, error } = await supabase
      .from('client')
      .select('id, names, email, created_at, agent_active')
      .eq('phone_number', normalizedPhone)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error verificando cliente:', {
        error: error.message,
        phone: normalizedPhone
      });
      return NextResponse.json(
        { 
          message: 'Database error while verifying client. Please try again or create a new client if this phone number should be registered.',
          error: error.message,
          phone: normalizedPhone
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ Cliente no encontrado:', normalizedPhone);
      return NextResponse.json(
        { 
          exists: false,
          message: 'No client found with this phone number. You can create a new client using the /api/customers/create endpoint.',
          phone: normalizedPhone
        },
        { status: 404 }
      );
    }

    if (data.length > 1) {
      console.log('⚠️ Múltiples clientes encontrados:', {
        count: data.length,
        phone: normalizedPhone,
        clients: data.map(c => ({ id: c.id, name: c.names, created_at: c.created_at }))
      });
      return NextResponse.json(
        { 
          exists: true,
          multipleClients: true,
          count: data.length,
          message: 'Multiple duplicate clients found with this phone number. This indicates a data integrity issue. Please contact the administrator to resolve this duplication.',
          phone: normalizedPhone,
          clients: data.map(client => ({
            id: client.id,
            name: client.names,
            email: client.email,
            agent_active: client.agent_active,
            created_at: client.created_at
          }))
        },
        { status: 409 } // Conflict status for multiple records
      );
    }

    // Caso: exactamente un cliente encontrado
    const client = data[0];
    console.log('✅ Cliente encontrado:', {
      id: client.id,
      name: client.names,
      email: client.email,
      agent_active: client.agent_active
    });

    return NextResponse.json({
      exists: true,
      multipleClients: false,
      message: 'Client found successfully.',
      client: {
        id: client.id,
        name: client.names,
        email: client.email,
        agent_active: client.agent_active
      }
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
      { 
        message: 'Unexpected server error during client verification. Please verify the phone number format and try again. You can also create a new client at /api/customers/create if needed.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}