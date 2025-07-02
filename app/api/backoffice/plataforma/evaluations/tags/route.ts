import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../../jwt/token";

// UUID de la agencia autorizada para plataforma
const PLATFORM_AGENCY_ID = '6b58f82d-baa6-44ce-9941-1a61975d20b5';

export async function GET(request: Request) {
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

    console.log('🔄 Obteniendo tags de evaluaciones...');

    // Obtener todos los tags únicos de las evaluaciones
    const { data, error } = await supabase
      .from('conversation_evaluations')
      .select('evaluation_tags')
      .not('evaluation_tags', 'is', null);

    if (error) {
      console.error('❌ Error obteniendo tags:', error);
      return NextResponse.json(
        { message: 'Error al obtener tags', error: error.message },
        { status: 500 }
      );
    }

    // Extraer y unificar todos los tags únicos
    const allTags = new Set<string>();
    data?.forEach(evaluation => {
      if (evaluation.evaluation_tags && Array.isArray(evaluation.evaluation_tags)) {
        evaluation.evaluation_tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            allTags.add(tag.trim());
          }
        });
      }
    });

    const uniqueTags = Array.from(allTags).sort();

    console.log('✅ Tags obtenidos exitosamente:', {
      totalTags: uniqueTags.length,
      tags: uniqueTags
    });

    return NextResponse.json({
      tags: uniqueTags,
      count: uniqueTags.length
    });

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 