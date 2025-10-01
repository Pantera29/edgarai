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

    console.log('📞 Marcando caso como contactado:', {
      npsId
    });

    // Verificar que el registro NPS existe
    console.log('🔍 Verificando existencia del registro NPS:', npsId);
    const { data: existingNps, error: checkError } = await supabase
      .from('nps')
      .select('id, contacted_at')
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

    if (existingNps.contacted_at !== null) {
      console.log('⚠️ Registro NPS ya fue contactado previamente:', npsId);
      return NextResponse.json(
        { error: 'El caso ya fue marcado como contactado previamente' },
        { status: 400 }
      );
    }

    // Actualizar registro NPS
    const contactedAt = new Date().toISOString();
    console.log('💾 Actualizando registro NPS con contacted_at...');
    const { data: npsRecord, error: npsError } = await supabase
      .from('nps')
      .update({
        contacted_at: contactedAt,
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

    console.log('✅ Registro NPS marcado como contactado exitosamente:', npsRecord);
    return NextResponse.json({
      success: true,
      contacted_at: contactedAt
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



