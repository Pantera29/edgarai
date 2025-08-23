import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { verifyToken } from '@/app/jwt/token';

interface AgencyInfo {
  id: string;
  name: string;
  loading: boolean;
  error: string | null;
}

interface UserInfo {
  id: string;
  names: string;
  surnames: string;
  email: string;
}

export function useAgencyInfo(): AgencyInfo {
  const [agencyInfo, setAgencyInfo] = useState<AgencyInfo>({
    id: '',
    name: '',
    loading: true,
    error: null
  });
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getAgencyInfo = async () => {
      try {
        // Obtener el token de la URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (!token) {
          setAgencyInfo(prev => ({
            ...prev,
            loading: false,
            error: 'No se encontró token de autenticación'
          }));
          return;
        }

        // Verificar el token
        const tokenData = verifyToken(token);
        if (!tokenData || !tokenData.dealership_id) {
          setAgencyInfo(prev => ({
            ...prev,
            loading: false,
            error: 'Token inválido o sin información de agencia'
          }));
          return;
        }

        // Obtener información de la agencia
        const { data: dealership, error } = await supabase
          .from('dealerships')
          .select('id, name')
          .eq('id', tokenData.dealership_id)
          .single();

        if (error) {
          console.error('Error obteniendo información de agencia:', error);
          setAgencyInfo(prev => ({
            ...prev,
            loading: false,
            error: 'Error al obtener información de la agencia'
          }));
          return;
        }

        setAgencyInfo({
          id: dealership.id,
          name: dealership.name,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error en useAgencyInfo:', error);
        setAgencyInfo(prev => ({
          ...prev,
          loading: false,
          error: 'Error inesperado al obtener información de la agencia'
        }));
      }
    };

    getAgencyInfo();
  }, []);

  return agencyInfo;
}
