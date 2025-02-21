import { NextResponse } from 'next/server';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
const supabase = createClientComponentClient()

export async function GET(request: Request) {
  try {
    // Obtener los query params desde la URL
    const url = new URL(request.url);
    const names = url.searchParams.get('name');
    const email = url.searchParams.get('email');
    const phone_number = url.searchParams.get('phone');
    const dealership_id = url.searchParams.get('dealership_id');

    // Verificar que los parámetros requeridos están presentes
    if (!names || !email || !phone_number || !dealership_id ) {
      console.log('Missing required parameters - ROMPIMO TODO');
      return NextResponse.json(
        { message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Inserción de datos en la tabla 'clientes' (incluyendo campos de vehículo)
    const { data, error } = await supabase
      .from('client')
      .insert([
        {
          names,
          email,
          phone_number,
          dealership_id
        }
      ]);
      

    // Manejar errores de inserción
    if (error) {
      console.error('Error inserting data:', error.message);
      return NextResponse.json({ message: 'Failed to create customer', error
        }, { status: 500 });
    }
    return NextResponse.json({ status: 200 } );
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
