-- MIGRACIÓN: Corrección de la función get_conversations_without_transfers
-- Fecha: 2024-12-01
-- Descripción: Corregir la lógica de agent_active (true = without transfers, false = with transfers)

-- Corregir la función get_conversations_without_transfers
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
      
      -- WITHOUT transfers: agent_active = true o NULL (AI puede manejar)
      COUNT(*) FILTER (
        WHERE (c.agent_active IS NULL OR c.agent_active = true)
      ) as without_transfers,
      
      -- WITH transfers: agent_active = false (necesita intervención humana)
      COUNT(*) FILTER (
        WHERE c.agent_active = false
      ) as with_transfers,
      
      ROUND(
        (COUNT(*) FILTER (WHERE c.agent_active IS NULL OR c.agent_active = true) * 100.0 / NULLIF(COUNT(*), 0))::numeric, 
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

-- Actualizar comentario de la función
COMMENT ON FUNCTION get_conversations_without_transfers(UUID) IS 'Calcula porcentaje de conversaciones de WhatsApp resueltas sin derivar a agente humano. agent_active=true/NULL = without transfers, agent_active=false = with transfers';
