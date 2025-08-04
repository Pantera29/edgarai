# Validación de Límite Diario en Creación de Citas

## Descripción

Se implementó una validación de seguridad en el endpoint de creación de citas (`/api/appointments/create`) para verificar que no se exceda el límite diario de citas configurado para cada servicio.

## Funcionalidad

### Validación de Límite Diario

- **Ubicación**: `app/api/appointments/create/route.ts`
- **Paso**: Se ejecuta después de resolver el `dealership_id` y antes de verificar la disponibilidad de horario
- **Criterios**: Por servicio, fecha y concesionario (no por taller individual)

### Lógica de Validación

1. **Obtener límite del servicio**: Se consulta el campo `daily_limit` de la tabla `services`
2. **Contar citas existentes**: Se cuentan las citas existentes para:
   - El mismo servicio (`service_id`)
   - La misma fecha (`appointment_date`)
   - El mismo concesionario (`dealership_id`)
3. **Validar límite**: Si `citas_existentes >= daily_limit`, se rechaza la creación
4. **Permitir sin límite**: Si `daily_limit` es `null`, se permite la creación sin restricciones

### Mensajes de Error

**Caso de límite excedido**:
```json
{
  "message": "No se puede crear la cita: se alcanzó el límite diario de este servicio para el concesionario. Por favor, selecciona otra fecha o comunícate con el taller.",
  "details": {
    "serviceName": "Cambio de Aceite",
    "currentAppointments": 5,
    "dailyLimit": 5,
    "appointmentDate": "2024-01-15"
  }
}
```

**Código de estado**: `409 Conflict`

### Logs de Auditoría

La implementación incluye logs detallados para auditoría:

- **Validación iniciada**: `🔍 Validando límite diario para servicio`
- **Conteo de citas**: `📊 Conteo de citas para límite diario`
- **Límite excedido**: `❌ Límite diario excedido`
- **Validación exitosa**: `✅ Límite diario válido`
- **Sin límite configurado**: `ℹ️ Servicio sin límite diario configurado`

## Configuración

### Campo `daily_limit` en tabla `services`

- **Tipo**: `number | null`
- **Descripción**: Número máximo de citas permitidas por día para este servicio en el concesionario
- **Valor `null`**: Sin límite diario (comportamiento por defecto)

### Ejemplo de configuración

```sql
-- Servicio con límite de 5 citas por día
UPDATE services 
SET daily_limit = 5 
WHERE id_uuid = 'service-uuid-123';

-- Servicio sin límite diario
UPDATE services 
SET daily_limit = NULL 
WHERE id_uuid = 'service-uuid-456';
```

## Integración con Flujo Existente

### Orden de Validaciones

1. ✅ Validar campos requeridos
2. ✅ Verificar que el cliente existe
3. ✅ Verificar que el vehículo existe y pertenece al cliente
4. ✅ Verificar que el servicio existe
5. ✅ Resolver `dealership_id`
6. ✅ Resolver `workshop_id`
7. **🆕 Validar límite diario del servicio**
8. ✅ Verificar disponibilidad de horario
9. ✅ Crear la cita
10. ✅ Crear recordatorio de confirmación
11. ✅ Enviar SMS de confirmación

### Compatibilidad

- **No afecta servicios sin límite**: Los servicios con `daily_limit = null` funcionan igual que antes
- **Mantiene validación de horario**: La validación de disponibilidad de horario sigue funcionando
- **Capa de seguridad defensiva**: Complementa la lógica principal de negocio en el endpoint de availability

## Casos de Uso

### Escenario 1: Servicio con Límite
- **Configuración**: `daily_limit = 3`
- **Citas existentes**: 2 para el mismo día
- **Resultado**: ✅ Cita creada exitosamente

### Escenario 2: Límite Alcanzado
- **Configuración**: `daily_limit = 3`
- **Citas existentes**: 3 para el mismo día
- **Resultado**: ❌ Error 409 - Límite diario excedido

### Escenario 3: Servicio Sin Límite
- **Configuración**: `daily_limit = null`
- **Citas existentes**: Cualquier cantidad
- **Resultado**: ✅ Cita creada exitosamente

## Consideraciones Técnicas

### Performance
- **Consulta optimizada**: Usa `count: 'exact', head: true` para contar eficientemente
- **Índices recomendados**: 
  ```sql
  CREATE INDEX idx_appointment_service_date_dealership 
  ON appointment(service_id, appointment_date, dealership_id);
  ```

### Seguridad
- **Validación por concesionario**: Previene que un concesionario exceda su capacidad
- **Logs de auditoría**: Registra todos los intentos de bypass del límite
- **Mensajes claros**: Información útil para usuarios y soporte técnico

### Mantenimiento
- **Configuración flexible**: Los límites se pueden ajustar sin cambios de código
- **Logs detallados**: Facilitan el debugging y monitoreo
- **Código limpio**: Separación clara de responsabilidades

## Testing

### Casos de Prueba Recomendados

1. **Crear cita con servicio sin límite**
2. **Crear cita con servicio con límite disponible**
3. **Intentar crear cita cuando se alcanza el límite**
4. **Verificar que el límite es por concesionario, no por taller**
5. **Verificar logs de auditoría**

### Ejemplo de Test

```javascript
// Test: Límite diario excedido
const response = await fetch('/api/appointments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: 'client-123',
    vehicle_id: 'vehicle-456',
    service_id: 'service-with-limit-789',
    appointment_date: '2024-01-15',
    appointment_time: '10:00'
  })
});

// Debería retornar 409 con mensaje de límite excedido
expect(response.status).toBe(409);
```

## Fecha de Implementación

**Implementado**: Enero 2025
**Archivo**: `app/api/appointments/create/route.ts`
**Versión**: 1.0.0 