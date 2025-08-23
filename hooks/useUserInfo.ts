import { useState, useEffect } from 'react';
import { verifyToken } from '@/app/jwt/token';

interface UserInfo {
  id: string;
  names: string;
  surnames: string;
  email: string;
  loading: boolean;
  error: string | null;
}

export function useUserInfo(): UserInfo {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: '',
    names: '',
    surnames: '',
    email: '',
    loading: true,
    error: null
  });

  useEffect(() => {
    const getUserInfo = () => {
      try {
        // Obtener el token de la URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (!token) {
          setUserInfo(prev => ({
            ...prev,
            loading: false,
            error: 'No se encontró token de autenticación'
          }));
          return;
        }

        // Verificar el token
        const tokenData = verifyToken(token);
        if (!tokenData) {
          setUserInfo(prev => ({
            ...prev,
            loading: false,
            error: 'Token inválido'
          }));
          return;
        }

        setUserInfo({
          id: tokenData.id || '',
          names: tokenData.names || '',
          surnames: tokenData.surnames || '',
          email: tokenData.email || '',
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error en useUserInfo:', error);
        setUserInfo(prev => ({
          ...prev,
          loading: false,
          error: 'Error inesperado al obtener información del usuario'
        }));
      }
    };

    getUserInfo();
  }, []);

  return userInfo;
}
