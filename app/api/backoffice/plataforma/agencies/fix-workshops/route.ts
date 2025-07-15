import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../../jwt/token";

// UUID de la agencia autorizada para plataforma
const PLATFORM_AGENCY_ID = '6b58f82d-baa6-44ce-9941-1a61975d20b5';

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Verificar token de super admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Token no proporcionado');
      return NextResponse.json(
        { message: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const tokenData = verifyToken(token);
    
    if (!tokenData || tokenData.dealership_id !== PLATFORM_AGENCY_ID) {
      console.log('❌ Acceso no autorizado a plataforma');
      return NextResponse.json(
        { message: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    console.log('🔄 Iniciando corrección de workshops faltantes...');

    // Obtener todas las agencias activas
    const { data: dealerships, error: dealershipsError } = await supabase
      .from('dealerships')
      .select('id, name, address')
      .eq('is_active', true);

    if (dealershipsError) {
      console.error('❌ Error obteniendo agencias:', dealershipsError);
      return NextResponse.json(
        { message: 'Error al obtener agencias', error: dealershipsError.message },
        { status: 500 }
      );
    }

    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    // Procesar cada agencia
    for (const dealership of dealerships || []) {
      try {
        // Verificar si ya existe un workshop principal
        const { data: existingWorkshops, error: checkError } = await supabase
          .from('workshops')
          .select('id')
          .eq('dealership_id', dealership.id)
          .eq('is_main', true);

        if (checkError) {
          console.error(`❌ Error verificando workshops para ${dealership.name}:`, checkError);
          results.errors++;
          results.details.push({
            dealership: dealership.name,
            action: 'error',
            message: checkError.message
          });
          continue;
        }

        results.processed++;

        if (existingWorkshops && existingWorkshops.length > 0) {
          // Ya tiene workshop principal
          results.skipped++;
          results.details.push({
            dealership: dealership.name,
            action: 'skipped',
            message: 'Ya tiene workshop principal'
          });
          console.log(`⏭️ Agencia ${dealership.name} ya tiene workshop principal`);
        } else {
          // Crear workshop principal
          const { data: newWorkshop, error: createError } = await supabase
            .from('workshops')
            .insert({
              name: 'Taller Principal',
              dealership_id: dealership.id,
              is_main: true,
              is_active: true,
              address: dealership.address
            })
            .select()
            .single();

          if (createError) {
            console.error(`❌ Error creando workshop para ${dealership.name}:`, createError);
            results.errors++;
            results.details.push({
              dealership: dealership.name,
              action: 'error',
              message: createError.message
            });
          } else {
            results.created++;
            results.details.push({
              dealership: dealership.name,
              action: 'created',
              workshop_id: newWorkshop.id
            });
            console.log(`✅ Creado workshop principal para ${dealership.name}:`, newWorkshop.id);
          }
        }
      } catch (error) {
        console.error(`❌ Error procesando ${dealership.name}:`, error);
        results.errors++;
        results.details.push({
          dealership: dealership.name,
          action: 'error',
          message: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    console.log('✅ Corrección de workshops completada:', results);

    return NextResponse.json({
      message: 'Corrección de workshops completada',
      summary: {
        total_processed: results.processed,
        workshops_created: results.created,
        workshops_skipped: results.skipped,
        errors: results.errors
      },
      details: results.details
    }, { status: 200 });

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 