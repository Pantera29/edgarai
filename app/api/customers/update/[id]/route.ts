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
    
    console.log('🔍 Iniciando actualización de cliente:', {
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
            url_format: '/api/customers/update/{client_uuid}',
            example: '/api/customers/update/123e4567-e89b-12d3-a456-426614174000'
          }
        },
        { status: 400 }
      );
    }

    // Validar formato del UUID antes de consultar la base de datos
    const isUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId || '');

    if (!isUuidFormat) {
      console.log('❌ Formato de UUID inválido - posible error de MCP:', {
        provided_id: clientId,
        id_length: clientId?.length,
        looks_like_phone: clientId?.length === 10 && /^\d+$/.test(clientId || ''),
        looks_like_email: clientId?.includes('@'),
        user_agent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
        error_type: 'INVALID_UUID_FORMAT'
      });
      
      return NextResponse.json(
        { 
          message: 'ERROR: You provided a phone number instead of a client ID. The client ID must be a UUID, not a phone number.',
          error_code: 'INVALID_UUID_FORMAT',
          details: {
            provided_id: clientId,
            id_length: clientId?.length,
            detected_type: clientId?.length === 10 && /^\d+$/.test(clientId || '') ? 'phone_number' : 
                          clientId?.includes('@') ? 'email' : 'unknown',
            correct_format: 'UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
          },
          instructions: {
            step_1: 'First, search for the client using the phone number to get the correct client ID',
            step_2: 'Use the returned client ID (UUID) in the update request',
            search_endpoint: 'GET /api/customers/verify?phone={phone_number}&dealership_id={dealership_id}',
            update_endpoint: 'PATCH /api/customers/update/{client_uuid}',
            note: 'The dealership_id parameter is optional but recommended to ensure you get the correct client from the right dealership.'
          },
          examples: {
            wrong: '/api/customers/update/5575131257',
            correct: '/api/customers/update/123e4567-e89b-12d3-a456-426614174000',
            search_example: '/api/customers/verify?phone=5575131257&dealership_id=6fa78291-c16a-4c78-9fe2-9e3695d24d48'
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
      console.error('❌ Error de base de datos al verificar cliente:', {
        client_id: clientId,
        error: checkError.message,
        details: checkError.details,
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
      console.log('❌ Cliente no encontrado - posible error de MCP:', {
        provided_id: clientId,
        id_length: clientId?.length,
        is_uuid_format: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId || ''),
        looks_like_phone: clientId?.length === 10 && /^\d+$/.test(clientId || ''),
        looks_like_email: clientId?.includes('@'),
        user_agent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
        error_type: 'MCP_PHONE_NUMBER_INSTEAD_OF_UUID'
      });
      
      return NextResponse.json(
        { 
          message: 'ERROR: You provided a phone number instead of a client ID. The client ID must be a UUID, not a phone number.',
          error_code: 'CLIENT_NOT_FOUND',
          details: {
            provided_id: clientId,
            id_length: clientId?.length,
            is_uuid_format: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId || ''),
            detected_type: clientId?.length === 10 && /^\d+$/.test(clientId || '') ? 'phone_number' : 
                          clientId?.includes('@') ? 'email' : 'unknown',
            correct_format: 'UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
          },
          instructions: {
            step_1: 'First, search for the client using the phone number to get the correct client ID',
            step_2: 'Use the returned client ID (UUID) in the update request',
            search_endpoint: 'GET /api/customers/verify?phone={phone_number}&dealership_id={dealership_id}',
            update_endpoint: 'PATCH /api/customers/update/{client_uuid}',
            note: 'The dealership_id parameter is optional but recommended to ensure you get the correct client from the right dealership.'
          },
          examples: {
            wrong: '/api/customers/update/5575131257',
            correct: '/api/customers/update/123e4567-e89b-12d3-a456-426614174000',
            search_example: '/api/customers/verify?phone=5575131257&dealership_id=6fa78291-c16a-4c78-9fe2-9e3695d24d48'
          }
        },
        { status: 404 }
      );
    }

    // Obtener y validar el cuerpo de la petición
    const body = await request.json();
    const { names, email, phone_number, phone_number_2, external_id, agent_active } = body;

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

    // Validar phone_number_2 si se proporciona
    let normalizedPhone2 = undefined;
    if (phone_number_2 !== undefined) {
      // Si phone_number_2 es null, string vacío, o undefined → setear a null
      if (phone_number_2 === null || phone_number_2 === "" || phone_number_2.trim() === "") {
        normalizedPhone2 = null;
      } else {
        // Si tiene valor, normalizar y validar
        normalizedPhone2 = phone_number_2.replace(/[^0-9]/g, '');
        if (normalizedPhone2.length !== 10) {
          return NextResponse.json(
            { message: 'El teléfono 2 debe tener exactamente 10 dígitos numéricos.' },
            { status: 400 }
          );
        }
        
        // Validar que sean diferentes si ambos están presentes
        if (normalizedPhone && normalizedPhone2 === normalizedPhone) {
          return NextResponse.json(
            { message: 'phone_number_2 debe ser diferente de phone_number' },
            { status: 400 }
          );
        }
      }
    }

    // Validar duplicados en la misma agencia (excluyendo el propio cliente)
    if ((email && email.trim() !== "") || normalizedPhone || normalizedPhone2) {
      let orConditions = [];
      if (normalizedPhone) {
        orConditions.push(`phone_number.eq.${normalizedPhone}`);
        orConditions.push(`phone_number_2.eq.${normalizedPhone}`);
      }
      if (normalizedPhone2) {
        orConditions.push(`phone_number.eq.${normalizedPhone2}`);
        orConditions.push(`phone_number_2.eq.${normalizedPhone2}`);
      }
      if (email && email.trim() !== "") orConditions.push(`email.eq.${email}`);

      console.log('🔍 Verificando duplicados:', {
        client_id: clientId,
        dealership_id: clientExists.dealership_id,
        phone_number: normalizedPhone,
        phone_number_2: normalizedPhone2,
        email: email,
        or_conditions: orConditions,
        timestamp: new Date().toISOString()
      });

      const { data: existingClients, error: searchError } = await supabase
        .from("client")
        .select("id, phone_number, phone_number_2, email")
        .eq("dealership_id", clientExists.dealership_id)
        .or(orConditions.join(","))
        .neq("id", clientId);

      if (searchError) {
        console.error('❌ Error al verificar duplicados:', {
          client_id: clientId,
          error: searchError.message,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json(
          { message: 'Error consultando la base de datos para duplicados.' },
          { status: 500 }
        );
      }

      console.log('🔍 Resultado de verificación de duplicados:', {
        client_id: clientId,
        existing_clients_count: existingClients?.length || 0,
        existing_clients: existingClients,
        timestamp: new Date().toISOString()
      });

      if (existingClients && existingClients.length > 0) {
        // Determinar qué campo está duplicado para dar un mensaje más específico
        const duplicateFields = [];
        if (normalizedPhone) {
          const phoneDuplicate = existingClients.some(client => 
            client.phone_number === normalizedPhone || client.phone_number_2 === normalizedPhone
          );
          if (phoneDuplicate) duplicateFields.push('teléfono');
        }
        if (normalizedPhone2) {
          const phone2Duplicate = existingClients.some(client => 
            client.phone_number === normalizedPhone2 || client.phone_number_2 === normalizedPhone2
          );
          if (phone2Duplicate) duplicateFields.push('teléfono 2');
        }
        if (email && email.trim() !== "") {
          const emailDuplicate = existingClients.some(client => client.email === email);
          if (emailDuplicate) duplicateFields.push('email');
        }
        
        const fieldNames = duplicateFields.join(' y ');
        
        console.log('❌ Cliente duplicado detectado:', {
          client_id: clientId,
          duplicate_fields: duplicateFields,
          existing_clients: existingClients,
          error_message: `Ya existe otro cliente con el mismo ${fieldNames} en esta agencia.`,
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json(
          { 
            message: `Ya existe otro cliente con el mismo ${fieldNames} en esta agencia.`,
            error_code: 'DUPLICATE_CLIENT',
            details: {
              duplicate_fields: duplicateFields,
              existing_clients_count: existingClients.length
            }
          },
          { status: 409 }
        );
      }
    }

    // Preparar objeto de actualización solo con los campos enviados
    const updateData: any = {};
    if (names !== undefined) updateData.names = names;
    if (email !== undefined) updateData.email = email;
    if (normalizedPhone !== undefined) updateData.phone_number = normalizedPhone;
    if (normalizedPhone2 !== undefined) updateData.phone_number_2 = normalizedPhone2;
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

    // Migrar automáticamente agent_active a phone_agent_settings si se actualizó
    if (agent_active !== undefined) {
      console.log('🔄 Migrando agent_active a phone_agent_settings:', {
        client_id: clientId,
        agent_active: agent_active,
        timestamp: new Date().toISOString()
      });

      try {
        // Obtener datos del cliente para la migración
        const { data: clientData } = await supabase
          .from('client')
          .select('phone_number, phone_number_2, dealership_id')
          .eq('id', clientId)
          .single();

        if (clientData && clientData.dealership_id) {
          // Migrar a phone_agent_settings para ambos teléfonos
          const migrationPromises = [];
          
          if (clientData.phone_number) {
            migrationPromises.push(
              supabase
                .from('phone_agent_settings')
                .upsert({
                  phone_number: clientData.phone_number,
                  dealership_id: clientData.dealership_id,
                  agent_active: agent_active,
                  notes: `Migrado desde client.agent_active - ${agent_active ? 'activado' : 'desactivado'} manualmente`,
                  updated_by: 'migration',
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'phone_number,dealership_id'
                })
            );
          }
          
          if (clientData.phone_number_2) {
            migrationPromises.push(
              supabase
                .from('phone_agent_settings')
                .upsert({
                  phone_number: clientData.phone_number_2,
                  dealership_id: clientData.dealership_id,
                  agent_active: agent_active,
                  notes: `Migrado desde client.agent_active - ${agent_active ? 'activado' : 'desactivado'} manualmente (phone_number_2)`,
                  updated_by: 'migration',
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'phone_number,dealership_id'
                })
            );
          }
          
          const results = await Promise.all(migrationPromises);
          const hasErrors = results.some(r => r.error);
          
          if (hasErrors) {
            console.error('⚠️ Error en migración a phone_agent_settings:', {
              client_id: clientId,
              errors: results.filter(r => r.error).map(r => r.error!.message),
              timestamp: new Date().toISOString()
            });
          } else {
            console.log('✅ Migración a phone_agent_settings exitosa para ambos teléfonos:', {
              client_id: clientId,
              phone_number: clientData.phone_number,
              phone_number_2: clientData.phone_number_2,
              dealership_id: clientData.dealership_id,
              agent_active: agent_active,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          console.warn('⚠️ No se pudo migrar agent_active - datos de cliente incompletos:', {
            client_id: clientId,
            has_dealership: !!clientData?.dealership_id,
            timestamp: new Date().toISOString()
          });
        }
      } catch (migrationError) {
        console.error('⚠️ Error inesperado en migración a phone_agent_settings:', {
          client_id: clientId,
          error: migrationError instanceof Error ? migrationError.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        // No fallar la operación principal, solo log del error
      }
    }

    console.log('✅ Cliente actualizado exitosamente:', {
      client_id: clientId,
      updated_fields: Object.keys(updateData),
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      message: 'Cliente actualizado exitosamente.',
      client: data
    });

  } catch (error) {
    console.error('💥 Error inesperado al actualizar el cliente:', {
      client_id: params?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { message: 'Error inesperado al actualizar el cliente.' },
      { status: 500 }
    );
  }
} 