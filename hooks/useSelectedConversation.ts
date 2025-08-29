import { useState } from 'react';

interface ConversacionAccionHumana {
  id: string;
  user_identifier: string;
  client_id: string | null;
  dealership_id: string;
  status: string;
  channel: string;
  created_at: string;
  updated_at: string;
  duration_seconds?: number;
  ended_reason?: string;
  was_successful?: boolean;
  conversation_summary?: string;
  conversation_summary_translated?: string;
  client_intent?: string;
  agent_name?: string;
  ai_model?: string;
  outcome_type?: string;
  follow_up_notes?: string;
  customer_satisfaction?: string;
  agent_performance?: string;
  // Información del cliente
  client_names?: string;
  client_email?: string;
  client_phone?: string;
  // Estado del agente AI (prioriza phone_agent_settings.agent_active sobre client.agent_active)
  client_agent_active?: boolean;
  // Métricas de urgencia
  hours_since_last_activity: number;
  urgency_level: 'urgent' | 'normal';
  // Campos para indicadores de mensajes no leídos
  messages?: any[];
  last_read_at?: string | null;
  // Total count para paginación
  total_count: number;
}

export function useSelectedConversation() {
  const [selectedConversation, setSelectedConversation] = useState<ConversacionAccionHumana | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);

  const selectConversation = (conversation: ConversacionAccionHumana) => {
    setSelectedConversation(conversation);
    setSelectedConversationId(conversation.id);
  };

  const clearSelection = () => {
    setSelectedConversation(null);
    setSelectedConversationId(undefined);
  };

  return {
    selectedConversation,
    selectedConversationId,
    selectConversation,
    clearSelection
  };
}
