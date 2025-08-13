import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const name = searchParams.get('name');
    const dealershipId = searchParams.get('dealership_id');

    console.log('🔍 Verificando cliente:', {
      phone,
      name,
      dealershipId,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    // Validar que se proporcione al menos phone o name
    if (!phone && !name) {
      console.log('❌ Error: No se proporcionó phone ni name');
      return NextResponse.json(
        { 
          message: 'Either phone or name parameter is required in URL query. Usage: /api/customers/verify?phone={phone_number}[&dealership_id={dealership_id}] OR /api/customers/verify?name={name}&dealership_id={dealership_id}. The dealership_id parameter is required when searching by name.' 
        },
        { status: 400 }
      );
    }

    // Si se busca por nombre, dealership_id es obligatorio
    if (name && !dealershipId) {
      console.log('❌ Error: dealership_id es obligatorio cuando se busca por nombre');
      return NextResponse.json(
        { 
          message: 'dealership_id parameter is required when searching by name. Usage: /api/customers/verify?name={name}&dealership_id={dealership_id}' 
        },
        { status: 400 }
      );
    }

    let query = supabase
      .from('client')
      .select('id, names, email, created_at, agent_active, dealership_id, phone_number');

    // Construir la consulta según los parámetros proporcionados
    if (phone && name) {
      // Búsqueda por teléfono Y nombre
      console.log('🔍 Buscando por teléfono Y nombre');
      const normalizedPhone = phone.replace(/[^0-9]/g, '');
      
      // Dividir el nombre en palabras para búsqueda AND
      const words = name.trim().split(/\s+/).filter(word => word.length > 0);
      
      query = query.eq('phone_number', normalizedPhone);
      
      // Aplicar filtros para cada palabra del nombre (AND)
      words.forEach(word => {
        query = query.filter('names', 'ilike', `%${word}%`);
      });
      
      if (dealershipId) {
        query = query.eq('dealership_id', dealershipId);
      }
    } else if (phone) {
      // Búsqueda solo por teléfono (comportamiento original)
      console.log('🔍 Buscando solo por teléfono');
      const normalizedPhone = phone.replace(/[^0-9]/g, '');
      console.log('📱 Teléfono normalizado:', normalizedPhone);
      
      query = query.eq('phone_number', normalizedPhone);
      
      if (dealershipId) {
        console.log('🏢 Filtrando por dealership_id:', dealershipId);
        query = query.eq('dealership_id', dealershipId);
      }
    } else if (name) {
      // Búsqueda solo por nombre
      console.log('🔍 Buscando solo por nombre');
      
      // Dividir el nombre en palabras para búsqueda AND
      const words = name.trim().split(/\s+/).filter(word => word.length > 0);
      
      if (words.length === 0) {
        console.log('❌ Error: Nombre vacío o solo espacios');
        return NextResponse.json(
          { message: 'Name parameter cannot be empty or contain only spaces' },
          { status: 400 }
        );
      }
      
      // Aplicar filtros para cada palabra del nombre (AND)
      words.forEach(word => {
        query = query.filter('names', 'ilike', `%${word}%`);
      });
      
      // dealership_id es obligatorio para búsqueda por nombre
      query = query.eq('dealership_id', dealershipId);
    }

    // Ordenar por fecha de creación
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error verificando cliente:', {
        error: error.message,
        phone,
        name,
        dealershipId
      });
      return NextResponse.json(
        { 
          message: 'Database error while verifying client. Please try again or create a new client if this search should return results.',
          error: error.message,
          phone,
          name,
          dealershipId
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ Cliente no encontrado:', {
        phone,
        name,
        dealershipId,
        message: dealershipId ? 'en la agencia especificada' : 'en ninguna agencia'
      });
      
      let message = 'No client found with the provided criteria.';
      if (phone && name) {
        message = `No client found with phone ${phone} and name "${name}"${dealershipId ? ' in the specified dealership' : ''}.`;
      } else if (phone) {
        message = dealershipId 
          ? `No client found with this phone number in the specified dealership.`
          : 'No client found with this phone number.';
      } else if (name) {
        message = `No client found with name "${name}" in the specified dealership.`;
      }
      
      return NextResponse.json(
        { 
          exists: false,
          message: `${message} You can create a new client using the /api/customers/create endpoint.`,
          phone,
          name,
          dealershipId
        },
        { status: 404 }
      );
    }

    if (data.length > 1) {
      console.log('⚠️ Múltiples clientes encontrados:', {
        count: data.length,
        phone,
        name,
        dealershipId,
        clients: data.map(c => ({ id: c.id, name: c.names, phone: c.phone_number, created_at: c.created_at, dealership_id: c.dealership_id }))
      });
      
      let message = 'Multiple clients found with the provided criteria.';
      if (phone && name) {
        message = dealershipId 
          ? 'Multiple clients found with this phone number and name in the specified dealership. This indicates a data integrity issue.'
          : 'Multiple clients found with this phone number and name across different dealerships.';
      } else if (phone) {
        message = dealershipId 
          ? 'Multiple duplicate clients found with this phone number in the specified dealership. This indicates a data integrity issue.'
          : 'Multiple clients found with this phone number across different dealerships.';
      } else if (name) {
        message = 'Multiple clients found with this name in the specified dealership.';
      }
      
      return NextResponse.json(
        { 
          exists: true,
          multipleClients: true,
          count: data.length,
          message: `${message} Consider using more specific search criteria.`,
          phone,
          name,
          dealershipId,
          clients: data.map(client => ({
            id: client.id,
            name: client.names,
            email: client.email,
            phone_number: client.phone_number,
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
      phone_number: client.phone_number,
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
        phone_number: client.phone_number,
        agent_active: client.agent_active,
        dealership_id: client.dealership_id
      },
      phone,
      name,
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
        message: 'Unexpected server error during client verification. Please verify the search criteria and try again. You can also create a new client at /api/customers/create if needed.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}