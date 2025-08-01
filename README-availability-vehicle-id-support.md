# Soporte para vehicle_id en Endpoint de Disponibilidad

## 🎯 Objetivo
Agregar soporte para obtener automáticamente los datos del vehículo (make y model) cuando se proporciona un `vehicle_id` en el endpoint de disponibilidad de citas, manteniendo la compatibilidad con el método actual de enviar `vehicle_make` y `vehicle_model` directamente. **NUEVO**: Implementar comparación por `model_id` para mayor precisión.

## 📁 Archivos Modificados
- `app/api/appointments/availability/route.ts` - Agregada lógica para obtener datos del vehículo desde vehicle_id y comparación por model_id

## 🚀 Funcionalidad Implementada

### Comportamiento Actual (Mantenido)
```typescript
// Método 1: Enviar make y model directamente
GET /api/appointments/availability?date=2024-01-15&service_id=123&dealership_id=456&vehicle_make=Toyota&vehicle_model=Corolla
```

### Nuevo Comportamiento (Agregado)
```typescript
// Método 2: Enviar vehicle_id para obtener make y model automáticamente
GET /api/appointments/availability?date=2024-01-15&service_id=123&dealership_id=456&vehicle_id=789
```

### Lógica de Prioridad
1. Si se envían `vehicle_make` y `vehicle_model` → Se usan directamente (comparación por texto)
2. Si se envía `vehicle_id` y faltan make/model → Se obtienen desde la base de datos
3. Si se envían ambos → Se priorizan los parámetros directos
4. **NUEVO**: Si el vehículo tiene `model_id` → Se usa comparación por ID (más preciso)
5. **NUEVO**: Si no hay `model_id` → Se usa comparación por texto (compatibilidad)
6. **NUEVO**: Si no encuentra bloqueo por `model_id` → **FALLBACK** a comparación por texto

## 🔧 Implementación Técnica

### Flujo de Verificación de Modelo Mejorado
```typescript
// 1. Obtener parámetros
const vehicleMake = searchParams.get('vehicle_make');
const vehicleModel = searchParams.get('vehicle_model');
const vehicleId = searchParams.get('vehicle_id');

// 2. Resolver datos del vehículo si es necesario
let finalVehicleMake = vehicleMake;
let finalVehicleModel = vehicleModel;
let finalVehicleModelId = null;

if (vehicleId && (!vehicleMake || !vehicleModel)) {
  // Consultar base de datos para obtener make, model y model_id
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('make, model, model_id')
    .eq('id_uuid', vehicleId)
    .single();
    
  finalVehicleMake = vehicle.make;
  finalVehicleModel = vehicle.model;
  finalVehicleModelId = vehicle.model_id; // ← NUEVO: Obtener model_id
}

// 3. Verificar bloqueos con lógica de prioridad
if (finalVehicleModelId) {
  // 🔄 PRIORIDAD 1: Buscar por model_id (más preciso)
  const { data: modelIdBlock } = await supabase
    .from('model_blocked_dates')
    .select('*')
    .eq('model_id', finalVehicleModelId)
    // ... otros filtros

  if (modelIdBlock) {
    // Usar bloqueo encontrado por model_id
    comparisonMethod = 'model_id';
  } else {
    // 🔄 FALLBACK: Buscar por texto si no encuentra por model_id
    const { data: textBlock } = await supabase
      .from('model_blocked_dates')
      .select('*')
      .eq('make', finalVehicleMake.trim())
      .eq('model', finalVehicleModel.trim())
      // ... otros filtros
      
    if (textBlock) {
      comparisonMethod = 'text_fallback';
    }
  }
} else {
  // 🔄 PRIORIDAD 2: Solo comparar por texto (compatibilidad)
  const { data: textBlock } = await supabase
    .from('model_blocked_dates')
    .select('*')
    .eq('make', finalVehicleMake.trim())
    .eq('model', finalVehicleModel.trim())
    // ... otros filtros
}
```

### Ventajas de la Comparación por model_id
- **🎯 Precisión absoluta**: No hay ambigüedades de texto
- **⚡ Performance**: Comparación de UUIDs es más rápida
- **🛡️ Integridad**: Garantiza que el modelo existe en vehicle_models
- **🔄 Normalización**: Un modelo = un ID único

### Manejo de Errores
- **Vehicle no encontrado**: Retorna 404 con mensaje descriptivo
- **Error de base de datos**: Retorna 500 con detalles del error
- **Datos faltantes**: Continúa sin verificar bloqueos por modelo
- **Model_id no disponible**: Fallback automático a comparación por texto

## 🧪 Casos de Uso

### Caso 1: Cliente con vehículo registrado (con model_id)
```typescript
// El cliente ya tiene un vehículo en el sistema con model_id
const response = await fetch('/api/appointments/availability?date=2024-01-15&service_id=123&dealership_id=456&vehicle_id=789');
// → Usa comparación por model_id (más preciso)
```

### Caso 2: Cliente nuevo sin vehículo registrado
```typescript
// El cliente ingresa los datos del vehículo manualmente
const response = await fetch('/api/appointments/availability?date=2024-01-15&service_id=123&dealership_id=456&vehicle_make=Toyota&vehicle_model=Corolla');
// → Usa comparación por texto (compatibilidad)
```

### Caso 3: Vehículo sin model_id configurado
```typescript
// Vehículo existe pero no tiene model_id asignado
const response = await fetch('/api/appointments/availability?date=2024-01-15&service_id=123&dealership_id=456&vehicle_id=789');
// → Fallback automático a comparación por texto
```

## 📊 Logging Mejorado

### Logs de Debugging
```typescript
// Cuando se obtienen datos desde vehicle_id
console.log('🔍 Obteniendo datos del vehículo desde vehicle_id:', vehicleId);
console.log('✅ Datos del vehículo obtenidos:', { 
  vehicleId, 
  make, 
  model, 
  modelId // ← NUEVO
});

// En la verificación de bloqueos
console.log('🔄 Verificando bloqueos por modelo:', {
  make: finalVehicleMake,
  model: finalVehicleModel,
  modelId: finalVehicleModelId, // ← NUEVO
  source: vehicleId ? 'vehicle_id' : 'direct_params',
  comparisonMethod: finalVehicleModelId ? 'model_id' : 'text' // ← NUEVO
});

// Indicador del método de comparación usado
console.log('🎯 Buscando bloqueo por model_id:', finalVehicleModelId);
console.log('✅ Bloqueo encontrado por model_id');
console.log('🔄 No se encontró bloqueo por model_id, intentando por texto...');
console.log('✅ Bloqueo encontrado por fallback de texto');
console.log('✅ No se encontró bloqueo ni por model_id ni por texto');
console.log('📝 Buscando bloqueo por texto:', { make, model });
console.log('✅ Bloqueo encontrado por texto');
console.log('✅ No se encontró bloqueo por texto');
```

## 🔒 Seguridad y Validación

### Validaciones Implementadas
1. **Existencia del vehículo**: Verifica que el vehicle_id existe en la base de datos
2. **Datos completos**: Asegura que se obtengan make y model válidos
3. **Compatibilidad**: Mantiene funcionamiento con parámetros directos
4. **Model_id válido**: Verifica que el model_id existe en vehicle_models (si está disponible)

### Respuestas de Error
```json
{
  "message": "Vehicle not found or error fetching vehicle details",
  "status": 404
}
```

### Respuestas de Bloqueo Mejoradas
```json
{
  "availableSlots": [],
  "message": "Vehicle model JAC SUNRAY is not available for service on this date: Falta de repuestos",
  "error_code": "MODEL_BLOCKED",
  "details": {
    "make": "JAC",
    "model": "SUNRAY",
    "model_id": "550e8400-e29b-41d4-a716-446655440000", // ← NUEVO
    "reason": "Falta de repuestos",
    "block_id": "block-uuid",
    "vehicle_id": "vehicle-uuid",
    "comparison_method": "model_id" // ← NUEVO
  }
}
```

### Métodos de Comparación Posibles
- **`model_id`**: Bloqueo encontrado directamente por model_id
- **`text_fallback`**: Bloqueo encontrado por fallback de texto después de no encontrar por model_id
- **`text`**: Bloqueo encontrado por texto (cuando no hay model_id disponible)

## 📈 Beneficios

1. **Flexibilidad**: Permite usar el endpoint con o sin vehículo registrado
2. **Eficiencia**: Reduce la necesidad de hacer múltiples llamadas para obtener datos del vehículo
3. **Compatibilidad**: No rompe funcionalidad existente
4. **UX Mejorada**: Simplifica el flujo para clientes con vehículos registrados
5. **🎯 Precisión**: Comparación por model_id elimina ambigüedades de texto
6. **⚡ Performance**: Comparación de UUIDs es más rápida que texto
7. **🛡️ Integridad**: Garantiza que los modelos existen en el catálogo oficial

## 🧪 Testing

### Escenarios de Prueba
1. **Vehicle ID con model_id y bloqueo por model_id**: Debe usar comparación por ID
2. **Vehicle ID con model_id pero bloqueo solo por texto**: Debe usar fallback a texto
3. **Vehicle ID sin model_id**: Debe usar comparación por texto
4. **Parámetros directos**: Debe funcionar como antes
5. **Ambos métodos**: Debe priorizar parámetros directos
6. **Sin datos de vehículo**: Debe continuar sin verificar bloqueos
7. **Model_id inválido**: Debe usar fallback a texto
8. **Sin bloqueos**: Debe retornar disponible después de verificar ambos métodos

### Datos de Prueba
```typescript
// Vehicle ID con model_id
const testVehicleWithModelId = "550e8400-e29b-41d4-a716-446655440000";

// Vehicle ID sin model_id
const testVehicleWithoutModelId = "660e8400-e29b-41d4-a716-446655440000";

// Parámetros de prueba
const testParams = {
  date: "2024-01-15",
  service_id: "test-service-id",
  dealership_id: "test-dealership-id",
  vehicle_id: testVehicleWithModelId
};
```

## 🔄 Compatibilidad con APIs Existentes

Esta mejora es **100% compatible** con:
- Endpoints de creación de citas
- Endpoints de actualización de citas
- Sistema de recordatorios
- Dashboard de administración
- Widgets de calendario
- **NUEVO**: Sistema de bloqueos por modelo con model_id

No se requieren cambios en otros componentes del sistema.

## 🎯 Métodos de Comparación

### Comparación por model_id (PRIORIDAD 1)
```sql
-- Más preciso y rápido
SELECT * FROM model_blocked_dates 
WHERE dealership_id = ? 
  AND model_id = ? 
  AND is_active = true
  AND ? BETWEEN start_date AND end_date;
```

### Comparación por texto (PRIORIDAD 2)
```sql
-- Compatibilidad con datos existentes
SELECT * FROM model_blocked_dates 
WHERE dealership_id = ? 
  AND make = ? 
  AND model = ? 
  AND is_active = true
  AND ? BETWEEN start_date AND end_date;
``` 