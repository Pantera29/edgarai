# Fix: Endpoint de Availability para Multi-Taller

## 🎯 Objetivo
Corregir el error en el endpoint `/api/appointments/availability` cuando un concesionario tiene múltiples talleres configurados.

## 🐛 Problema Identificado
El endpoint fallaba con el error:
```
Results contain 2 rows, application/vnd.pgrst.object+json requires 1 row
```

**Causa**: Cuando un concesionario tiene múltiples talleres, ambos pueden tener horarios configurados para el mismo día. El endpoint estaba consultando `operating_hours` solo por `dealership_id` y `day_of_week`, lo que retornaba múltiples registros.

## 🔧 Solución Implementada

### Archivos Modificados
- `app/api/appointments/availability/route.ts`

### Cambios Realizados

#### 1. Filtrado de Horarios por Workshop ID
```typescript
// ANTES: Solo filtraba por dealership_id
let scheduleQuery = supabase
  .from('operating_hours')
  .select('*')
  .eq('day_of_week', dayOfWeek)
  .eq('dealership_id', dealershipId);

// DESPUÉS: Filtra por dealership_id Y workshop_id específico
let scheduleQuery = supabase
  .from('operating_hours')
  .select('*')
  .eq('day_of_week', dayOfWeek)
  .eq('dealership_id', dealershipId)
  .eq('workshop_id', finalWorkshopId);
```

#### 2. Filtrado de Citas por Workshop ID
```typescript
// ANTES: Solo filtraba por dealership_id
const { data: appointments, error: appointmentsError } = await supabase
  .from('appointment')
  .select(`...`)
  .eq('appointment_date', date)
  .eq('dealership_id', dealershipId);

// DESPUÉS: Filtra por dealership_id Y workshop_id específico
const { data: appointments, error: appointmentsError } = await supabase
  .from('appointment')
  .select(`...`)
  .eq('appointment_date', date)
  .eq('dealership_id', dealershipId)
  .eq('workshop_id', finalWorkshopId);
```

#### 3. Logging Mejorado
Se agregó logging adicional para incluir el `workshop_id` en las consultas:
```typescript
console.log('🔍 Consultando horario específico:', {
  dayOfWeek,
  dealershipId,
  workshopId: finalWorkshopId, // ← NUEVO
  query: {
    day_of_week: dayOfWeek,
    dealership_id: dealershipId,
    workshop_id: finalWorkshopId, // ← NUEVO
    // ...
  }
});
```

## 🧪 Testing

### Caso de Prueba
- **Concesionario**: `6fa78291-c16a-4c78-9fe2-9e3695d24d48`
- **Talleres**: 2 talleres configurados
- **Fecha**: 2025-07-05 (sábado)
- **Servicio**: `c42b5775-bad7-43cf-aff0-38143a0831fd`

### Resultado Esperado
- ✅ El endpoint debe retornar disponibilidad específica del taller seleccionado
- ✅ No debe fallar con error de múltiples registros
- ✅ Las citas deben filtrarse por taller específico

## 📈 Impacto

### Beneficios
1. **Compatibilidad Multi-Taller**: El endpoint ahora funciona correctamente con concesionarios que tienen múltiples talleres
2. **Precisión**: La disponibilidad se calcula específicamente para el taller seleccionado
3. **Aislamiento**: Las citas de un taller no interfieren con la disponibilidad de otro taller

### Consideraciones
- Las fechas bloqueadas siguen siendo a nivel de concesionario (no por taller)
- El `workshop_id` se resuelve automáticamente si no se proporciona
- Se mantiene la compatibilidad con concesionarios de un solo taller

## 🔍 Verificación

Para verificar que el fix funciona:

1. **Probar con múltiples talleres**:
   ```bash
   curl "https://www.edgarai.com.mx/api/appointments/availability?date=2025-07-05&service_id=c42b5775-bad7-43cf-aff0-38143a0831fd&dealership_id=6fa78291-c16a-4c78-9fe2-9e3695d24d48"
   ```

2. **Verificar logs**: Los logs deben mostrar el `workshop_id` específico usado en las consultas

3. **Confirmar respuesta**: El endpoint debe retornar disponibilidad sin errores

## 📝 Notas Técnicas

- **Workshop Resolution**: Se usa la función `resolveWorkshopId()` para determinar el taller correcto
- **Fallback**: Si no se especifica `workshop_id`, se usa el taller principal
- **Consistencia**: Se mantiene la misma lógica de resolución que otros endpoints 