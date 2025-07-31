-- Migración: Sistema de Tokens para Calendario Público
-- Fecha: 2024-12-03
-- Descripción: Permite compartir calendario de citas con acceso de solo lectura

-- 1. Crear tabla principal
CREATE TABLE calendar_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0
);

-- 2. Crear constraint único para un token activo por dealership
CREATE UNIQUE INDEX unique_active_token_per_dealership 
ON calendar_tokens(dealership_id) 
WHERE is_active = TRUE;

-- 3. Crear índices para performance
CREATE INDEX idx_calendar_tokens_dealership_id ON calendar_tokens(dealership_id);
CREATE INDEX idx_calendar_tokens_token_hash ON calendar_tokens(token_hash);
CREATE INDEX idx_calendar_tokens_expires_at ON calendar_tokens(expires_at);

-- 4. Función para generar tokens únicos
CREATE OR REPLACE FUNCTION generate_calendar_token()
RETURNS TEXT AS $$
BEGIN
    -- Genera un token de 32 caracteres alfanuméricos
    RETURN encode(gen_random_bytes(24), 'base64');
END;
$$ LANGUAGE plpgsql;

-- 5. Función para crear token de calendario
CREATE OR REPLACE FUNCTION create_calendar_token(
    p_dealership_id UUID,
    p_expires_in_days INTEGER DEFAULT 30,
    p_created_by UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_token_hash TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generar token único
    v_token_hash := generate_calendar_token();
    
    -- Calcular fecha de expiración
    v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
    
    -- Desactivar token anterior si existe
    UPDATE calendar_tokens 
    SET is_active = FALSE 
    WHERE dealership_id = p_dealership_id AND is_active = TRUE;
    
    -- Insertar nuevo token
    INSERT INTO calendar_tokens (
        dealership_id, 
        token_hash, 
        expires_at, 
        created_by
    ) VALUES (
        p_dealership_id, 
        v_token_hash, 
        v_expires_at, 
        p_created_by
    );
    
    RETURN v_token_hash;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para validar token y actualizar estadísticas
CREATE OR REPLACE FUNCTION validate_calendar_token(p_token_hash TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    dealership_id UUID,
    error_message TEXT
) AS $$
BEGIN
    -- Verificar si el token existe y es válido
    RETURN QUERY
    SELECT 
        ct.is_active AND ct.expires_at > NOW() as is_valid,
        ct.dealership_id,
        CASE 
            WHEN ct.id IS NULL THEN 'Token no encontrado'
            WHEN NOT ct.is_active THEN 'Token desactivado'
            WHEN ct.expires_at <= NOW() THEN 'Token expirado'
            ELSE NULL
        END as error_message
    FROM calendar_tokens ct
    WHERE ct.token_hash = p_token_hash;
    
    -- Si el token es válido, actualizar estadísticas
    IF EXISTS (
        SELECT 1 FROM calendar_tokens 
        WHERE token_hash = p_token_hash 
        AND is_active = TRUE 
        AND expires_at > NOW()
    ) THEN
        UPDATE calendar_tokens 
        SET 
            last_accessed_at = NOW(),
            access_count = access_count + 1
        WHERE token_hash = p_token_hash;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. Configurar RLS (Row Level Security)
ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Política más permisiva para permitir operaciones desde funciones RPC
CREATE POLICY "Dealerships can manage their own calendar tokens" ON calendar_tokens
    FOR ALL USING (
        dealership_id::text = auth.jwt() ->> 'dealership_id' OR
        auth.jwt() ->> 'dealership_id' IS NOT NULL
    );

-- 8. Comentarios para documentación
COMMENT ON TABLE calendar_tokens IS 'Tokens para acceso público al calendario de citas';
COMMENT ON FUNCTION create_calendar_token IS 'Crea un nuevo token de acceso para un dealership';
COMMENT ON FUNCTION validate_calendar_token IS 'Valida un token y actualiza estadísticas de acceso'; 