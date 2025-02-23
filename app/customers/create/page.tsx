// app/customers/create/page.tsx

"use client"; // Este archivo es un componente del cliente

import { useEffect, useState } from 'react';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from 'next/server';

const supabase = createClientComponentClient()

export default function Page() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const names = searchParams.get('name');
    const email = searchParams.get('email');
    const phone_number = searchParams.get('phone');
    const dealership_id = searchParams.get('dealership_id');

    if (!names || !email || !phone_number || !dealership_id) {
      setError('Missing required parameters');
      return;
    }

    const fetchData = async () => {
      try {
        const {  data: clientData, error: clientError } = await supabase
              .from("client")
              .select("*")
              .match({ email: email, phone_number: phone_number });
        
              if(clientError || clientData.length > 0){
                return NextResponse.json({ message: 'Client already exists' }, { status: 200 });
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
        console.error('Error during fetch:', error);
        setError('Error during fetch');
      }
    };

    fetchData();
  }, [queryParams]);

  return (
    <div>
      {status && <p>{status}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
