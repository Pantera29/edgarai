-- Función RPC para calcular el uso mensual de conversaciones por agencia
-- Combina datos de chat_conversations (llamadas) y historial_chat (WhatsApp)
-- para contar usuarios únicos por mes

CREATE OR REPLACE FUNCTION get_monthly_conversation_usage(
  p_dealership_id TEXT,
  p_start_date TIMESTAMPTZ,
  p_months_limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  period TEXT,
  unique_conversations BIGINT,
  phone_users BIGINT,
  whatsapp_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH phone_users AS (
    SELECT DISTINCT 
      RIGHT(REGEXP_REPLACE(user_identifier, '[^0-9]', '', 'g'), 10) as normalized_phone,
      DATE_TRUNC('month', created_at) as month_period
    FROM chat_conversations 
    WHERE dealership_id = p_dealership_id
      AND channel = 'phone' 
      AND duration_seconds >= 30
      AND created_at >= p_start_date
  ),
  whatsapp_users AS (
    SELECT DISTINCT 
      RIGHT(REGEXP_REPLACE(CAST(chat_id AS TEXT), '[^0-9]', '', 'g'), 10) as normalized_phone,
      DATE_TRUNC('month', created_at) as month_period
    FROM historial_chat 
    WHERE dealership_id = p_dealership_id
      AND created_at >= p_start_date
  ),
  all_users AS (
    SELECT normalized_phone, month_period, 'phone' as channel FROM phone_users
    UNION
    SELECT normalized_phone, month_period, 'whatsapp' as channel FROM whatsapp_users
  )
  SELECT 
    TO_CHAR(month_period, 'YYYY-MM') as period,
    COUNT(DISTINCT normalized_phone) as unique_conversations,
    COUNT(CASE WHEN channel = 'phone' THEN 1 END) as phone_users,
    COUNT(CASE WHEN channel = 'whatsapp' THEN 1 END) as whatsapp_users
  FROM all_users
  GROUP BY month_period
  ORDER BY month_period DESC
  LIMIT p_months_limit;
END;
$$;

-- Comentario para la función
COMMENT ON FUNCTION get_monthly_conversation_usage IS 'Calcula el uso mensual de conversaciones por agencia, combinando llamadas y WhatsApp';

-- Crear índices para optimizar las consultas si no existen
CREATE INDEX IF NOT EXISTS idx_chat_conversations_dealership_channel_duration 
ON chat_conversations(dealership_id, channel, duration_seconds, created_at);

CREATE INDEX IF NOT EXISTS idx_historial_chat_dealership_created 
ON historial_chat(dealership_id, created_at);

-- Índices adicionales para mejorar el rendimiento de las expresiones regulares
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_identifier 
ON chat_conversations(user_identifier) 
WHERE channel = 'phone' AND duration_seconds >= 30;

CREATE INDEX IF NOT EXISTS idx_historial_chat_chat_id 
ON historial_chat(chat_id); 