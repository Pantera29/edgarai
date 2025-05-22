-- Crear tabla automatic_reminder_rules
CREATE TABLE IF NOT EXISTS automatic_reminder_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealership_id UUID NOT NULL REFERENCES dealerships(id),
    months_after INTEGER NOT NULL DEFAULT 6,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dealership_id)
);

-- Crear índice para búsquedas por dealership_id
CREATE INDEX IF NOT EXISTS idx_automatic_reminder_rules_dealership_id 
ON automatic_reminder_rules(dealership_id);

-- Comentarios
COMMENT ON TABLE automatic_reminder_rules IS 'Reglas para la creación automática de recordatorios de mantenimiento';
COMMENT ON COLUMN automatic_reminder_rules.rule_id IS 'Identificador único de la regla';
COMMENT ON COLUMN automatic_reminder_rules.dealership_id IS 'ID del concesionario al que pertenece la regla';
COMMENT ON COLUMN automatic_reminder_rules.months_after IS 'Número de meses después de la cita para crear el recordatorio';
COMMENT ON COLUMN automatic_reminder_rules.is_active IS 'Indica si la regla está activa';
COMMENT ON COLUMN automatic_reminder_rules.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN automatic_reminder_rules.updated_at IS 'Fecha de última actualización del registro'; 