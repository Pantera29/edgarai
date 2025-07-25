# Horarios de Recepción Específicos por Día

## 🎯 Objetivo
Permitir configurar horarios de recepción específicos para cada día de la semana, en lugar de usar un horario global. Esto permite configuraciones más flexibles como "sábado solo hasta las 10:00 AM".

## 📁 Archivos Creados/Modificados

### Base de Datos
- **`migrations/20241203_add_reception_end_time_to_operating_hours.sql`** - Nueva migración

### Backend
- **`app/api/appointments/availability/route.ts`** - Actualizada lógica de validación

### Frontend
- **`app/backoffice/admin/configuracion/page.tsx`** - Interfaz de configuración actualizada
- **`types/workshop.ts`** - Tipos TypeScript actualizados

### Documentación
- **`README-daily-reception-hours.md`** - Este archivo

## 🚀 Implementación

### 1. Migración de Base de Datos
```sql
-- Agregar columna reception_end_time con valor por defecto 12:00 PM
ALTER TABLE operating_hours 
ADD COLUMN reception_end_time TIME DEFAULT '12:00:00' NOT NULL;

-- Comentario explicativo
COMMENT ON COLUMN operating_hours.reception_end_time IS 'Horario límite de recepción específico para este día (12:00 PM por defecto)';

-- Índice para optimizar consultas
CREATE INDEX idx_operating_hours_reception_time 
ON operating_hours(dealership_id, workshop_id, day_of_week, reception_end_time);
```

### 2. Lógica de Validación Actualizada
El endpoint `/api/appointments/availability` ahora usa el `reception_end_time` específico del día:

```typescript
// ANTES: Usaba configuración global
dealershipConfig?.reception_end_time

// DESPUÉS: Usa configuración específica por día
schedule.reception_end_time
```

### 3. Interfaz de Configuración
Nueva sección en la configuración de horarios que permite establecer el horario de recepción por día:

```typescript
// Campo agregado en cada día
<div className="flex items-center gap-2">
  <Label className="text-sm text-gray-600">Recepción hasta:</Label>
  <Input
    type="time"
    value={schedule.reception_end_time ? schedule.reception_end_time.slice(0, 5) : ''}
    onChange={(e) => 
      updateSchedule(index, { 
        reception_end_time: e.target.value ? e.target.value + ':00' : null 
      })
    }
    disabled={!isEditing}
    className="w-32"
  />
</div>
```

## 📋 Ejemplos de Configuración

### Configuración Típica de Taller
```sql
-- Lunes a Viernes: Recepción hasta 6:00 PM
UPDATE operating_hours 
SET reception_end_time = '18:00:00'
WHERE day_of_week IN (2,3,4,5,6);

-- Sábado: Recepción hasta 10:00 AM
UPDATE operating_hours 
SET reception_end_time = '10:00:00'
WHERE day_of_week = 7;

-- Domingo: Sin recepción (is_working_day = false)
UPDATE operating_hours 
SET is_working_day = false, reception_end_time = NULL
WHERE day_of_week = 1;
```

### Configuración Multi-Workshop
```sql
-- Taller Principal: Recepción hasta 6:00 PM todos los días
UPDATE operating_hours 
SET reception_end_time = '18:00:00'
WHERE workshop_id = 'workshop_principal_id';

-- Taller Norte: Recepción hasta 5:00 PM (cierra más temprano)
UPDATE operating_hours 
SET reception_end_time = '17:00:00'
WHERE workshop_id = 'workshop_norte_id';
```

## 🧪 Testing

### Casos de Prueba
1. **Configuración por defecto**: Verificar que nuevos horarios tengan 12:00 PM
2. **Configuración específica**: Probar sábado con recepción hasta 10:00 AM
3. **Multi-workshop**: Verificar que cada taller tenga su propia configuración
4. **Compatibilidad**: Confirmar que horarios existentes sigan funcionando

### Ejemplo de Prueba
```typescript
// Configurar sábado con recepción hasta 10:00 AM
const saturdaySchedule = {
  day_of_week: 7,
  opening_time: '09:00:00',
  closing_time: '18:00:00',
  reception_end_time: '10:00:00',
  is_working_day: true
};

// Verificar que solo se muestren slots hasta las 10:00 AM
const availableSlots = await getAvailability('2024-12-07', 'service_id');
// Debe retornar slots solo hasta 10:00 AM
```

## 📈 Beneficios

### Flexibilidad
- **Configuración granular**: Cada día puede tener su propio horario de recepción
- **Multi-workshop**: Cada taller puede tener configuraciones independientes
- **Escalabilidad**: Fácil agregar más configuraciones específicas por día

### Simplicidad
- **Interfaz intuitiva**: Campo de tiempo en la configuración de horarios
- **Valor por defecto**: 12:00 PM es un horario razonable para la mayoría de talleres
- **Compatibilidad**: No rompe configuraciones existentes

### Performance
- **Una sola consulta**: No necesita JOINs adicionales
- **Índices optimizados**: Consultas rápidas por día y taller
- **Caché eficiente**: Datos cohesivos en una sola tabla

## 🔧 Configuración Avanzada

### Validaciones Implementadas
```typescript
// Asegurar que reception_end_time <= closing_time
if (schedule.reception_end_time && schedule.reception_end_time > schedule.closing_time) {
  throw new Error('El horario de recepción no puede ser después del cierre');
}

// Validar formato de tiempo
if (schedule.reception_end_time && !/^\d{2}:\d{2}:\d{2}$/.test(schedule.reception_end_time)) {
  throw new Error('Formato de tiempo inválido');
}
```

### Casos Especiales
- **Días no laborables**: `reception_end_time` se ignora si `is_working_day = false`
- **Sin restricción**: Si `reception_end_time = NULL`, no hay límite de recepción
- **Horario de cierre**: Si `reception_end_time > closing_time`, se usa `closing_time`

## 🚨 Consideraciones

### Migración
- **No destructiva**: Solo agrega campo con valor por defecto
- **Rollback fácil**: Se puede revertir eliminando la columna
- **Compatibilidad**: Funciona con datos existentes

### Performance
- **Índice agregado**: Consultas optimizadas por día y taller
- **Sin impacto**: No afecta performance de consultas existentes

### Seguridad
- **Validación**: Horarios se validan en frontend y backend
- **Sanitización**: Inputs de tiempo se validan antes de guardar

## 📊 Métricas de Éxito

### Objetivos
- **Flexibilidad**: 100% de talleres pueden configurar horarios específicos por día
- **Performance**: Sin degradación en consultas de disponibilidad
- **Usabilidad**: Interfaz intuitiva para configurar horarios

### KPIs
- **Tiempo de configuración**: < 2 minutos para configurar horarios por día
- **Errores de validación**: < 1% de configuraciones inválidas
- **Adopción**: > 80% de talleres usando configuraciones específicas por día

---

## 🎉 Resultado Final

El sistema ahora permite configuraciones de horarios de recepción muy flexibles:

- **Sábado hasta 10:00 AM** ✅
- **Lunes a Viernes hasta 6:00 PM** ✅  
- **Domingo cerrado** ✅
- **Configuraciones por taller** ✅
- **Interfaz intuitiva** ✅

La implementación es **segura**, **escalable** y **compatible** con el sistema existente. 