// Ventana de tiempo para considerar mensajes como "nuevos" (en milisegundos)
// Usamos 25 segundos para dar margen al polling de 20 segundos
export const NOTIFICATION_WINDOW_MS = 25000; // 25 segundos

// LocalStorage key para configuración de sonido
const SOUND_CONFIG_KEY = 'edgarai_sound_enabled';

/**
 * Obtiene si el sonido está habilitado
 */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  
  const saved = localStorage.getItem(SOUND_CONFIG_KEY);
  if (saved !== null) {
    return saved === 'true';
  }
  return true; // Habilitado por defecto
}

/**
 * Guarda la configuración de sonido
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_CONFIG_KEY, enabled.toString());
}

/**
 * Verifica si un mensaje es reciente (dentro de la ventana de notificación)
 * @param messageTimestamp - Timestamp del mensaje a verificar
 * @returns true si el mensaje ocurrió en los últimos NOTIFICATION_WINDOW_MS milisegundos
 */
export function isMessageRecent(messageTimestamp: Date | string): boolean {
  const messageTime = typeof messageTimestamp === 'string' 
    ? new Date(messageTimestamp).getTime() 
    : messageTimestamp.getTime();
  
  const now = Date.now();
  const timeDifference = now - messageTime;
  
  return timeDifference >= 0 && timeDifference <= NOTIFICATION_WINDOW_MS;
}

/**
 * Verifica si una conversación debe notificarse basado en ventana de tiempo
 * @param lastCustomerMessageTime - Timestamp del último mensaje del cliente
 * @returns true si el mensaje es reciente y debe notificarse
 */
export function shouldNotifyBasedOnTime(lastCustomerMessageTime: Date | null): boolean {
  if (!lastCustomerMessageTime) {
    return false; // No hay mensajes del cliente
  }
  
  return isMessageRecent(lastCustomerMessageTime);
}

// AudioContext global que se inicializa con interacción del usuario
let audioContext: AudioContext | null = null;
let audioContextInitialized = false;

/**
 * Inicializa el AudioContext (debe llamarse después de interacción del usuario)
 */
export function initializeAudioContext(): void {
  if (audioContextInitialized) return;
  
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextInitialized = true;
    console.log('✅ AudioContext inicializado - Sonido disponible');
  } catch (error) {
    console.warn('Error inicializando AudioContext:', error);
  }
}

/**
 * Reproduce un sonido de notificación usando Web Audio API
 * Sonido tipo "ding" de 2 tonos (similar a Cursor)
 */
export function playNotificationSound(): void {
  // Verificar si el sonido está habilitado
  if (!isSoundEnabled()) {
    console.log('🔇 Sonido deshabilitado por el usuario');
    return;
  }
  
  // Si no está inicializado, intentar inicializar
  if (!audioContextInitialized) {
    console.warn('🔇 AudioContext no inicializado - se necesita interacción del usuario');
    return;
  }
  
  if (!audioContext) {
    console.warn('🔇 AudioContext no disponible');
    return;
  }
  
  try {
    // Verificar que el contexto esté activo
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    const currentTime = audioContext.currentTime;
    
    // Primer tono (Mi - 659Hz) - "ding"
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(659, currentTime); // Mi (E5)
    oscillator1.type = 'sine';
    
    gainNode1.gain.setValueAtTime(0.3, currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.15);
    
    oscillator1.start(currentTime);
    oscillator1.stop(currentTime + 0.15);
    
    // Segundo tono (Do - 523Hz) - "dong"
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    
    oscillator2.frequency.setValueAtTime(523, currentTime + 0.08); // Do (C5)
    oscillator2.type = 'sine';
    
    gainNode2.gain.setValueAtTime(0, currentTime + 0.08);
    gainNode2.gain.linearRampToValueAtTime(0.25, currentTime + 0.1);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.35);
    
    oscillator2.start(currentTime + 0.08);
    oscillator2.stop(currentTime + 0.35);
    
    console.log('🔔 Sonido de notificación reproducido (ding-dong)');
  } catch (error) {
    console.warn('Error al reproducir sonido de notificación:', error);
  }
}

/**
 * Determina si una conversación requiere notificación urgente
 * CRITERIO: Agente AI desactivado (client_agent_active === false)
 */
export function isUrgentConversation(conversation: any): boolean {
  // La conversación es urgente si el cliente tiene el agente AI desactivado
  return conversation.client_agent_active === false;
}
