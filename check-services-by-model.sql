-- Consulta para verificar servicios específicos por modelo en una agencia
-- Reemplaza '6fa78291-c16a-4c78-9fe2-9e3695d24d48' con el dealership_id que quieres consultar

-- 1. Verificar que el dealership existe
SELECT 
  id,
  name,
  phone
FROM dealerships 
WHERE id = '6fa78291-c16a-4c78-9fe2-9e3695d24d48';

-- 2. Contar servicios específicos por modelo para este dealership
SELECT 
  ss.model_id,
  vm.name as model_name,
  COUNT(*) as total_services,
  COUNT(CASE WHEN ss.is_active = true THEN 1 END) as active_services,
  COUNT(CASE WHEN ss.is_active = false THEN 1 END) as inactive_services,
  MIN(ss.kilometers) as min_kilometers,
  MAX(ss.kilometers) as max_kilometers,
  MIN(ss.months) as min_months,
  MAX(ss.months) as max_months
FROM specific_services ss
LEFT JOIN vehicle_models vm ON ss.model_id = vm.id
WHERE ss.dealership_id = '6fa78291-c16a-4c78-9fe2-9e3695d24d48'
GROUP BY ss.model_id, vm.name
ORDER BY vm.name;

-- 3. Ver todos los servicios específicos para este dealership (detallado)
SELECT 
  ss.id,
  ss.service_name,
  ss.kilometers,
  ss.months,
  ss.price,
  ss.is_active,
  ss.created_at,
  vm.name as model_name,
  vm.id as model_id
FROM specific_services ss
LEFT JOIN vehicle_models vm ON ss.model_id = vm.id
WHERE ss.dealership_id = '6fa78291-c16a-4c78-9fe2-9e3695d24d48'
ORDER BY vm.name, ss.kilometers, ss.months;

-- 4. Verificar si hay servicios específicos para el modelo que estás buscando
SELECT 
  ss.id,
  ss.service_name,
  ss.kilometers,
  ss.months,
  ss.price,
  ss.is_active,
  ss.dealership_id,
  vm.name as model_name
FROM specific_services ss
LEFT JOIN vehicle_models vm ON ss.model_id = vm.id
WHERE ss.model_id = '8c0da18d-3756-45ee-ae8e-99a550901b35'
ORDER BY ss.kilometers, ss.months;

-- 5. Verificar si hay servicios específicos para este modelo en CUALQUIER dealership
SELECT 
  ss.id,
  ss.service_name,
  ss.kilometers,
  ss.months,
  ss.price,
  ss.is_active,
  ss.dealership_id,
  d.name as dealership_name,
  vm.name as model_name
FROM specific_services ss
LEFT JOIN vehicle_models vm ON ss.model_id = vm.id
LEFT JOIN dealerships d ON ss.dealership_id = d.id
WHERE ss.model_id = '8c0da18d-3756-45ee-ae8e-99a550901b35'
ORDER BY ss.kilometers, ss.months; 