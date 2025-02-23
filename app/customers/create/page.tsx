// app/customers/create/page.tsx

"use client"; // Este archivo es un componente del cliente

import { useEffect, useState } from 'react';

export default function Page() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const dealership_id = searchParams.get('dealership_id');

    if (!name || !email || !phone || !dealership_id) {
      setError('Missing required parameters');
      return;
    }

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
          setStatus('Customer created successfully');
        } else {
          console.error('Failed to create customer:', response.statusText);
          setError('Failed to create customer');
        }
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
