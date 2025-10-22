export interface WhatsAppWindowStatus {
  isWithinWindow: boolean;
  lastCustomerMessageTime: Date | null;
  hoursSinceLastMessage: number | null;
  canSendFreeMessage: boolean;
  requiresTemplate: boolean;
}

// Agencia específica que debe usar la ventana de 24h (Nissan - Autopolis)
const DEALERSHIP_WITH_24H_WINDOW = '803b2961-b9d5-47f3-be4a-c8c114c85b5e';

export function calculateWhatsAppWindowStatus(
  messages: any[],
  dealershipId: string
): WhatsAppWindowStatus {
  // Si no es la agencia específica, siempre permitir mensajes libres
  if (dealershipId !== DEALERSHIP_WITH_24H_WINDOW) {
    return {
      isWithinWindow: true,
      lastCustomerMessageTime: null,
      hoursSinceLastMessage: null,
      canSendFreeMessage: true,
      requiresTemplate: false
    };
  }

  // Buscar el último mensaje del cliente
  const customerMessages = messages.filter(msg => 
    msg.sender === 'customer' || 
    msg.from === 'customer' || 
    !msg.agente ||
    msg.role === 'user' ||
    msg.type === 'incoming'
  );
  
  if (customerMessages.length === 0) {
    return {
      isWithinWindow: false,
      lastCustomerMessageTime: null,
      hoursSinceLastMessage: null,
      canSendFreeMessage: false,
      requiresTemplate: true
    };
  }

  // Obtener el último mensaje del cliente
  const lastCustomerMessage = customerMessages.reduce((latest, current) => {
    const currentTime = new Date(current.created_at || current.timestamp || current.time);
    const latestTime = new Date(latest.created_at || latest.timestamp || latest.time);
    return currentTime > latestTime ? current : latest;
  });

  const lastMessageTime = new Date(
    lastCustomerMessage.created_at || 
    lastCustomerMessage.timestamp || 
    lastCustomerMessage.time
  );
  
  const now = new Date();
  const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
  
  const isWithinWindow = hoursSinceLastMessage <= 24;
  
  return {
    isWithinWindow,
    lastCustomerMessageTime: lastMessageTime,
    hoursSinceLastMessage,
    canSendFreeMessage: isWithinWindow,
    requiresTemplate: !isWithinWindow
  };
}
