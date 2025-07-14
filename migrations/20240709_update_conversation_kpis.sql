-- MIGRACIÓN: Corrección de KPIs de Conversaciones (criterio unificado y fixes UX)
-- Fecha: 2024-07-09

DROP FUNCTION IF EXISTS get_conversation_kpis(UUID);

CREATE OR REPLACE FUNCTION get_conversation_kpis(p_dealership_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH main_metrics AS (
    SELECT 
      COUNT(*) FILTER (WHERE updated_at >= DATE_TRUNC('month', CURRENT_DATE)) as total,
      COUNT(*) FILTER (WHERE channel = 'whatsapp' AND updated_at >= DATE_TRUNC('month', CURRENT_DATE)) as whatsapp_count,
      COUNT(*) FILTER (WHERE channel = 'phone' AND updated_at >= DATE_TRUNC('month', CURRENT_DATE)) as phone_count,
      COUNT(*) FILTER (WHERE channel IS NULL OR channel NOT IN ('whatsapp', 'phone') AND updated_at >= DATE_TRUNC('month', CURRENT_DATE)) as otros_count,
      COUNT(*) FILTER (WHERE updated_at >= CURRENT_DATE) as conversaciones_hoy,
      COUNT(*) FILTER (WHERE status = 'closed' AND updated_at >= DATE_TRUNC('month', CURRENT_DATE)) as cerradas,
      COUNT(*) FILTER (WHERE status = 'pending' AND updated_at >= DATE_TRUNC('month', CURRENT_DATE)) as pendientes
    FROM chat_conversations
    WHERE dealership_id = p_dealership_id
  ),
  
  -- Métricas de crecimiento (mes actual vs mes anterior)
  growth_metrics AS (
    SELECT 
      COUNT(*) FILTER (WHERE updated_at >= DATE_TRUNC('month', CURRENT_DATE)) as current_month,
      COUNT(*) FILTER (WHERE updated_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
                       AND updated_at < DATE_TRUNC('month', CURRENT_DATE)) as previous_month
    FROM chat_conversations
    WHERE dealership_id = p_dealership_id
  ),
  
  -- Duración promedio de llamadas telefónicas válidas (solo si hay llamadas)
  avg_duration AS (
    SELECT 
      CASE 
        WHEN COUNT(*) FILTER (WHERE channel = 'phone' AND status = 'closed') > 0 THEN
          ROUND(AVG(
            CASE 
              WHEN channel = 'phone' 
                AND status = 'closed' 
                AND updated_at IS NOT NULL 
                AND created_at IS NOT NULL
                AND EXTRACT(EPOCH FROM (updated_at - created_at))/60 BETWEEN 1 AND 120
              THEN EXTRACT(EPOCH FROM (updated_at - created_at))/60
              ELSE NULL 
            END
          )::numeric, 1)
        ELSE NULL
      END as duracion_promedio
    FROM chat_conversations
    WHERE dealership_id = p_dealership_id
      AND updated_at >= DATE_TRUNC('month', CURRENT_DATE)
  ),
  
  -- Datos diarios para gráfico (SOLO MES ACTUAL, formateados)
  daily_stats AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('day', updated_at), 'DD/MM') as fecha,
      DATE_TRUNC('day', updated_at) as fecha_sort,
      COUNT(*) FILTER (WHERE channel = 'whatsapp') as whatsapp,
      COUNT(*) FILTER (WHERE channel = 'phone') as telefono
    FROM chat_conversations
    WHERE dealership_id = p_dealership_id
      AND updated_at >= DATE_TRUNC('month', CURRENT_DATE)
      AND updated_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    GROUP BY DATE_TRUNC('day', updated_at)
    ORDER BY fecha_sort ASC
  ),
  
  -- Generar fechas faltantes para completar el mes actual
  date_series AS (
    SELECT 
      TO_CHAR(d::date, 'DD/MM') as fecha,
      d::date as fecha_sort
    FROM generate_series(
      DATE_TRUNC('month', CURRENT_DATE)::date,
      (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date,
      '1 day'::interval
    ) d
  ),
  
  -- Combinar fechas generadas con datos reales
  complete_daily_data AS (
    SELECT 
      ds.fecha,
      ds.fecha_sort,
      COALESCE(dst.whatsapp, 0) as whatsapp,
      COALESCE(dst.telefono, 0) as telefono
    FROM date_series ds
    LEFT JOIN daily_stats dst ON ds.fecha = dst.fecha
    ORDER BY ds.fecha_sort ASC
  )
  
  -- Construir el JSON final con la estructura exacta que espera el frontend
  SELECT json_build_object(
    'metricas', json_build_object(
      'total', mm.total,
      'activas', mm.conversaciones_hoy,
      'cerradas', mm.cerradas,
      'pendientes', mm.pendientes,
      'porCanal', json_build_array(
        json_build_object('name', 'WhatsApp', 'value', mm.whatsapp_count),
        json_build_object('name', 'Teléfono', 'value', mm.phone_count)
      ),
      'porFecha', (SELECT json_agg(
        json_build_object(
          'fecha', cdd.fecha,
          'WhatsApp', cdd.whatsapp,
          'Teléfono', cdd.telefono
        )
      ) FROM complete_daily_data cdd)
    ),
    'growth', json_build_object(
      'current_month', gm.current_month,
      'previous_month', gm.previous_month,
      'growth_percentage', CASE 
        WHEN gm.previous_month > 0 THEN 
          ROUND(((gm.current_month - gm.previous_month)::numeric / gm.previous_month * 100)::numeric, 1)
        ELSE 0 
      END,
      'vs_previous_month', gm.current_month - gm.previous_month
    ),
    'duracionPromedio', ad.duracion_promedio
  ) INTO result
  FROM main_metrics mm, growth_metrics gm, avg_duration ad;
  
  RETURN result;
END;
$$;

-- Comentario: Esta función calcula KPIs de conversaciones usando updated_at como criterio unificado
-- y muestra el gráfico de tendencias solo para el mes actual 