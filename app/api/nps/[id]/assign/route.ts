import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const npsId = params.id;
    const { assigned_to } = await request.json();

    console.log('👤 Asignando caso a usuario:', {
      npsId,
      assigned_to
    });

    // Verificar que el registro NPS existe y obtener dealership_id
    console.log('🔍 Verificando existencia del registro NPS:', npsId);
    const { data: existingNps, error: checkError } = await supabase
      .from('nps')
      .select('id, customer_id')
      .eq('id', npsId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error al verificar registro NPS:', checkError);
      return NextResponse.json(
        { error: 'Error al verificar registro NPS' },
        { status: 500 }
      );
    }

    if (!existingNps) {
      console.log('❌ Registro NPS no encontrado:', npsId);
      return NextResponse.json(
        { error: 'Registro NPS no encontrado' },
        { status: 404 }
      );
    }

    // Obtener dealership_id del cliente
    const { data: clientData, error: clientError } = await supabase
      .from('client')
      .select('dealership_id')
      .eq('id', existingNps.customer_id)
      .single();

    if (clientError || !clientData) {
      console.error('❌ Error al obtener información del cliente:', clientError);
      return NextResponse.json(
        { error: 'Error al obtener información del cliente' },
        { status: 500 }
      );
    }

    const npsDealershipId = clientData.dealership_id;

    // Si se asigna a un usuario (no null), verificar que pertenezca al mismo dealership
    if (assigned_to !== null) {
      console.log('🔍 Verificando que el usuario pertenezca al mismo dealership...');
      const { data: worker, error: workerError } = await supabase
        .from('worker_agency')
        .select('id, dealership_id')
        .eq('id', assigned_to)
        .maybeSingle();

      if (workerError) {
        console.error('❌ Error al verificar usuario:', workerError);
        return NextResponse.json(
          { error: 'Error al verificar usuario' },
          { status: 500 }
        );
      }

      if (!worker) {
        console.log('❌ Usuario no encontrado:', assigned_to);
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // Verificar que el usuario pertenezca al mismo dealership
      if (worker.dealership_id !== npsDealershipId) {
        console.log('❌ El usuario no pertenece al mismo dealership');
        return NextResponse.json(
          { error: 'El usuario no pertenece al mismo dealership' },
          { status: 403 }
        );
      }
    }

    // Actualizar registro NPS
    console.log('💾 Actualizando registro NPS con assigned_to...');
    const { data: npsRecord, error: npsError } = await supabase
      .from('nps')
      .update({
        assigned_to,
        updated_at: new Date().toISOString()
      })
      .eq('id', npsId)
      .select()
      .single();

    if (npsError) {
      console.error('❌ Error al actualizar registro NPS:', npsError);
      return NextResponse.json(
        { error: 'Error al actualizar registro NPS' },
        { status: 500 }
      );
    }

    console.log('✅ Registro NPS asignado exitosamente:', npsRecord);
    return NextResponse.json({
      success: true,
      assigned_to
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
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


