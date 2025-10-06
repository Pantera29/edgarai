# Control de Recordatorios Automáticos por Agencia

## 🎯 Objetivo
Permitir que cada agencia controle qué tipos de recordatorios automáticos se envían, sin afectar el cron job global. Las agencias pueden activar o desactivar independientemente los recordatorios de confirmación, seguimiento y NPS.

## 📁 Archivos Creados/Modificados

### Archivos Creados
- `app/backoffice/admin/recordatorios-automaticos/page.tsx` - Nueva página de configuración de recordatorios
- `README-reminder-settings-control.md` - Este archivo de documentación

### Archivos Modificados
- `app/api/reminders/process/route.ts` - Agregada verificación de configuración por agencia
- `app/backoffice/admin/layout.tsx` - Agregado enlace de navegación para la nueva sección

### Base de Datos
- `dealership_reminder_settings` - Nueva tabla para almacenar configuración por agencia

## 🚀 Implementación

### 1. Nueva Tabla de Configuración
```sql
CREATE TABLE dealership_reminder_settings (
  dealership_id UUID PRIMARY KEY REFERENCES dealerships(id),
  confirmation_enabled BOOLEAN DEFAULT true,
  follow_up_enabled BOOLEAN DEFAULT true,
  nps_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Endpoint Inteligente
El endpoint `/api/reminders/process` ahora verifica la configuración de cada agencia antes de procesar recordatorios:

```typescript
// Para cada agencia, verificar configuración
const { data: settings } = await supabase
  .from('dealership_reminder_settings')
  .select('confirmation_enabled, follow_up_enabled, nps_enabled')
  .eq('dealership_id', agencyId)
  .single();

// Solo procesar si está habilitado
const isEnabled = settings?.[`${reminderType}_enabled`] ?? true;
if (isEnabled) {
  // Procesar recordatorio
} else {
  // Omitir recordatorio
}
```

### 3. Interfaz de Administración
Nueva sección en `/backoffice/admin/recordatorios-automaticos` con:
- Switches para activar/desactivar cada tipo de recordatorio
- Carga automática de configuración existente
- Guardado con feedback visual
- Texto descriptivo para cada tipo

## 🎛️ Tipos de Recordatorios Controlados

### Confirmación de Cita
- **Cuándo se crea:** Al crear una cita futura
- **Cuándo se envía:** 1 día antes de la cita
- **Configuración:** `confirmation_enabled`

### Seguimiento Post-Servicio
- **Cuándo se crea:** Al completar una cita
- **Cuándo se envía:** X meses después (configurable en `automatic_reminder_rules`, por defecto 6 meses)
- **Configuración:** `follow_up_enabled`

### Encuesta de Satisfacción (NPS)
- **Cuándo se crea:** Al completar una cita
- **Cuándo se envía:** 1 día después de completar el servicio
- **Configuración:** `nps_enabled`

## 🔄 Flujo de Procesamiento

### Antes (Sin Control)
1. Cron ejecuta `/api/reminders/process`
2. Procesa TODOS los recordatorios pendientes
3. Envía sin verificar preferencias de agencia

### Después (Con Control)
1. Cron ejecuta `/api/reminders/process`
2. Para cada agencia con recordatorios pendientes:
   - Consulta configuración en `dealership_reminder_settings`
   - Solo procesa recordatorios de tipos habilitados
   - Omite recordatorios de tipos deshabilitados
3. Logs detallados de decisiones tomadas

## 📊 Logs de Auditoría

### Ejemplo de Logs
```
⚙️ [Reminder Process] Verificando configuración para agencia: 534e6d39-7cea-4182-b9ad-15b0f4997484
⚙️ [Reminder Process] Configuración para agencia 534e6d39-7cea-4182-b9ad-15b0f4997484: {
  confirmation_enabled: false,
  follow_up_enabled: true,
  nps_enabled: true
}
🚫 [Reminder Process] Recordatorio omitido para agencia 534e6d39-7cea-4182-b9ad-15b0f4997484:
   ID: 016e1a4e-65b4-4d47-94a0-54fd5bf3067f
   Tipo: confirmation
   🚫 Deshabilitado: false
   📝 Razón: confirmation deshabilitado para esta agencia
```

## 🧪 Testing

### Casos de Prueba
1. **Agencia con todo habilitado:** Todos los recordatorios se procesan
2. **Agencia con tipos deshabilitados:** Solo se procesan los habilitados
3. **Agencia sin configuración:** Se usan valores por defecto (todos habilitados)
4. **Cambio de configuración:** Los cambios se aplican en la próxima ejecución

### Comandos de Testing
```bash
# Probar endpoint sin filtros
curl -X POST "http://localhost:3000/api/reminders/process"

# Probar con filtros específicos
curl -X POST "http://localhost:3000/api/reminders/process?dealership_id=534e6d39-7cea-4182-b9ad-15b0f4997484&reminder_type=confirmation"
```

## 📈 Beneficios

### Para Agencias
- ✅ **Control granular** sobre tipos de recordatorios
- ✅ **Flexibilidad** para adaptar a sus necesidades
- ✅ **Cambios inmediatos** sin afectar otras agencias
- ✅ **Interfaz intuitiva** para gestión

### Para el Sistema
- ✅ **Escalabilidad** - Funciona para 1 o 1000 agencias
- ✅ **Mantenibilidad** - Un solo cron job para todos
- ✅ **Auditoría completa** - Logs detallados de decisiones
- ✅ **Compatibilidad** - No afecta funcionalidad existente

## 🔧 Configuración

### Valores por Defecto
Si una agencia no tiene configuración en `dealership_reminder_settings`:
- `confirmation_enabled: true`
- `follow_up_enabled: true`
- `nps_enabled: true`

### Migración
Las agencias existentes mantienen su funcionalidad actual hasta que configuren sus preferencias.

## 🚨 Consideraciones

### Performance
- Consulta adicional por agencia (mínimo impacto)
- Configuración cacheada por sesión de procesamiento
- No afecta recordatorios ya creados

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
- [ ] Métricas de uso por tipo de recordatorio
- [ ] Configuración de horarios de envío
- [ ] Templates personalizables por agencia
- [ ] Reportes de efectividad por tipo

### Monitoreo
- [ ] Dashboard de configuración global
- [ ] Alertas de agencias sin configuración
- [ ] Métricas de adopción por agencia

---

## 📞 Soporte

### Troubleshooting
1. **Recordatorios no se envían:** Verificar configuración en `/backoffice/admin/recordatorios-automaticos`
2. **Configuración no se guarda:** Verificar permisos de base de datos
3. **Logs confusos:** Revisar configuración de agencia específica

### Logs Clave
- `⚙️ [Reminder Process] Verificando configuración` - Inicio de verificación
- `🚫 [Reminder Process] Recordatorio omitido` - Recordatorio deshabilitado
- `📤 [Reminder Process] Recordatorio a enviar` - Recordatorio habilitado 