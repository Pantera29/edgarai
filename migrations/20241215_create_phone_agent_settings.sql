-- MIGRACIÓN: Crear tabla phone_agent_settings para control centralizado de agentes AI
-- Fecha: 2024-12-15

-- Crear tabla phone_agent_settings
CREATE TABLE IF NOT EXISTS phone_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  agent_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'system',
  updated_by VARCHAR(50) DEFAULT 'system',
  
  -- Constraint único para evitar duplicados
  UNIQUE(phone_number, dealership_id)
);

-- Comentarios para la tabla y columnas
COMMENT ON TABLE phone_agent_settings IS 'Configuración centralizada del estado de agentes AI por teléfono y dealership';
COMMENT ON COLUMN phone_agent_settings.phone_number IS 'Número de teléfono normalizado (10 dígitos)';
COMMENT ON COLUMN phone_agent_settings.dealership_id IS 'ID del dealership asociado';
COMMENT ON COLUMN phone_agent_settings.agent_active IS 'Estado del agente AI (true=activo, false=inactivo)';
COMMENT ON COLUMN phone_agent_settings.notes IS 'Notas opcionales sobre el cambio de estado';
COMMENT ON COLUMN phone_agent_settings.created_by IS 'Quién creó el registro (ai_agent, user_id, system)';
COMMENT ON COLUMN phone_agent_settings.updated_by IS 'Quién realizó la última actualización';

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_phone_agent_settings_phone_dealership 
ON phone_agent_settings(phone_number, dealership_id);

CREATE INDEX IF NOT EXISTS idx_phone_agent_settings_dealership_active 
ON phone_agent_settings(dealership_id, agent_active);

CREATE INDEX IF NOT EXISTS idx_phone_agent_settings_updated_at 
ON phone_agent_settings(updated_at);

-- Crear función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_phone_agent_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trigger_update_phone_agent_settings_updated_at ON phone_agent_settings;
CREATE TRIGGER trigger_update_phone_agent_settings_updated_at
  BEFORE UPDATE ON phone_agent_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_agent_settings_updated_at();

-- Comentario para el trigger
COMMENT ON TRIGGER trigger_update_phone_agent_settings_updated_at ON phone_agent_settings 
IS 'Actualiza automáticamente updated_at cuando se modifica un registro';

-- Crear RLS (Row Level Security) policies
ALTER TABLE phone_agent_settings ENABLE ROW LEVEL SECURITY;

-- Policy para permitir lectura a usuarios autenticados
CREATE POLICY "Allow authenticated users to read phone_agent_settings" ON phone_agent_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy para permitir inserción/actualización a usuarios autenticados
CREATE POLICY "Allow authenticated users to insert/update phone_agent_settings" ON phone_agent_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Comentarios para las policies
COMMENT ON POLICY "Allow authenticated users to read phone_agent_settings" ON phone_agent_settings 
IS 'Permite a usuarios autenticados leer configuraciones de agentes';

COMMENT ON POLICY "Allow authenticated users to insert/update phone_agent_settings" ON phone_agent_settings 
IS 'Permite a usuarios autenticados crear y actualizar configuraciones de agentes';
