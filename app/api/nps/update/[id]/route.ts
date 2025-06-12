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
    const { score, comments } = await request.json();

    console.log('📝 Actualizando registro NPS:', {
      npsId,
      score,
      comments
    });

    // Validar score
    if (score === undefined || score < 0 || score > 10) {
      console.log('❌ Error: Score inválido');
      return NextResponse.json(
        { message: 'Score debe ser un número entre 0 y 10' },
        { status: 400 }
      );
    }

    // Determinar clasificación basada en el score
    let classification: 'promoter' | 'neutral' | 'detractor';
    if (score >= 9) {
      classification = 'promoter';
    } else if (score >= 7) {
      classification = 'neutral';
    } else {
      classification = 'detractor';
    }

    // Verificar que el registro NPS existe
    console.log('🔍 Verificando existencia del registro NPS:', npsId);
    const { data: existingNps, error: checkError } = await supabase
      .from('nps')
      .select('id, status')
      .eq('id', npsId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error al verificar registro NPS:', checkError);
      return NextResponse.json(
        { message: 'Error al verificar registro NPS' },
        { status: 500 }
      );
    }

    if (!existingNps) {
      console.log('❌ Registro NPS no encontrado:', npsId);
      return NextResponse.json(
        { message: 'Registro NPS no encontrado' },
        { status: 404 }
      );
    }

    if (existingNps.status === 'completed') {
      console.log('❌ Registro NPS ya completado:', npsId);
      return NextResponse.json(
        { message: 'El registro NPS ya ha sido completado' },
        { status: 400 }
      );
    }

    // Actualizar registro NPS
    console.log('💾 Actualizando registro NPS...');
    const { data: npsRecord, error: npsError } = await supabase
      .from('nps')
      .update({
        score,
        classification,
        comments,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', npsId)
      .select()
      .single();

    if (npsError) {
      console.error('❌ Error al actualizar registro NPS:', npsError);
      return NextResponse.json(
        { message: 'Error al actualizar registro NPS' },
        { status: 500 }
      );
    }

    console.log('✅ Registro NPS actualizado exitosamente:', npsRecord);
    return NextResponse.json(npsRecord);
  } catch (error) {
    console.error('💥 Error inesperado:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 