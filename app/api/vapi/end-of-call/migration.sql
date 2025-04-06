-- Verificar si la columna 'channel' ya existe y añadirla si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'chat_conversations'
        AND column_name = 'channel'
    ) THEN
        ALTER TABLE chat_conversations
        ADD COLUMN channel VARCHAR(20) DEFAULT 'chat' NOT NULL;
        
        -- Comentario para la nueva columna
        COMMENT ON COLUMN chat_conversations.channel IS 'Canal de comunicación: chat, phone, whatsapp, etc.';
    END IF;

    -- Verificar si la columna 'metadata' ya existe y añadirla si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chat_conversations'
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE chat_conversations
        ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        
        -- Comentario para la nueva columna
        COMMENT ON COLUMN chat_conversations.metadata IS 'Datos adicionales específicos del canal de comunicación';
    END IF;
END
$$; 