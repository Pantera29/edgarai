import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const serviceId = searchParams.get('service_id');
    const dealershipId = searchParams.get('dealership_id');

    if (!date || !serviceId) {
      return NextResponse.json(
        { message: 'Date and service_id parameters are required' },
        { status: 400 }
      );
    }

    // Construir la URL para la API externa
    let queryParamsExternal = `date=${date}&service_id=${serviceId}`;
    if (dealershipId) {
      queryParamsExternal += `&dealership_id=${dealershipId}`;
    }

    const externalApiUrl = `https://www.edgarai.com.mx/api/appointments/availability/?${queryParamsExternal}`;
    console.log('Llamando a API externa:', externalApiUrl);

    // Realizar la petición a la API externa
    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      redirect: 'follow',
    });

    // Si hay un error, retornar el mensaje de error
    if (!response.ok) {
      console.error('Error en API externa:', response.status, response.statusText);
      return NextResponse.json(
        { 
          message: `Error from external API: ${response.status}`,
          availableSlots: [],
          totalSlots: 0
        },
        { status: 200 } // Retornar 200 pero con datos vacíos para que el frontend pueda manejarlo
      );
    }

    // Obtener los datos y pasarlos al cliente
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error en proxy de disponibilidad:', error);
    return NextResponse.json(
      { 
        message: 'Error in proxy',
        availableSlots: [],
        totalSlots: 0
      },
      { status: 200 } // Retornar 200 pero con datos vacíos para que el frontend pueda manejarlo
    );
  }
} 