-- MIGRACIÓN: Crear nueva función get_all_conversations_with_agent_status
-- Fecha: 2024-12-19
-- Objetivo: Función específica para la lista general de conversaciones que incluye el estado del agente

CREATE OR REPLACE FUNCTION public.get_all_conversations_with_agent_status(
  dealership_id_param uuid, 
  search_query text, 
  p_status_filter text, 
  channel_filter text, 
  ended_reason_filter text
)
RETURNS TABLE(
  id uuid, 
  created_at timestamp with time zone, 
  user_identifier text, 
  client jsonb, 
  updated_at timestamp with time zone, 
  status text, 
  channel character varying, 
  ended_reason text, 
  was_successful boolean, 
  messages jsonb, 
  last_read_at timestamp with time zone, 
  last_message_time timestamp with time zone,
  client_agent_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id,
    cc.created_at,
    cc.user_identifier,
    jsonb_build_object(
      'names', c.names,
      'phone_number', c.phone_number,
      'email', c.email
    ) as client,
    cc.updated_at,
    cc.status,
    cc.channel,
    cc.ended_reason,
    cc.was_successful,
    cc.messages,
    cc.last_read_at,
    -- Calcular el timestamp del último mensaje de cualquier tipo
    (
      SELECT MAX(
        COALESCE(
          (msg->>'created_at')::timestamp with time zone,
          (msg->>'timestamp')::timestamp with time zone,
          (msg->>'time')::timestamp with time zone
        )
      )
      FROM jsonb_array_elements(cc.messages) as msg
      WHERE msg->>'content' IS NOT NULL 
        AND msg->>'content' != ''
    ) as last_message_time,
    -- Campo client_agent_active usando la misma lógica que get_conversations_needing_human_action
    -- Priorizar phone_agent_settings.agent_active sobre client.agent_active
    COALESCE(pas.agent_active, c.agent_active, true) as client_agent_active
  FROM chat_conversations cc
  LEFT JOIN client c ON cc.client_id = c.id
  LEFT JOIN phone_agent_settings pas ON c.phone_number = pas.phone_number 
    AND c.dealership_id = pas.dealership_id
  WHERE cc.dealership_id = dealership_id_param
    AND (p_status_filter = 'todos' OR cc.status = p_status_filter)
    AND (channel_filter = 'todos' OR cc.channel = channel_filter)
    AND (ended_reason_filter = 'todas' OR cc.ended_reason = ended_reason_filter)
    AND (
      search_query IS NULL OR 
      cc.user_identifier ILIKE '%' || search_query || '%' OR
      c.names ILIKE '%' || search_query || '%' OR
      c.phone_number ILIKE '%' || search_query || '%' OR
      c.email ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    -- Ordenar por el último mensaje de cualquier tipo (si existe)
    COALESCE(
      (
        SELECT MAX(
          COALESCE(
            (msg->>'created_at')::timestamp with time zone,
            (msg->>'timestamp')::timestamp with time zone,
            (msg->>'time')::timestamp with time zone
          )
        )
        FROM jsonb_array_elements(cc.messages) as msg
        WHERE msg->>'content' IS NOT NULL 
          AND msg->>'content' != ''
      ),
      cc.updated_at
    ) DESC;
END;
$function$;
