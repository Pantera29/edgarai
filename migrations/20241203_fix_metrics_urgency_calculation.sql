-- MIGRACIÓN: Corregir cálculo de urgencia en métricas para que coincida con la función principal
-- Fecha: 2024-12-03
-- Objetivo: Hacer que get_human_action_metrics use la misma lógica de urgencia que get_conversations_needing_human_action
--           basándose en last_customer_message_time en lugar de updated_at

-- Eliminar la función existente para recrearla con la lógica corregida
DROP FUNCTION IF EXISTS get_human_action_metrics(UUID);

CREATE OR REPLACE FUNCTION get_human_action_metrics(p_dealership_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH conversation_metrics AS (
    SELECT 
      cc.id,
      cc.channel,
      cc.updated_at,
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
  ),
  metrics AS (
    SELECT 
      COUNT(*) as total_conversations,
      COUNT(*) FILTER (WHERE channel = 'whatsapp') as whatsapp_count,
      COUNT(*) FILTER (WHERE channel = 'phone') as phone_count,
      -- Calcular urgentes basándose en last_customer_message_time (misma lógica que la función principal)
      COUNT(*) FILTER (WHERE 
        CASE 
          WHEN last_customer_message_time IS NOT NULL THEN
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_customer_message_time)) / 3600 <= 6
          ELSE
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - updated_at)) / 3600 <= 6
        END
      ) as critical_count,
      COUNT(*) FILTER (WHERE 
        CASE 
          WHEN last_customer_message_time IS NOT NULL THEN
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_customer_message_time)) / 3600 <= 12
          ELSE
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - updated_at)) / 3600 <= 12
        END
      ) as very_urgent_count,
      COUNT(*) FILTER (WHERE 
        CASE 
          WHEN last_customer_message_time IS NOT NULL THEN
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_customer_message_time)) / 3600 <= 24
          ELSE
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - updated_at)) / 3600 <= 24
        END
      ) as urgent_count,
      AVG(
        CASE 
          WHEN last_customer_message_time IS NOT NULL THEN
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_customer_message_time)) / 3600
          ELSE
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - updated_at)) / 3600
        END
      ) as avg_hours_since_activity
    FROM conversation_metrics
  )
  SELECT json_build_object(
    'total_conversations', m.total_conversations,
    'whatsapp_count', m.whatsapp_count,
    'phone_count', m.phone_count,
    'critical_count', m.critical_count,
    'very_urgent_count', m.very_urgent_count,
    'urgent_count', m.urgent_count,
    'avg_hours_since_activity', ROUND(m.avg_hours_since_activity::numeric, 1),
    'urgency_distribution', json_build_object(
      'critical', m.critical_count,
      'very_urgent', m.very_urgent_count - m.critical_count,
      'urgent', m.urgent_count - m.very_urgent_count,
      'normal', m.total_conversations - m.urgent_count
    )
  ) INTO result
  FROM metrics m;
  
  RETURN result;
END;
$$;

-- Comentario para la función actualizada
COMMENT ON FUNCTION get_human_action_metrics IS 'Obtiene métricas de conversaciones que necesitan acción humana con urgencia basada en último mensaje del cliente (soporta role=user y role=customer) - VERSIÓN CORREGIDA';
