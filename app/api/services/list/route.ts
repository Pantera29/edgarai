import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const dealership_id = searchParams.get('dealership_id');

    // Verificar si se proporcionó el dealership_id
    if (!dealership_id) {
      return NextResponse.json(
        { message: 'El parámetro dealership_id es obligatorio' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('services')
      .select('*')
      .eq('dealership_id', dealership_id)
      .order('service_name');

    // Si se proporciona una categoría, filtrar por ella
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching services:', error.message);
      return NextResponse.json(
        { message: 'Error fetching services' },
        { status: 500 }
      );
    }

    return NextResponse.json({ services: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}