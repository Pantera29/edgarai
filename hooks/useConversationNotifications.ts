import { useEffect, useCallback } from 'react';
import { 
  shouldNotifyBasedOnTime,
  NOTIFICATION_WINDOW_MS,
  playNotificationSound,
  isSoundEnabled,
  isUrgentConversation
} from '@/utils/notification-helpers';
import { getLastCustomerMessageTimestamp } from '@/utils/conversation-helpers';

interface ConversationItem {
  id: string;
  user_identifier: string;
  client?: {
    names: string;
    phone_number: string;
    email: string;
  } | null;
  updated_at: string;
  status: string;
  channel?: string;
  messages?: any[];
  last_read_at?: string | null;
  client_agent_active?: boolean;
}

interface UseConversationNotificationsProps {
  conversations: ConversationItem[];
  enabled: boolean;
}

export function useConversationNotifications({
  conversations,
  enabled
}: UseConversationNotificationsProps) {

  const checkForNewMessages = useCallback(() => {
    if (!enabled || !isSoundEnabled()) {
      return;
    }

    const newNotifications: Array<ConversationItem> = [];

    console.log('🔍 [DEBUG] Revisando conversaciones para notificaciones:', {
      total: conversations.length,
      urgentes: conversations.filter(isUrgentConversation).length,
      ventanaDeNotificacion: `${NOTIFICATION_WINDOW_MS / 1000} segundos`
    });

    // Revisar cada conversación actual
    conversations.forEach(conversation => {
      // CRITERIO 1: Debe ser urgente (agente AI desactivado)
      if (!isUrgentConversation(conversation)) {
        return;
      }

      // CRITERIO 2: Obtener timestamp del último mensaje del cliente
      const lastCustomerMessageTime = getLastCustomerMessageTimestamp(conversation.messages || []);
      
      if (!lastCustomerMessageTime) {
        // No hay mensajes del cliente, no notificar
        console.log('⚠️ [DEBUG] Conversación urgente sin mensajes del cliente:', {
          id: conversation.id,
          client: conversation.client?.names,
          hasMessages: !!conversation.messages,
          messageCount: conversation.messages?.length || 0,
          firstMessage: conversation.messages?.[0]
        });
        return;
      }

      const messageAge = Math.round((Date.now() - lastCustomerMessageTime.getTime()) / 1000);

      // CRITERIO 3: El mensaje debe estar dentro de la ventana de tiempo (últimos 25 segundos)
      if (!shouldNotifyBasedOnTime(lastCustomerMessageTime)) {
        console.log('⏰ [DEBUG] Mensaje fuera de ventana:', {
          id: conversation.id,
          client: conversation.client?.names,
          messageAge: `${messageAge} segundos`,
          ventana: `${NOTIFICATION_WINDOW_MS / 1000} segundos`,
          lastMessageTime: lastCustomerMessageTime.toISOString()
        });
        return;
      }

      // ✅ Todas las condiciones se cumplen, agregar a notificaciones
      console.log('🔔 [DEBUG] Mensaje reciente de conversación urgente:', {
        id: conversation.id,
        client: conversation.client?.names,
        agentActive: conversation.client_agent_active,
        messageAge: `${messageAge} segundos`,
        messageTimestamp: lastCustomerMessageTime.toISOString()
      });

      newNotifications.push(conversation);
    });

    // Reproducir sonido para mensajes nuevos
    if (newNotifications.length > 0) {
      console.log(`🔔 [DEBUG] Reproduciendo sonido para ${newNotifications.length} mensaje(s) urgente(s)`);
      
      // Reproducir sonido una sola vez, aunque haya múltiples mensajes
      playNotificationSound();
      
      // Log de los mensajes
      newNotifications.forEach(conversation => {
        const clientName = conversation.client?.names || conversation.user_identifier;
        console.log(`🔔 Mensaje urgente de: ${clientName}`);
      });
    }
  }, [conversations, enabled]);

  // Effect para verificar cambios en las conversaciones
  useEffect(() => {
    if (!enabled) return;

    checkForNewMessages();
  }, [conversations, enabled, checkForNewMessages]);

  return {
    checkForNewMessages
  };
}
