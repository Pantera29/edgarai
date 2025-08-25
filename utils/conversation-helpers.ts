import { supabase } from '@/lib/supabase';

export const getLastCustomerMessageTimestamp = (messages: any[]): Date | null => {
  if (!messages || messages.length === 0) return null;
  
  // Filtrar solo mensajes del cliente y ordenar por created_at descendente
  const customerMessages = messages
    .filter(msg => msg.role === 'customer')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
  return customerMessages.length > 0 ? new Date(customerMessages[0].created_at) : null;
};

export const isConversationUnread = (conversation: any): boolean => {
  // Si nunca se ha leído, es "no leída"
  if (!conversation.last_read_at) {
    return true;
  }
  
  // Obtener timestamp del último mensaje del cliente
  const lastCustomerMessageTime = getLastCustomerMessageTimestamp(conversation.messages);
  
  // Si no hay mensajes del cliente, no es "no leída"
  if (!lastCustomerMessageTime) {
    return false;
  }
  
  // Comparar último mensaje del cliente vs última lectura
  const lastReadTime = new Date(conversation.last_read_at);
  return lastCustomerMessageTime > lastReadTime;
};

export const markConversationAsRead = async (conversationId: string) => {
  const { error } = await supabase
    .from('chat_conversations')
    .update({ last_read_at: new Date().toISOString() })
    .eq('id', conversationId);
    
  if (error) {
    console.error('Error marcando conversación como leída:', error);
  }
  
  return { error };
};

// Función para truncar nombres de clientes de manera inteligente
export const truncateClientName = (name: string | undefined, maxLength: number = 30): string => {
  if (!name || name.length <= maxLength) {
    return name || 'Sin cliente';
  }
  
  // Si el nombre es muy largo, truncar y agregar "..."
  return name.substring(0, maxLength) + '...';
};

// Función para obtener el nombre completo para tooltip
export const getFullClientName = (name: string | undefined): string => {
  return name || 'Sin cliente';
};
