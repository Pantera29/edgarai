-- Migración para corregir el enum reminder_status
-- Cambiar 'canceled' por 'cancelled' para mantener consistencia con el código

-- Paso 1: Agregar el nuevo valor 'cancelled' al enum
ALTER TYPE reminder_status ADD VALUE 'cancelled';

-- Paso 2: Actualizar todos los registros existentes que usen 'canceled' a 'cancelled'
UPDATE reminders 
SET status = 'cancelled'::reminder_status 
WHERE status = 'canceled';

-- Paso 3: Eliminar el valor 'canceled' del enum (esto requiere recrear el enum)
-- Primero, crear un nuevo enum con los valores correctos
CREATE TYPE reminder_status_new AS ENUM ('pending', 'sent', 'completed', 'cancelled');

-- Actualizar la columna para usar el nuevo enum
ALTER TABLE reminders 
  ALTER COLUMN status TYPE reminder_status_new 
  USING status::text::reminder_status_new;

-- Eliminar el enum antiguo
DROP TYPE reminder_status;

-- Renombrar el nuevo enum
ALTER TYPE reminder_status_new RENAME TO reminder_status;

-- Comentarios
COMMENT ON TYPE reminder_status IS 'Estados posibles para recordatorios: pending, sent, completed, cancelled'; 