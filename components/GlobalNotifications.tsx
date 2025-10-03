"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '../app/jwt/token';
import { useConversationNotifications } from '@/hooks/useConversationNotifications';
import { initializeAudioContext } from '@/utils/notification-helpers';

interface UrgentMessage {
  conversation_id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  last_customer_message_content: string;
  last_customer_message_time: string;
  message_age_seconds: number;
}

interface ConversacionItem {
  id: string;
  user_identifier: string;
  updated_at: string;
  status: string;
  client?: {
    names: string;
    phone_number: string;
    email: string;
  } | null;
  messages?: Array<{
    role: string;
    content: string;
    created_at: string;
  }>;
  client_agent_active?: boolean;
}

export function GlobalNotifications() {
  const [conversaciones, setConversaciones] = useState<ConversacionItem[]>([]);
  const [dataToken, setDataToken] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Obtener token desde URL o localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Intentar obtener token de la URL
    const params = new URLSearchParams(window.location.search);
    let tokenValue = params.get('token');
    
    // Si no hay token en URL, intentar desde localStorage o sessionStorage
    if (!tokenValue) {
      tokenValue = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    
    if (tokenValue) {
      const verifiedDataToken = verifyToken(tokenValue);
      
      if (
        verifiedDataToken &&
        typeof verifiedDataToken === 'object' &&
        Object.keys(verifiedDataToken).length > 0 &&
        (verifiedDataToken as any).dealership_id
      ) {
        setDataToken(verifiedDataToken);
        setIsInitialized(true);
        console.log('✅ [GlobalNotifications] Token verificado:', {
          dealership_id: (verifiedDataToken as any).dealership_id
        });
      }
    }
  }, []);

  // Cargar conversaciones urgentes con mensajes recientes (OPTIMIZADO)
  const cargarConversaciones = useCallback(async () => {
    if (!dataToken?.dealership_id) return;

    try {
      const { data, error } = await supabase.rpc('get_urgent_recent_messages', {
        dealership_id_param: dataToken.dealership_id,
        time_window_seconds: 30 // 30 segundos (margen sobre los 25 del cliente)
      });
      
      if (error) {
        console.error('[GlobalNotifications] Error cargando mensajes urgentes:', error);
        return;
      }

      if (data) {
        console.log('[GlobalNotifications] 🔔 Mensajes urgentes recientes:', {
          total: data.length,
          mensajes: data.map((m: UrgentMessage) => ({
            cliente: m.client_name,
            edad: `${m.message_age_seconds} seg`,
            contenido: m.last_customer_message_content?.substring(0, 50)
          }))
        });
        
        // Convertir a formato ConversacionItem para compatibilidad con el hook
        const conversacionesAdaptadas: ConversacionItem[] = data.map((msg: UrgentMessage) => ({
          id: msg.conversation_id,
          user_identifier: msg.client_phone,
          updated_at: msg.last_customer_message_time,
          status: 'active',
          client: {
            names: msg.client_name,
            phone_number: msg.client_phone,
            email: ''
          },
          messages: [{
            role: 'customer',
            content: msg.last_customer_message_content,
            created_at: msg.last_customer_message_time
          }],
          client_agent_active: false // Ya vienen filtradas por agente OFF
        }));
        
        setConversaciones(conversacionesAdaptadas);
      }
    } catch (error) {
      console.error('[GlobalNotifications] Error en cargarConversaciones:', error);
    }
  }, [dataToken]);

  // Polling cada 20 segundos
  useEffect(() => {
    if (!isInitialized || !dataToken) return;

    // Carga inicial
    cargarConversaciones();

    // Polling
    const interval = setInterval(() => {
      cargarConversaciones();
    }, 20000); // 20 segundos

    return () => clearInterval(interval);
  }, [isInitialized, dataToken, cargarConversaciones]);

  // Hook de notificaciones
  useConversationNotifications({
    conversations: conversaciones,
    enabled: isInitialized
  });

  // Inicializar AudioContext con primera interacción
  useEffect(() => {
    const handleFirstInteraction = () => {
      initializeAudioContext();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Este componente no renderiza nada visible
  return null;
}

