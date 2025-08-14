-- MIGRACIÓN: Funciones RPC para métricas de Agents in Action
-- Fecha: 2024-12-01

-- Eliminar funciones existentes si existen
DROP FUNCTION IF EXISTS get_unique_customers_month(UUID);
DROP FUNCTION IF EXISTS get_ai_appointments_month(UUID);
DROP FUNCTION IF EXISTS get_conversations_without_transfers(UUID);

-- 1. Función para obtener clientes únicos del mes actual
CREATE OR REPLACE FUNCTION get_unique_customers_month(p_dealership_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH unique_customers AS (
    SELECT COUNT(DISTINCT normalized_phone) as unique_customers
    FROM (
      -- WhatsApp users
      SELECT DISTINCT 
        RIGHT(REGEXP_REPLACE(CAST(chat_id AS TEXT), '[^0-9]', '', 'g'), 10) as normalized_phone
      FROM historial_chat 
      WHERE CAST(dealership_id AS TEXT) = CAST(p_dealership_id AS TEXT)
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
        AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      
      UNION
      
      -- Phone users (llamadas de 30+ segundos)
      SELECT DISTINCT 
        RIGHT(REGEXP_REPLACE(user_identifier, '[^0-9]', '', 'g'), 10) as normalized_phone
      FROM chat_conversations 
      WHERE dealership_id = p_dealership_id
        AND channel = 'phone' 
        AND duration_seconds >= 30
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
        AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ) all_users
  )
  SELECT json_build_object(
    'unique_customers', uc.unique_customers
  ) INTO result
  FROM unique_customers uc;
  
  RETURN result;
END;
$$;

-- 2. Función para obtener citas del AI del mes actual
CREATE OR REPLACE FUNCTION get_ai_appointments_month(p_dealership_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH ai_appointments AS (
    SELECT 
      -- Citas exitosas (booked)
      COUNT(*) FILTER (
        WHERE status IN ('confirmed', 'pending', 'completed') 
        AND (cancelled_at IS NULL AND status != 'cancelled')
      ) as booked,
      
      -- Citas reagendadas (pero que siguen activas)
      COUNT(*) FILTER (
        WHERE rescheduled_at IS NOT NULL
        AND status IN ('confirmed', 'pending', 'completed')
        AND (cancelled_at IS NULL AND status != 'cancelled')
      ) as rescheduled,
      
      -- Citas canceladas
      COUNT(*) FILTER (
        WHERE (cancelled_at IS NOT NULL OR status = 'cancelled')
      ) as cancelled,
      
      -- Total de citas gestionadas por AI
      COUNT(*) as total

    FROM appointment 
    WHERE dealership_id = p_dealership_id
      AND channel = 'agenteai'
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
      AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  )
  SELECT json_build_object(
    'total', aa.total,
    'booked', aa.booked,
    'rescheduled', aa.rescheduled,
    'cancelled', aa.cancelled
  ) INTO result
  FROM ai_appointments aa;
  
  RETURN result;
END;
$$;

-- 3. Función para obtener métricas de conversaciones sin transfers
CREATE OR REPLACE FUNCTION get_conversations_without_transfers(p_dealership_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH transfer_metrics AS (
    SELECT 
      COUNT(*) as total_conversations,
      
      COUNT(*) FILTER (
        WHERE (c.agent_active IS NULL OR c.agent_active = false)
      ) as without_transfers,
      
      COUNT(*) FILTER (
        WHERE c.agent_active = true
      ) as with_transfers,
      
      ROUND(
        (COUNT(*) FILTER (WHERE c.agent_active IS NULL OR c.agent_active = false) * 100.0 / NULLIF(COUNT(*), 0))::numeric, 
        2
      ) as pct_without_transfers

    FROM chat_conversations cc
    LEFT JOIN client c ON cc.client_id = c.id
    WHERE cc.dealership_id = p_dealership_id
      AND cc.channel = 'whatsapp'
      AND cc.created_at >= DATE_TRUNC('month', CURRENT_DATE)
      AND cc.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  )
  SELECT json_build_object(
    'total_conversations', tm.total_conversations,
    'without_transfers', tm.without_transfers,
    'with_transfers', tm.with_transfers,
    'pct_without_transfers', tm.pct_without_transfers
  ) INTO result
  FROM transfer_metrics tm;
  
  RETURN result;
END;
$$;

-- Comentarios de las funciones
COMMENT ON FUNCTION get_unique_customers_month(UUID) IS 'Calcula clientes únicos que interactuaron en WhatsApp o llamadas telefónicas en el mes actual';
COMMENT ON FUNCTION get_ai_appointments_month(UUID) IS 'Calcula métricas de citas gestionadas por el agente AI en el mes actual';
COMMENT ON FUNCTION get_conversations_without_transfers(UUID) IS 'Calcula porcentaje de conversaciones de WhatsApp resueltas sin derivar a agente humano';
