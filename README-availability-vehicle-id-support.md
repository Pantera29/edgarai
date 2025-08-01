# Soporte para vehicle_id en Endpoint de Disponibilidad

## 🎯 Objetivo
Agregar soporte para obtener automáticamente los datos del vehículo (make y model) cuando se proporciona un `vehicle_id` en el endpoint de disponibilidad de citas, manteniendo la compatibilidad con el método actual de enviar `vehicle_make` y `vehicle_model` directamente.

## 📁 Archivos Modificados
- `app/api/appointments/availability/route.ts` - Agregada lógica para obtener datos del vehículo desde vehicle_id

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
1. Si se envían `vehicle_make` y `vehicle_model` → Se usan directamente
2. Si se envía `vehicle_id` y faltan make/model → Se obtienen desde la base de datos
3. Si se envían ambos → Se priorizan los parámetros directos

## 🔧 Implementación Técnica

### Flujo de Verificación de Modelo
```typescript
// 1. Obtener parámetros
const vehicleMake = searchParams.get('vehicle_make');
const vehicleModel = searchParams.get('vehicle_model');
const vehicleId = searchParams.get('vehicle_id');

// 2. Resolver datos del vehículo si es necesario
let finalVehicleMake = vehicleMake;
let finalVehicleModel = vehicleModel;

if (vehicleId && (!vehicleMake || !vehicleModel)) {
  // Consultar base de datos para obtener make y model
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('make, model')
    .eq('id_uuid', vehicleId)
    .single();
    
  finalVehicleMake = vehicle.make;
  finalVehicleModel = vehicle.model;
}

// 3. Verificar bloqueos por modelo
if (finalVehicleMake && finalVehicleModel) {
  // Lógica de verificación de bloqueos...
}
```

### Manejo de Errores
- **Vehicle no encontrado**: Retorna 404 con mensaje descriptivo
- **Error de base de datos**: Retorna 500 con detalles del error
- **Datos faltantes**: Continúa sin verificar bloqueos por modelo

## 🧪 Casos de Uso

### Caso 1: Cliente con vehículo registrado
```typescript
// El cliente ya tiene un vehículo en el sistema
const response = await fetch('/api/appointments/availability?date=2024-01-15&service_id=123&dealership_id=456&vehicle_id=789');
```

### Caso 2: Cliente nuevo sin vehículo registrado
```typescript
// El cliente ingresa los datos del vehículo manualmente
const response = await fetch('/api/appointments/availability?date=2024-01-15&service_id=123&dealership_id=456&vehicle_make=Toyota&vehicle_model=Corolla');
```

### Caso 3: Verificación de disponibilidad desde backoffice
```typescript
// El administrador puede usar cualquiera de los dos métodos
const response = await fetch('/api/appointments/availability?date=2024-01-15&service_id=123&dealership_id=456&vehicle_id=789');
```

## 📊 Logging Mejorado

### Logs de Debugging
```typescript
// Cuando se obtienen datos desde vehicle_id
console.log('🔍 Obteniendo datos del vehículo desde vehicle_id:', vehicleId);
console.log('✅ Datos del vehículo obtenidos:', { vehicleId, make, model });

// En la verificación de bloqueos
console.log('🔄 Verificando bloqueos por modelo:', {
  make: finalVehicleMake,
  model: finalVehicleModel,
  source: vehicleId ? 'vehicle_id' : 'direct_params'
});
```

## 🔒 Seguridad y Validación

### Validaciones Implementadas
1. **Existencia del vehículo**: Verifica que el vehicle_id existe en la base de datos
2. **Datos completos**: Asegura que se obtengan make y model válidos
3. **Compatibilidad**: Mantiene funcionamiento con parámetros directos

### Respuestas de Error
```json
{
  "message": "Vehicle not found or error fetching vehicle details",
  "status": 404
}
```

## 📈 Beneficios

1. **Flexibilidad**: Permite usar el endpoint con o sin vehículo registrado
2. **Eficiencia**: Reduce la necesidad de hacer múltiples llamadas para obtener datos del vehículo
3. **Compatibilidad**: No rompe funcionalidad existente
4. **UX Mejorada**: Simplifica el flujo para clientes con vehículos registrados

## 🧪 Testing

### Escenarios de Prueba
1. **Vehicle ID válido**: Debe obtener make/model correctamente
2. **Vehicle ID inválido**: Debe retornar error 404
3. **Parámetros directos**: Debe funcionar como antes
4. **Ambos métodos**: Debe priorizar parámetros directos
5. **Sin datos de vehículo**: Debe continuar sin verificar bloqueos

### Datos de Prueba
```typescript
// Vehicle ID de prueba
const testVehicleId = "550e8400-e29b-41d4-a716-446655440000";

// Parámetros de prueba
const testParams = {
  date: "2024-01-15",
  service_id: "test-service-id",
  dealership_id: "test-dealership-id",
  vehicle_id: testVehicleId
};
```

## 🔄 Compatibilidad con APIs Existentes

Esta mejora es **100% compatible** con:
- Endpoints de creación de citas
- Endpoints de actualización de citas
- Sistema de recordatorios
- Dashboard de administración
- Widgets de calendario

No se requieren cambios en otros componentes del sistema. 