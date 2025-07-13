# Restricciones de Horario por Tipo de Servicio

## 🎯 Objetivo
Implementar restricciones de horario específicas por tipo de servicio, permitiendo que ciertos servicios solo puedan agendarse en horarios determinados. Por ejemplo, el servicio de diagnóstico solo entre las 11:30 y 12:00.

## 📁 Archivos Creados/Modificados

### Base de Datos
- **Migración**: `migrations/20241202_add_service_time_restrictions.sql`
  - Agregó campos `time_restriction_enabled`, `time_restriction_start_time`, `time_restriction_end_time` a la tabla `services`

### Tipos TypeScript
- **Modificado**: `types/database.types.ts`
  - Actualizada la interfaz `Database.public.Tables.services` para incluir los nuevos campos de restricción

### API
- **Modificado**: `app/api/appointments/availability/route.ts`
  - Actualizada la consulta para obtener las restricciones del servicio
  - Agregada validación de restricciones en la función `generateTimeSlots`
  - Aplicada validación tanto para slots regulares como custom

### Interfaz de Usuario
- **Modificado**: `app/backoffice/servicios/page.tsx`
  - Agregada interfaz `Servicio` con campos de restricción
  - Nueva columna "Restricciones de Horario" en la tabla de servicios
  - Función helper `getTimeRestrictionDisplay()` para mostrar restricciones
  - Sección de configuración de restricciones en formularios de creación y edición
  - Validaciones en `handleSubmit` y `handleUpdate`

## 🚀 Implementación

### Configuración de Restricciones
1. **Habilitar restricciones**: Switch para activar/desactivar restricciones por servicio
2. **Definir horario**: Campos de hora de inicio y fin (formato HH:mm)
3. **Validación**: El horario de inicio debe ser anterior al de fin
4. **Aplicación**: Las restricciones se aplican todos los días de la semana

### Validación en Disponibilidad
- **Endpoint**: `/api/appointments/availability`
- **Proceso**: 
  1. Obtiene las restricciones del servicio solicitado
  2. Para cada slot disponible, verifica si está dentro del rango permitido
  3. Descarta slots que no cumplan las restricciones
  4. Aplica validación tanto a slots regulares como custom

### Interfaz de Usuario
- **Tabla de servicios**: Nueva columna que muestra las restricciones activas
- **Formulario de creación**: Sección expandible para configurar restricciones
- **Formulario de edición**: Misma funcionalidad para servicios existentes
- **Indicadores visuales**: Badge rojo para servicios con restricciones activas

## 🧪 Testing

### Casos de Prueba
1. **Servicio sin restricciones**: Debe mostrar todos los slots disponibles
2. **Servicio con restricciones**: Solo debe mostrar slots dentro del rango configurado
3. **Validación de horarios**: Debe rechazar horarios de inicio >= fin
4. **Persistencia**: Las restricciones deben guardarse y cargarse correctamente

### Ejemplo de Uso
```typescript
// Configurar servicio de diagnóstico
{
  service_name: "Diagnóstico",
  time_restriction_enabled: true,
  time_restriction_start_time: "11:30:00",
  time_restriction_end_time: "12:00:00"
}

// Resultado: Solo slots entre 11:30 y 12:00 estarán disponibles
```

## 📈 Impacto

### Beneficios
- **Control granular**: Permite restringir horarios específicos por tipo de servicio
- **Flexibilidad**: Cada servicio puede tener sus propias restricciones
- **Simplicidad**: No requiere configuración por día, se aplica todos los días
- **Integración**: Funciona con el sistema existente de disponibilidad

### Consideraciones
- **Compatibilidad**: No afecta servicios existentes (restricciones deshabilitadas por defecto)
- **Performance**: Validación eficiente en el endpoint de disponibilidad
- **UX**: Interfaz intuitiva con validaciones en tiempo real

## 🔧 Configuración

### Campos de Base de Datos
```sql
ALTER TABLE services 
ADD COLUMN time_restriction_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN time_restriction_start_time TIME,
ADD COLUMN time_restriction_end_time TIME;
```

### Validaciones
- `time_restriction_start_time` debe ser anterior a `time_restriction_end_time`
- Ambos campos son requeridos si `time_restriction_enabled` es `true`
- Formato de hora: `HH:mm:ss` (ej: "11:30:00")

### Logs de Debugging
El sistema incluye logs detallados para debugging:
```typescript
console.log('Slot descartado por restricción de horario:', {
  slot: slot.time,
  serviceName: service.service_name,
  restrictionStart: service.time_restriction_start_time,
  restrictionEnd: service.time_restriction_end_time
});
```

## 🚀 Próximos Pasos
- Considerar restricciones por día específico si es necesario
- Agregar validaciones adicionales (ej: duración mínima del rango)
- Implementar notificaciones cuando no hay slots disponibles por restricciones 