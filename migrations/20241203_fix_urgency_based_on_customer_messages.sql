-- MIGRACIÓN: Corregir lógica de urgencia basada en mensajes del cliente
-- Fecha: 2024-12-03
-- Objetivo: Basar urgencia y ordenamiento en último mensaje del cliente, no en updated_at,
--           y soportar roles 'user' y 'customer' para mensajes de cliente

-- Eliminar la función existente para recrearla con la lógica corregida
DROP FUNCTION IF EXISTS get_conversations_needing_human_action(UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_conversations_needing_human_action(
  p_dealership_id UUID,
  p_channel_filter TEXT DEFAULT NULL,
  p_urgency_filter TEXT DEFAULT 'all',
  p_search_query TEXT DEFAULT NULL,
  p_limit_rows INTEGER DEFAULT 20,
  p_offset_rows INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_identifier TEXT,
  client_id UUID,
  dealership_id UUID,
  status TEXT,
  channel VARCHAR(20),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  ended_reason TEXT,
  was_successful BOOLEAN,
  conversation_summary TEXT,
  conversation_summary_translated TEXT,
  client_intent TEXT,
  agent_name TEXT,
  ai_model TEXT,
  outcome_type TEXT,
  follow_up_notes TEXT,
  customer_satisfaction TEXT,
  agent_performance TEXT,
  -- Información del cliente
  client_names TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_agent_active BOOLEAN,
  -- Métricas de urgencia (basadas en último mensaje del cliente)
  hours_since_last_activity INTEGER,
  urgency_level TEXT,
  -- Campos para indicadores de mensajes no leídos
  messages JSONB,
  last_read_at TIMESTAMPTZ,
  -- Total count para paginación
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_count BIGINT;
  v_urgency_threshold_hours INTEGER;
BEGIN
  -- Determinar el umbral de horas según el filtro de urgencia
  CASE p_urgency_filter
    WHEN 'critical' THEN v_urgency_threshold_hours := 6;
    WHEN 'very_urgent' THEN v_urgency_threshold_hours := 12;
    WHEN 'urgent' THEN v_urgency_threshold_hours := 24;
    ELSE v_urgency_threshold_hours := 999999; -- Para 'all' o cualquier otro valor
  END CASE;

  -- Obtener el total de conversaciones que coinciden con los filtros
  SELECT COUNT(*)
  INTO v_total_count
  FROM chat_conversations cc
  LEFT JOIN client c ON cc.client_id = c.id
  WHERE cc.dealership_id = p_dealership_id
    AND (c.agent_active = false OR c.agent_active IS NULL)
    AND (p_channel_filter IS NULL OR cc.channel = p_channel_filter)
    AND (p_search_query IS NULL OR 
         cc.user_identifier ILIKE '%' || p_search_query || '%' OR
         COALESCE(c.names, '') ILIKE '%' || p_search_query || '%' OR
         COALESCE(c.phone_number, '') ILIKE '%' || p_search_query || '%' OR
         COALESCE(c.email, '') ILIKE '%' || p_search_query || '%');

  -- Retornar las conversaciones con información del cliente y métricas de urgencia
  RETURN QUERY
  WITH conversation_metrics AS (
    SELECT 
      cc.id,
      cc.user_identifier,
      cc.client_id,
      cc.dealership_id,
      cc.status,
      cc.channel,
      cc.created_at,
      cc.updated_at,
      cc.duration_seconds,
      cc.ended_reason,
      cc.was_successful,
      cc.conversation_summary,
      cc.conversation_summary_translated,
      cc.client_intent,
      cc.agent_name,
      cc.ai_model,
      cc.outcome_type,
      cc.follow_up_notes,
      cc.customer_satisfaction,
      cc.agent_performance,
      -- Información del cliente (convertir character varying a text)
      c.names::TEXT as client_names,
      c.email::TEXT as client_email,
      c.phone_number::TEXT as client_phone,
      c.agent_active as client_agent_active,
      -- Campos para indicadores de mensajes no leídos
      cc.messages,
      cc.last_read_at,
      -- Calcular timestamp del último mensaje del cliente (SOPORTE PARA AMBOS ROLES: 'user' Y 'customer')
      (
        SELECT MAX((msg->>'created_at')::TIMESTAMPTZ)
        FROM jsonb_array_elements(cc.messages) AS msg
        WHERE msg->>'role' IN ('user', 'customer')
      ) as last_customer_message_time
    FROM chat_conversations cc
    LEFT JOIN client c ON cc.client_id = c.id
    WHERE cc.dealership_id = p_dealership_id
      AND (c.agent_active = false OR c.agent_active IS NULL)
      AND (p_channel_filter IS NULL OR cc.channel = p_channel_filter)
      AND (p_search_query IS NULL OR 
           cc.user_identifier ILIKE '%' || p_search_query || '%' OR
           COALESCE(c.names, '') ILIKE '%' || p_search_query || '%' OR
           COALESCE(c.phone_number, '') ILIKE '%' || p_search_query || '%' OR
           COALESCE(c.email, '') ILIKE '%' || p_search_query || '%')
  )
  SELECT 
    cm.id,
    cm.user_identifier,
    cm.client_id,
    cm.dealership_id,
    cm.status,
    cm.channel,
    cm.created_at,
    cm.updated_at,
    cm.duration_seconds::INTEGER,
    cm.ended_reason,
    cm.was_successful,
    cm.conversation_summary,
    cm.conversation_summary_translated,
    cm.client_intent,
    cm.agent_name,
    cm.ai_model,
    cm.outcome_type::TEXT,
    cm.follow_up_notes,
    cm.customer_satisfaction::TEXT,
    cm.agent_performance::TEXT,
    cm.client_names,
    cm.client_email,
    cm.client_phone,
    cm.client_agent_active,
    -- Calcular horas desde la última actividad del cliente (no desde updated_at)
    CASE 
      WHEN cm.last_customer_message_time IS NOT NULL THEN
        (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cm.last_customer_message_time)) / 3600)::INTEGER
      ELSE
        (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cm.updated_at)) / 3600)::INTEGER
    END as hours_since_last_activity,
    -- Determinar nivel de urgencia basado en último mensaje del cliente
    CASE 
      WHEN cm.last_customer_message_time IS NOT NULL THEN
        CASE 
          WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cm.last_customer_message_time)) / 3600 <= 6 THEN 'critical'
          WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cm.last_customer_message_time)) / 3600 <= 12 THEN 'very_urgent'
          WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cm.last_customer_message_time)) / 3600 <= 24 THEN 'urgent'
          ELSE 'normal'
        END
      ELSE
        CASE 
          WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cm.updated_at)) / 3600 <= 6 THEN 'critical'
          WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cm.updated_at)) / 3600 <= 12 THEN 'very_urgent'
          WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cm.updated_at)) / 3600 <= 24 THEN 'urgent'
          ELSE 'normal'
        END
    END as urgency_level,
    cm.messages,
    cm.last_read_at,
    v_total_count
  FROM conversation_metrics cm
  WHERE (p_urgency_filter = 'all' OR 
         (cm.last_customer_message_time IS NOT NULL AND 
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cm.last_customer_message_time)) / 3600 <= v_urgency_threshold_hours) OR
         (cm.last_customer_message_time IS NULL AND 
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cm.updated_at)) / 3600 <= v_urgency_threshold_hours))
  ORDER BY 
    -- Ordenar por último mensaje del cliente primero, luego por updated_at
    COALESCE(cm.last_customer_message_time, cm.updated_at) DESC
  LIMIT p_limit_rows
  OFFSET p_offset_rows;
END;
$$;

-- Comentario para la función actualizada
COMMENT ON FUNCTION get_conversations_needing_human_action IS 'Obtiene conversaciones que necesitan acción humana con urgencia basada en último mensaje del cliente (soporta role=user y role=customer) - VERSIÓN CORREGIDA';
