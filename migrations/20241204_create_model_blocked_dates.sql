-- Migración: Sistema de Bloqueo de Calendario por Modelo de Vehículo
-- Fecha: 2024-12-04
-- Descripción: Permite bloquear citas para modelos específicos de vehículos por rangos de fechas

-- 1. Crear tabla principal
CREATE TABLE model_blocked_dates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints para validación de datos
    CONSTRAINT model_blocked_dates_date_range CHECK (end_date >= start_date),
    CONSTRAINT model_blocked_dates_make_not_empty CHECK (make != ''),
    CONSTRAINT model_blocked_dates_model_not_empty CHECK (model != ''),
    CONSTRAINT model_blocked_dates_reason_not_empty CHECK (reason != '')
);

-- 2. Crear índices para performance
CREATE INDEX idx_model_blocked_dates_dealership_id ON model_blocked_dates(dealership_id);
CREATE INDEX idx_model_blocked_dates_make_model ON model_blocked_dates(make, model);
CREATE INDEX idx_model_blocked_dates_date_range ON model_blocked_dates(start_date, end_date);
CREATE INDEX idx_model_blocked_dates_active ON model_blocked_dates(is_active);
CREATE INDEX idx_model_blocked_dates_dealership_active ON model_blocked_dates(dealership_id, is_active);

-- 3. Función para verificar si un modelo está bloqueado en una fecha específica
CREATE OR REPLACE FUNCTION is_model_blocked(
    p_dealership_id UUID,
    p_make VARCHAR(100),
    p_model VARCHAR(100),
    p_date DATE
)
RETURNS TABLE(
    is_blocked BOOLEAN,
    reason TEXT,
    block_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE as is_blocked,
        mbd.reason,
        mbd.id as block_id
    FROM model_blocked_dates mbd
    WHERE mbd.dealership_id = p_dealership_id
        AND LOWER(mbd.make) = LOWER(p_make)
        AND LOWER(mbd.model) = LOWER(p_model)
        AND mbd.is_active = TRUE
        AND p_date BETWEEN mbd.start_date AND mbd.end_date
    LIMIT 1;
    
    -- Si no se encontró bloqueo, retornar FALSE
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para obtener todos los bloqueos activos de un dealership
CREATE OR REPLACE FUNCTION get_active_model_blocks(p_dealership_id UUID)
RETURNS TABLE(
    id UUID,
    make VARCHAR(100),
    model VARCHAR(100),
    start_date DATE,
    end_date DATE,
    reason TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mbd.id,
        mbd.make,
        mbd.model,
        mbd.start_date,
        mbd.end_date,
        mbd.reason,
        mbd.is_active,
        mbd.created_at,
        mbd.updated_at
    FROM model_blocked_dates mbd
    WHERE mbd.dealership_id = p_dealership_id
        AND mbd.is_active = TRUE
        AND mbd.end_date >= CURRENT_DATE
    ORDER BY mbd.start_date ASC, mbd.make ASC, mbd.model ASC;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_model_blocked_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_model_blocked_dates_updated_at
    BEFORE UPDATE ON model_blocked_dates
    FOR EACH ROW
    EXECUTE FUNCTION update_model_blocked_dates_updated_at();

-- 6. Comentarios para documentación
COMMENT ON TABLE model_blocked_dates IS 'Bloqueos de calendario por modelo específico de vehículo';
COMMENT ON FUNCTION is_model_blocked IS 'Verifica si un modelo está bloqueado en una fecha específica';
COMMENT ON FUNCTION get_active_model_blocks IS 'Obtiene todos los bloqueos activos de un dealership'; 