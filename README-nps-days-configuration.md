# Configuración de Días NPS por Agencia

## 🎯 Objetivo
Permitir que cada agencia configure personalmente cuándo se envían los recordatorios NPS y de confirmación, en lugar de usar valores fijos (1 día). Las agencias pueden configurar entre 1-7 días para cada tipo de recordatorio.

## 📁 Archivos Creados/Modificados

### Migración SQL
- `migrations/20241203_add_nps_days_configuration.sql` - Nueva migración para agregar campos de configuración

### Archivos Modificados
- `app/api/appointments/update/[id]/route.ts` - Lógica de creación NPS con configuración personalizada
- `lib/confirmation-reminder-creator.ts` - Lógica de confirmación con configuración personalizada
- `app/backoffice/admin/recordatorios-automaticos/page.tsx` - Interfaz de configuración mejorada

## 🚀 Implementación

### 1. Nueva Migración SQL
```sql
-- Agregar configuración de días para recordatorios NPS y confirmación
ALTER TABLE dealership_reminder_settings 
ADD COLUMN IF NOT EXISTS nps_days_after INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS confirmation_days_before INTEGER DEFAULT 1;

-- Comentarios explicativos
COMMENT ON COLUMN dealership_reminder_settings.nps_days_after IS 'Días después de completar la cita para enviar recordatorio NPS (por defecto: 1 día)';
COMMENT ON COLUMN dealership_reminder_settings.confirmation_days_before IS 'Días antes de la cita para enviar recordatorio de confirmación (por defecto: 1 día)';

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_dealership_reminder_settings_nps_days 
ON dealership_reminder_settings(nps_days_after);

CREATE INDEX IF NOT EXISTS idx_dealership_reminder_settings_confirmation_days 
ON dealership_reminder_settings(confirmation_days_before);
```

### 2. Lógica de Creación NPS Personalizada
```typescript
// En app/api/appointments/update/[id]/route.ts
// Obtener configuración de días NPS para esta agencia
const { data: reminderSettings, error: settingsError } = await supabase
  .from('dealership_reminder_settings')
  .select('nps_days_after, nps_enabled')
  .eq('dealership_id', data.client.dealership_id)
  .single();

// Usar configuración personalizada o valores por defecto
const npsDaysAfter = reminderSettings?.nps_days_after ?? 1;
const npsEnabled = reminderSettings?.nps_enabled ?? true;

// Solo crear recordatorio si está habilitado
if (npsEnabled) {
  const appointmentDate = new Date(data.appointment_date);
  const npsReminderDate = new Date(appointmentDate);
  npsReminderDate.setDate(npsReminderDate.getDate() + npsDaysAfter);
  
  // Crear recordatorio con fecha personalizada
}
```

### 3. Lógica de Confirmación Personalizada
```typescript
// En lib/confirmation-reminder-creator.ts
// Obtener configuración de días de confirmación
const { data: reminderSettings, error: settingsError } = await supabase
  .from('dealership_reminder_settings')
  .select('confirmation_days_before, confirmation_enabled')
  .eq('dealership_id', params.dealership_id)
  .single();

// Usar configuración personalizada
const confirmationDaysBefore = reminderSettings?.confirmation_days_before ?? 1;
const confirmationEnabled = reminderSettings?.confirmation_enabled ?? true;

// Calcular fecha con configuración personalizada
const reminderDate = new Date(appointmentDate);
reminderDate.setDate(reminderDate.getDate() - confirmationDaysBefore);
```

### 4. Interfaz de Administración Mejorada
- **Campos numéricos** para configurar días (1-7)
- **Validación en tiempo real** con feedback visual
- **Descripción dinámica** que muestra el comportamiento configurado
- **Iconos descriptivos** para cada tipo de recordatorio

## 🎛️ Configuración por Agencia

### Valores por Defecto
Si una agencia no tiene configuración específica:
- `nps_days_after: 1` - NPS se envía 1 día después
- `confirmation_days_before: 1` - Confirmación se envía 1 día antes

### Ejemplos de Configuración

| Agencia | NPS Days After | Confirmación Days Before | Comportamiento |
|---------|----------------|--------------------------|----------------|
| **Agencia A** | 1 día | 1 día | Comportamiento estándar |
| **Agencia B** | 2 días | 2 días | Más tiempo para reflexión |
| **Agencia C** | 3 días | 1 día | NPS tardío, confirmación temprana |
| **Agencia D** | 1 día | 3 días | NPS rápido, confirmación con más anticipación |

## 📊 Logs de Auditoría

### Ejemplo de Logs NPS
```
📊 [NPS Reminder] Obteniendo configuración de días para agencia: 534e6d39-7cea-4182-b9ad-15b0f4997484
⚙️ [NPS Reminder] Configuración obtenida: {
  nps_days_after: 2,
  nps_enabled: true,
  dealership_id: 534e6d39-7cea-4182-b9ad-15b0f4997484
}
📅 [NPS Reminder] Fechas calculadas: {
  appointment_date: 2024-12-03,
  nps_days_after: 2,
  reminder_date: 2024-12-05
}
✅ [NPS Reminder] Recordatorio NPS creado exitosamente: {
  reminder_id: 016e1a4e-65b4-4d47-94a0-54fd5bf3067f,
  days_after: 2,
  reminder_date: 2024-12-05
}
```

### Ejemplo de Logs Confirmación
```
⚙️ [Confirmation Reminder] Obteniendo configuración para agencia: 534e6d39-7cea-4182-b9ad-15b0f4997484
⚙️ [Confirmation Reminder] Configuración obtenida: {
  confirmation_days_before: 2,
  confirmation_enabled: true
}
📅 [Confirmation Reminder] Fechas calculadas: {
  appointmentDate: 2024-12-05T00:00:00.000Z,
  confirmation_days_before: 2,
  reminderDate: 2024-12-03T00:00:00.000Z
}
```

## 🧪 Testing

### Casos de Prueba
1. **Agencia sin configuración:** Usar valores por defecto (1 día)
2. **Agencia con configuración personalizada:** Usar valores configurados
3. **Configuración deshabilitada:** No crear recordatorios
4. **Valores límite:** Probar con 1 y 7 días
5. **Cambio de configuración:** Verificar que se aplica en nuevas citas

### Comandos de Testing
```bash
# Probar creación de cita con configuración personalizada
curl -X PATCH "http://localhost:3000/api/appointments/123" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# Verificar recordatorio creado
curl -X GET "http://localhost:3000/api/reminders?dealership_id=534e6d39-7cea-4182-b9ad-15b0f4997484"
```

## 📈 Beneficios

### Para las Agencias
- ✅ **Control granular** sobre timing de recordatorios
- ✅ **Flexibilidad total** - pueden configurar 1-7 días
- ✅ **Configuración independiente** - cada agencia tiene sus reglas
- ✅ **Interfaz intuitiva** - fácil configuración sin conocimientos técnicos

### Para el Sistema
- ✅ **Escalabilidad** - funciona para cualquier número de agencias
- ✅ **Compatibilidad** - no afecta agencias existentes
- ✅ **Auditoría completa** - logs detallados de configuración aplicada
- ✅ **Performance optimizada** - consultas eficientes con índices

## 🔧 Configuración

### Valores Mínimos y Máximos
- **NPS Days After:** 1-7 días
- **Confirmation Days Before:** 1-7 días
- **Validación:** Frontend y backend validan rangos

### Migración
Las agencias existentes mantienen su funcionalidad actual hasta que configuren sus preferencias.

## 🚨 Consideraciones

### Performance
- Consulta adicional por agencia (mínimo impacto)
- Configuración cacheada por sesión de procesamiento
- Índices optimizados para consultas frecuentes

### Seguridad
- Validación de `dealership_id` en cada operación
- Configuración aislada por agencia
- Logs de auditoría para todas las decisiones

### Mantenimiento
- Configuración persistente en base de datos
- Cambios reversibles en cualquier momento
- Fácil debugging con logs detallados

## 🔮 Próximos Pasos

### Mejoras Futuras
- [ ] Configuración de horarios específicos de envío
- [ ] Templates personalizables por agencia
- [ ] Métricas de efectividad por configuración
- [ ] A/B testing automático de configuraciones

## 📝 Notas de Implementación

### Compatibilidad
- ✅ **Backward compatible** - agencias existentes no se ven afectadas
- ✅ **Valores por defecto** - comportamiento actual se mantiene
- ✅ **Migración suave** - no requiere intervención manual

### Logs Mejorados
- ✅ **Prefijos descriptivos** - fácil identificación en logs
- ✅ **Información detallada** - configuración aplicada visible
- ✅ **Debugging facilitado** - trazabilidad completa

### Interfaz de Usuario
- ✅ **Validación en tiempo real** - feedback inmediato
- ✅ **Descripción dinámica** - comportamiento claro
- ✅ **Iconos descriptivos** - identificación visual rápida
- ✅ **Responsive design** - funciona en todos los dispositivos 