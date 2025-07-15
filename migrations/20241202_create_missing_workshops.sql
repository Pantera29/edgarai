-- Migración para crear workshops principales faltantes
-- Fecha: 2024-12-02
-- Descripción: Crea workshops principales para agencias existentes que no los tengan

-- Función para crear workshops principales faltantes
CREATE OR REPLACE FUNCTION create_missing_main_workshops()
RETURNS void AS $$
DECLARE
    dealership_record RECORD;
    workshop_count INTEGER;
BEGIN
    -- Iterar sobre todas las agencias activas
    FOR dealership_record IN 
        SELECT id, name, address 
        FROM dealerships 
        WHERE is_active = true
    LOOP
        -- Verificar si ya existe un workshop principal para esta agencia
        SELECT COUNT(*) INTO workshop_count
        FROM workshops 
        WHERE dealership_id = dealership_record.id AND is_main = true;
        
        -- Si no existe workshop principal, crear uno
        IF workshop_count = 0 THEN
            INSERT INTO workshops (
                name,
                dealership_id,
                is_main,
                is_active,
                address,
                created_at,
                updated_at
            ) VALUES (
                dealership_record.name || ' - Principal',
                dealership_record.id,
                true,
                true,
                dealership_record.address,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Creado workshop principal para agencia: % (ID: %)', 
                dealership_record.name, dealership_record.id;
        ELSE
            RAISE NOTICE 'Agencia % ya tiene workshop principal, saltando...', 
                dealership_record.name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migración de workshops principales completada';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la función
SELECT create_missing_main_workshops();

-- Limpiar la función después de usarla
DROP FUNCTION create_missing_main_workshops();

-- Comentarios
COMMENT ON TABLE workshops IS 'Talleres asociados a cada agencia. Cada agencia debe tener al menos un taller principal (is_main = true)';
COMMENT ON COLUMN workshops.is_main IS 'Indica si es el taller principal de la agencia. Debe haber exactamente uno por agencia';
COMMENT ON COLUMN workshops.dealership_id IS 'ID de la agencia a la que pertenece el taller'; 