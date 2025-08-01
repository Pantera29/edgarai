import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET - Listar bloqueos por modelo
export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const dealershipId = searchParams.get('dealership_id');

    if (!dealershipId) {
      return NextResponse.json(
        { message: 'dealership_id parameter is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Obteniendo bloqueos por modelo para dealership:', dealershipId);

    const { data: blockedDates, error } = await supabase
      .from('model_blocked_dates')
      .select('*')
      .eq('dealership_id', dealershipId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0]) // Solo fechas futuras
      .order('start_date', { ascending: true });

    if (error) {
      console.error('❌ Error al obtener bloqueos por modelo:', error);
      return NextResponse.json(
        { message: 'Error fetching model blocked dates' },
        { status: 500 }
      );
    }

    console.log('✅ Bloqueos por modelo obtenidos:', blockedDates?.length || 0);
    return NextResponse.json({ blockedDates: blockedDates || [] });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo bloqueo por modelo
export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const body = await request.json();
    
    const {
      dealership_id,
      make,
      model,
      start_date,
      end_date,
      reason
    } = body;

    // Validaciones
    if (!dealership_id || !make || !model || !start_date || !end_date || !reason) {
      return NextResponse.json(
        { message: 'All fields are required: dealership_id, make, model, start_date, end_date, reason' },
        { status: 400 }
      );
    }

    // Validar que end_date >= start_date
    if (new Date(end_date) < new Date(start_date)) {
      return NextResponse.json(
        { message: 'end_date must be greater than or equal to start_date' },
        { status: 400 }
      );
    }

    console.log('🔄 Creando bloqueo por modelo:', { dealership_id, make, model, start_date, end_date });

    const { data: newBlock, error } = await supabase
      .from('model_blocked_dates')
      .insert([{
        dealership_id,
        make: make.trim(),
        model: model.trim(),
        start_date,
        end_date,
        reason: reason.trim(),
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error al crear bloqueo por modelo:', error);
      return NextResponse.json(
        { message: 'Error creating model blocked date', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Bloqueo por modelo creado exitosamente:', newBlock.id);
    return NextResponse.json({ 
      message: 'Model blocked date created successfully',
      blockedDate: newBlock 
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 