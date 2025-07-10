# Corrección: Exclusión de Citas Canceladas en Cálculo de Disponibilidad

## 🎯 Objetivo
Corregir el endpoint `/api/appointments/availability` para que excluya las citas canceladas al calcular los slots disponibles, evitando que ocupen espacio en el taller cuando ya no están activas.

## 📁 Archivos Modificados
- `app/api/appointments/availability/route.ts` - Agregado filtro `.neq('status', 'cancelled')`

## 🚀 Implementación

### Problema Identificado
El endpoint de disponibilidad estaba incluyendo citas canceladas en el cálculo de slots ocupados, lo que resultaba en:
- Slots mostrados como no disponibles cuando deberían estar libres
- Reducción incorrecta de la capacidad del taller
- Experiencia de usuario degradada al mostrar menos opciones de horarios

### Solución Aplicada
Se agregó un filtro en la consulta de citas existentes para excluir aquellas con status `'cancelled'`:

```typescript
// ANTES (líneas 240-250)
const { data: appointments, error: appointmentsError } = await supabase
  .from('appointment')
  .select(`...`)
  .eq('appointment_date', date)
  .eq('dealership_id', dealershipId)
  .eq('workshop_id', finalWorkshopId);

// DESPUÉS
const { data: appointments, error: appointmentsError } = await supabase
  .from('appointment')
  .select(`...`)
  .eq('appointment_date', date)
  .eq('dealership_id', dealershipId)
  .eq('workshop_id', finalWorkshopId)
  .neq('status', 'cancelled'); // ✅ Nuevo filtro
```

### Estados de Citas Considerados
- ✅ **Incluidas en cálculo**: `pending`, `confirmed`, `in_progress`, `completed`
- ❌ **Excluidas del cálculo**: `cancelled`

## 🧪 Testing

### Casos de Prueba
1. **Cita cancelada en slot específico**: El slot debe aparecer como disponible
2. **Múltiples citas canceladas**: No deben afectar la capacidad del taller
3. **Citas activas + canceladas**: Solo las activas deben ocupar slots
4. **Límite diario por servicio**: Las canceladas no deben contar para el límite

### Verificación
```bash
# Probar endpoint con fecha que tenga citas canceladas
GET /api/appointments/availability?date=2024-01-15&service_id=xxx&dealership_id=xxx
```

## 📈 Impacto
- **Disponibilidad mejorada**: Más slots disponibles para agendar
- **Experiencia de usuario**: Opciones de horarios más precisas
- **Gestión de capacidad**: Cálculo correcto de la capacidad real del taller
- **Sin regresiones**: No afecta el comportamiento de citas activas

## 🔍 Logs de Debugging
El endpoint mantiene los logs existentes que ahora mostrarán:
- Citas encontradas (excluyendo canceladas)
- Cálculo correcto de capacidad
- Slots disponibles más precisos

## 📋 Notas Técnicas
- **Compatibilidad**: Cambio no breaking, solo mejora la precisión
- **Performance**: Filtro adicional mínimo impacto en rendimiento
- **RLS**: Respeta las políticas de seguridad existentes
- **Multi-workshop**: Funciona correctamente con la arquitectura multi-taller 