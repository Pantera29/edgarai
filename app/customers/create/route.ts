import { NextResponse } from 'next/server';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
const supabase = createClientComponentClient()

export async function GET(request: Request) {
  try {
    // Obtener los query params desde la URL
    const url = new URL(request.url);
    const nombre = url.searchParams.get('name');
    const email = url.searchParams.get('email');
    const telefono = url.searchParams.get('phone');
    const vehiculo_marca = url.searchParams.get('brand');
    const vehiculo_modelo = url.searchParams.get('model');
    const vehiculo_año = url.searchParams.get('yead');
    const vehiculo_kilometraje = url.searchParams.get('km');

    // Verificar que los parámetros requeridos están presentes
    if (!nombre || !email || !telefono ) {
      return NextResponse.json(
        { message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Inserción de datos en la tabla 'clientes' (incluyendo campos de vehículo)
    const { data, error } = await supabase
      .from('clientes')
      .insert([
        {
          nombre,
          email,
          telefono,
          vehiculo_marca,
          vehiculo_modelo,
          vehiculo_año,
          vehiculo_kilometraje
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
