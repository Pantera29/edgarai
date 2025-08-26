-- MIGRACIÓN: Mejorar sync_whatsapp_conversations para incluir información del usuario
-- Fecha: 2024-12-04
-- Objetivo: Incluir sender_user_id y sender_name en los mensajes sincronizados

CREATE OR REPLACE FUNCTION public.sync_whatsapp_conversations()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    nuevas_conversaciones INT := 0;
    conversaciones_actualizadas INT := 0;
    registros_procesados INT := 0;
BEGIN
    -- Lock para evitar ejecuciones concurrentes
    PERFORM pg_advisory_lock(12345);
    
    BEGIN
        -- 1. INSERTAR NUEVAS CONVERSACIONES (CON VALIDACIÓN ROBUSTA)
        WITH conversaciones_nuevas AS (
            SELECT 
                h.chat_id::text as chat_id_text,
                c.id AS client_id,
                h.dealership_id::uuid AS dealership_id_uuid,
                CASE 
                    WHEN MAX(h.created_at) = MAX(CASE WHEN h.status = 'active' THEN h.created_at END) THEN 'active'
                    ELSE 'closed'
                END as conversation_status,
                jsonb_agg(
                    jsonb_build_object(
                        'id', h.message_id,
                        'content', h.message,
                        'role', CASE 
                            WHEN h.sender_type = 'ai_agent' THEN 'ai_agent'
                            WHEN h.sender_type = 'dealership_worker' THEN 'dealership_worker'
                            WHEN h.sender_type = 'customer' THEN 'customer'
                            -- Fallback para registros antiguos sin sender_type
                            WHEN h.agente = true THEN 'ai_agent'
                            WHEN h.agente = false OR h.agente IS NULL THEN 'customer'
                            ELSE 'customer'
                        END,
                        'created_at', h.created_at,
                        -- ← NUEVO: Incluir información del usuario (manejar NULLs)
                        'sender_user_id', COALESCE(h.sender_user_id, null),
                        'sender_name', COALESCE(h.sender_name, null)
                    ) ORDER BY h.created_at
                ) as all_messages,
                MIN(h.created_at) as first_message_at,
                MAX(h.created_at) as last_message_at,
                COUNT(*) as message_count,
                COUNT(*) FILTER (WHERE h.agente OR h.sender_type IN ('ai_agent', 'dealership_worker')) as agent_messages,
                COUNT(*) FILTER (WHERE NOT h.agente OR h.sender_type = 'customer') as user_messages
            FROM historial_chat h
            LEFT JOIN client c ON (
                c.phone_number = h.chat_id::text 
                AND c.dealership_id = h.dealership_id::uuid
            )
            WHERE h.chat_id IS NOT NULL 
            AND h.dealership_id IS NOT NULL
            AND h.chat_id::text != ''
            AND h.dealership_id::text != ''
            AND NOT EXISTS (
                SELECT 1 
                FROM chat_conversations cc
                WHERE cc.user_identifier = h.chat_id::text 
                AND cc.channel = 'whatsapp'
                AND cc.dealership_id = h.dealership_id::uuid
            )
            GROUP BY h.chat_id::text, c.id, h.dealership_id::uuid
            HAVING COUNT(*) > 0
        )
        INSERT INTO chat_conversations (
            user_identifier,
            client_id,
            dealership_id,
            status,
            channel,
            messages,
            created_at,
            updated_at,
            metadata
        )
        SELECT 
            cn.chat_id_text,
            cn.client_id,
            cn.dealership_id_uuid,
            cn.conversation_status,
            'whatsapp',
            cn.all_messages,
            cn.first_message_at,
            cn.last_message_at,
            jsonb_build_object(
                'whatsapp_chat_id', cn.chat_id_text,
                'message_count', cn.message_count,
                'agent_messages', cn.agent_messages,
                'user_messages', cn.user_messages,
                'last_message_at', cn.last_message_at,
                'sync_timestamp', NOW()
            )
        FROM conversaciones_nuevas cn;
        
        GET DIAGNOSTICS nuevas_conversaciones = ROW_COUNT;

        -- 2. ACTUALIZAR CONVERSACIONES EXISTENTES (CON MEJOR LÓGICA)
        WITH conversaciones_con_mensajes_nuevos AS (
            SELECT DISTINCT 
                h.chat_id::text AS chat_id_text,
                h.dealership_id::uuid AS dealership_id_uuid
            FROM historial_chat h
            INNER JOIN chat_conversations cc ON (
                cc.user_identifier = h.chat_id::text 
                AND cc.channel = 'whatsapp'
                AND cc.dealership_id = h.dealership_id::uuid
            )
            WHERE h.dealership_id IS NOT NULL
            AND h.created_at > COALESCE(
                (cc.metadata->>'last_message_at')::timestamp, 
                cc.updated_at,
                '1970-01-01'::timestamp
            )
        ),
        datos_completos_conversacion AS (
            SELECT 
                h.chat_id::text AS chat_id_text,
                h.dealership_id::uuid AS dealership_id_uuid,
                c.id AS client_id,
                MAX(h.created_at) AS latest_message_time,
                COUNT(*) as total_messages,
                COUNT(*) FILTER (WHERE h.agente OR h.sender_type IN ('ai_agent', 'dealership_worker')) as agent_messages,
                COUNT(*) FILTER (WHERE NOT h.agente OR h.sender_type = 'customer') as user_messages,
                jsonb_agg(
                    jsonb_build_object(
                        'id', h.message_id,
                        'content', h.message,
                        'role', CASE 
                            WHEN h.sender_type = 'ai_agent' THEN 'ai_agent'
                            WHEN h.sender_type = 'dealership_worker' THEN 'dealership_worker'
                            WHEN h.sender_type = 'customer' THEN 'customer'
                            -- Fallback para registros antiguos sin sender_type
                            WHEN h.agente = true THEN 'ai_agent'
                            WHEN h.agente = false OR h.agente IS NULL THEN 'customer'
                            ELSE 'customer'
                        END,
                        'created_at', h.created_at,
                        -- ← NUEVO: Incluir información del usuario (manejar NULLs)
                        'sender_user_id', COALESCE(h.sender_user_id, null),
                        'sender_name', COALESCE(h.sender_name, null)
                    ) ORDER BY h.created_at
                ) as all_messages,
                CASE 
                    WHEN MAX(h.created_at) = MAX(CASE WHEN h.status = 'active' THEN h.created_at END) THEN 'active'
                    ELSE 'closed'
                END as current_status
            FROM historial_chat h
            LEFT JOIN client c ON (
                c.phone_number = h.chat_id::text 
                AND c.dealership_id = h.dealership_id::uuid
            )
            INNER JOIN conversaciones_con_mensajes_nuevos cmn ON (
                cmn.chat_id_text = h.chat_id::text
                AND cmn.dealership_id_uuid = h.dealership_id::uuid
            )
            WHERE h.dealership_id IS NOT NULL
            GROUP BY h.chat_id::text, h.dealership_id::uuid, c.id
        )
        UPDATE chat_conversations cc
        SET 
            messages = dcc.all_messages,
            updated_at = dcc.latest_message_time,
            client_id = COALESCE(dcc.client_id, cc.client_id),
            status = dcc.current_status,
            metadata = jsonb_set(
                jsonb_set(
                    jsonb_set(
                        COALESCE(cc.metadata, '{}'::jsonb),
                        '{whatsapp_stats}',
                        jsonb_build_object(
                            'message_count', dcc.total_messages,
                            'agent_messages', dcc.agent_messages,
                            'user_messages', dcc.user_messages
                        )
                    ),
                    '{last_message_at}',
                    to_jsonb(dcc.latest_message_time)
                ),
                '{sync_timestamp}',
                to_jsonb(NOW())
            )
        FROM datos_completos_conversacion dcc
        WHERE cc.user_identifier = dcc.chat_id_text
        AND cc.channel = 'whatsapp'
        AND cc.dealership_id = dcc.dealership_id_uuid;

        GET DIAGNOSTICS conversaciones_actualizadas = ROW_COUNT;

        -- 3. LOG DETALLADO PARA DEBUGGING
        SELECT COUNT(*) INTO registros_procesados
        FROM historial_chat
        WHERE dealership_id IS NOT NULL;

        RAISE NOTICE '=== SYNC WHATSAPP COMPLETADO ===';
        RAISE NOTICE 'Registros válidos en historial_chat: %', registros_procesados;
        RAISE NOTICE 'Registros con dealership_id NULL (ignorados): %', 
            (SELECT COUNT(*) FROM historial_chat WHERE dealership_id IS NULL);
        RAISE NOTICE 'Nuevas conversaciones insertadas: %', nuevas_conversaciones;
        RAISE NOTICE 'Conversaciones actualizadas: %', conversaciones_actualizadas;
        RAISE NOTICE 'Timestamp: %', NOW();
        
        -- Estadísticas adicionales
        RAISE NOTICE 'Total conversaciones WhatsApp: %', 
            (SELECT COUNT(*) FROM chat_conversations WHERE channel = 'whatsapp');
        RAISE NOTICE 'Usuarios únicos WhatsApp: %', 
            (SELECT COUNT(DISTINCT user_identifier) FROM chat_conversations WHERE channel = 'whatsapp');

    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Error en sync_whatsapp_conversations: % %', SQLERRM, SQLSTATE;
    END;
    
    -- Liberar el lock
    PERFORM pg_advisory_unlock(12345);

END;
$function$;

-- Comentario para la función actualizada
COMMENT ON FUNCTION sync_whatsapp_conversations() IS 'Sincroniza mensajes de historial_chat hacia chat_conversations incluyendo información del usuario que envía cada mensaje (sender_user_id, sender_name)';
