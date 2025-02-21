"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CreateCustomerPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Obtener los parámetros desde la URL
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const dealership_id = searchParams.get('dealership_id');

    // Verificar si todos los parámetros están presentes
    if (!name || !email || !phone || !dealership_id) {
      console.error('Missing required parameters');
      return;
    }

    // Hacer la solicitud al endpoint GET
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/customers/create?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&dealership_id=${encodeURIComponent(dealership_id)}`,
          {
            method: 'GET',
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('Customer created:', data);
        } else {
          console.error('Failed to create customer:', response.statusText);
        }
      } catch (error) {
        console.error('Error during fetch:', error);
      }
    };

    // Llamar a la función para hacer el GET
    fetchData();
  }, [searchParams]); // Dependencia searchParams para que se ejecute cuando cambien

  return (
    // Página en blanco
    <div></div>
  );
}
