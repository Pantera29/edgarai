# API Dealerships Info - Soporte Multi-Taller

## 📋 Resumen
El endpoint `/api/dealerships/info` ha sido actualizado para soportar múltiples talleres por dealership, permitiendo obtener configuración específica de cada taller.

## 🔄 Cambios Implementados

### Parámetros
- **Nuevo**: `workshop_id` (opcional) - UUID del taller específico
- **Mantenidos**: `dealership_id`, `dealership_phone`, `phone_number`

### Comportamiento
1. **Con `workshop_id`**: Retorna configuración específica del taller
2. **Sin `workshop_id`**: Usa automáticamente el taller principal (`is_primary = true`)
3. **`workshop_id` inválido**: Usa el taller principal por defecto

## 📡 Uso

### Ejemplo 1: Información del Taller Principal
```bash
GET /api/dealerships/info?dealership_id=dealership_123
```

**Respuesta**:
```json
{
  "dealership": { ... },
  "operating_hours": [ ... ],
  "configuration": {
    "dealership_id": "dealership_123",
    "workshop_id": "workshop_primary_uuid",
    "shift_duration": 30,
    "timezone": "America/Mexico_City",
    "reception_end_time": "18:00",
    "custom_morning_slots": [...]
  },
  "blocked_dates": [ ... ],
  "workshop_id": "workshop_primary_uuid"
}
```

### Ejemplo 2: Información de Taller Específico
```bash
GET /api/dealerships/info?dealership_id=dealership_123&workshop_id=workshop_2_uuid
```

**Respuesta**:
```json
{
  "dealership": { ... },
  "operating_hours": [ ... ],
  "configuration": {
    "dealership_id": "dealership_123",
    "workshop_id": "workshop_2_uuid",
    "shift_duration": 45,
    "timezone": "America/Mexico_City",
    "reception_end_time": "19:00",
    "custom_morning_slots": [...]
  },
  "blocked_dates": [ ... ],
  "workshop_id": "workshop_2_uuid"
}
```

## 🔧 Implementación Técnica

### Código Clave
```typescript
// Resolver workshop_id automáticamente
const finalWorkshopId = await resolveWorkshopId(dealershipId, workshopId);

// Consultar configuración específica del taller
const configResponse = await supabase
  .from('dealership_configuration')
  .select('*')
  .eq('dealership_id', dealershipId)
  .eq('workshop_id', finalWorkshopId)
  .maybeSingle();
```

### Logs de Debug
```
🏢 Obteniendo información de agencia: {
  explicitDealershipId: "dealership_123",
  workshopId: "workshop_2_uuid"
}
🏭 Workshop ID resuelto: {
  requested: "workshop_2_uuid",
  resolved: "workshop_2_uuid"
}
✅ Información obtenida exitosamente: {
  dealershipId: "dealership_123",
  workshopId: "workshop_2_uuid",
  hasConfiguration: true
}
```

## 🧪 Casos de Prueba

### ✅ Caso Exitoso - Taller Específico
```bash
curl "http://localhost:3000/api/dealerships/info?dealership_id=dealership_123&workshop_id=workshop_2_uuid"
```
**Resultado**: Configuración del taller 2

### ✅ Caso Exitoso - Taller Principal
```bash
curl "http://localhost:3000/api/dealerships/info?dealership_id=dealership_123"
```
**Resultado**: Configuración del taller principal

### ✅ Caso Exitoso - Taller Inválido
```bash
curl "http://localhost:3000/api/dealerships/info?dealership_id=dealership_123&workshop_id=workshop_invalid"
```
**Resultado**: Configuración del taller principal (fallback)

### ❌ Caso de Error - Dealership No Encontrado
```bash
curl "http://localhost:3000/api/dealerships/info?dealership_id=dealership_invalid"
```
**Resultado**: Error 404 - "Dealership not found"

## 📊 Estructura de Respuesta

### Campos Nuevos
- **`workshop_id`**: UUID del taller usado para la consulta

### Campos Mantenidos
- **`dealership`**: Información básica de la agencia
- **`operating_hours`**: Horarios de operación (a nivel dealership)
- **`configuration`**: Configuración específica del taller
- **`blocked_dates`**: Fechas bloqueadas (a nivel dealership)

## 🔒 Consideraciones de Seguridad

### Validaciones
1. **Taller pertenece al dealership**: Validado por `resolveWorkshopId`
2. **Dealership existe**: Verificado antes de consultar configuración
3. **Workshop válido**: Si no existe, usa el taller principal

### Acceso
- **Público**: No requiere autenticación
- **Filtrado**: Solo talleres del dealership especificado

## 🔄 Compatibilidad

### Backward Compatibility
- ✅ Funciona sin `workshop_id` (usa taller principal)
- ✅ Funciona con agencias de un solo taller
- ✅ Mantiene estructura de respuesta existente

### Migración
- **No requiere cambios** en clientes existentes
- **Opcional** agregar `workshop_id` para multi-taller
- **Automático** fallback al taller principal

## 📈 Beneficios

1. **Configuración Específica**: Cada taller puede tener diferentes horarios y configuraciones
2. **Flexibilidad**: Fácil cambiar entre talleres sin modificar código cliente
3. **Escalabilidad**: Fácil agregar nuevos talleres
4. **Compatibilidad**: No rompe implementaciones existentes

## 🚀 Próximos Pasos

1. **Frontend**: Actualizar interfaces para usar `workshop_id`
2. **Testing**: Validar con múltiples talleres
3. **Documentación**: Actualizar documentación de clientes
4. **Monitoreo**: Agregar métricas de uso por taller

---

**Estado**: ✅ Implementado y documentado
**Versión**: 1.0.0
**Compatibilidad**: ✅ Backward compatible 