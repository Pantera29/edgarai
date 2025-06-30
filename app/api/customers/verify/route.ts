import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const dealershipId = searchParams.get('dealership_id');

    console.log('🔍 Verificando cliente:', {
      phone,
      dealershipId,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    if (!phone) {
      console.log('❌ Error: Teléfono no proporcionado');
      return NextResponse.json(
        { message: 'Phone parameter is required in URL query. Usage: /api/customers/verify?phone={phone_number}[&dealership_id={dealership_id}]. The phone number should include country code or local format (digits only will be normalized automatically). The dealership_id parameter is optional and will filter results to that specific dealership.' },
        { status: 400 }
      );
    }

    // Normalizar el número de teléfono
    const normalizedPhone = phone.replace(/[^0-9]/g, '');
    console.log('📱 Teléfono normalizado:', normalizedPhone);

    // Construir la consulta base
    let query = supabase
      .from('client')
      .select('id, names, email, created_at, agent_active, dealership_id')
      .eq('phone_number', normalizedPhone);

    // Agregar filtro por dealership_id si se proporciona
    if (dealershipId) {
      console.log('🏢 Filtrando por dealership_id:', dealershipId);
      query = query.eq('dealership_id', dealershipId);
    }

    // Ordenar por fecha de creación
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error verificando cliente:', {
        error: error.message,
        phone: normalizedPhone,
        dealershipId
      });
      return NextResponse.json(
        { 
          message: 'Database error while verifying client. Please try again or create a new client if this phone number should be registered.',
          error: error.message,
          phone: normalizedPhone,
          dealershipId
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ Cliente no encontrado:', {
        phone: normalizedPhone,
        dealershipId,
        message: dealershipId ? 'en la agencia especificada' : 'en ninguna agencia'
      });
      return NextResponse.json(
        { 
          exists: false,
          message: dealershipId 
            ? `No client found with this phone number in the specified dealership. You can create a new client using the /api/customers/create endpoint.`
            : 'No client found with this phone number. You can create a new client using the /api/customers/create endpoint.',
          phone: normalizedPhone,
          dealershipId
        },
        { status: 404 }
      );
    }

    if (data.length > 1) {
      console.log('⚠️ Múltiples clientes encontrados:', {
        count: data.length,
        phone: normalizedPhone,
        dealershipId,
        clients: data.map(c => ({ id: c.id, name: c.names, created_at: c.created_at, dealership_id: c.dealership_id }))
      });
      return NextResponse.json(
        { 
          exists: true,
          multipleClients: true,
          count: data.length,
          message: dealershipId 
            ? 'Multiple duplicate clients found with this phone number in the specified dealership. This indicates a data integrity issue. Please contact the administrator to resolve this duplication.'
            : 'Multiple clients found with this phone number across different dealerships. Consider using the dealership_id parameter to filter results.',
          phone: normalizedPhone,
          dealershipId,
          clients: data.map(client => ({
            id: client.id,
            name: client.names,
            email: client.email,
            agent_active: client.agent_active,
            created_at: client.created_at,
            dealership_id: client.dealership_id
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
      agent_active: client.agent_active,
      dealership_id: client.dealership_id
    });

    return NextResponse.json({
      exists: true,
      multipleClients: false,
      message: 'Client found successfully.',
      client: {
        id: client.id,
        name: client.names,
        email: client.email,
        agent_active: client.agent_active,
        dealership_id: client.dealership_id
      },
      phone: normalizedPhone,
      dealershipId
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