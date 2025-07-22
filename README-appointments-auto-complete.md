# Cron de Auto-Completado de Citas Vencidas

## 🎯 Objetivo
Crear un sistema automático que actualice el status de las citas que están en estado `pending` o `confirmed` a `completed` si su fecha es anterior a la fecha actual, manteniendo la base de datos actualizada y reflejando el estado real de las citas.

## 📁 Archivos Creados/Modificados

### Archivos Creados
- `app/api/appointments/auto-complete/route.ts` - Endpoint para auto-completar citas vencidas
- `.github/workflows/appointments-auto-complete.yml` - Workflow de GitHub Actions
- `README-appointments-auto-complete.md` - Este archivo de documentación

## 🚀 Implementación

### Endpoint de Auto-Completado
El endpoint `/api/appointments/auto-complete` realiza las siguientes operaciones:

1. **Búsqueda de citas vencidas**: Encuentra todas las citas con:
   - `status = 'pending'` o `'confirmed'`
   - `appointment_date < today`

2. **Actualización usando endpoint existente**: Utiliza el endpoint `/api/appointments/update/[id]` para actualizar cada cita a `completed`

3. **Logs detallados**: Proporciona información completa del proceso por agencia

### Lógica de Procesamiento
```typescript
// Buscar citas vencidas
const { data: expiredAppointments } = await supabase
  .from('appointment')
  .select('id, appointment_date, status, dealership_id')
  .in('status', ['pending', 'confirmed'])
  .lt('appointment_date', today)
  .order('appointment_date', { ascending: true });

// Actualizar cada cita usando el endpoint existente
const updateUrl = `${baseUrl}/api/appointments/update/${appointment.id}`;
const response = await fetch(updateUrl, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'completed' })
});
```

## ⏰ Configuración del Cron (GitHub Actions)

### Horario de Ejecución
- **Frecuencia**: Diario
- **Hora**: 6:00 AM hora de México (UTC-6)
- **Endpoint**: `POST /api/appointments/auto-complete`
- **Plataforma**: GitHub Actions

### Configuración del Workflow
El cron se ejecuta automáticamente usando GitHub Actions en el archivo `.github/workflows/appointments-auto-complete.yml`:

```yaml
on:
  schedule:
    # Ejecutar todos los días a las 6:00 AM hora de México (UTC-6)
    # En UTC sería las 12:00 (12:00 PM)
    - cron: '0 12 * * *'
  workflow_dispatch: # Permitir ejecución manual
```

## 📊 Respuesta del Endpoint

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Proceso de auto-completado de citas finalizado",
  "completed_count": 8,
  "failed_count": 0,
  "total_processed": 8,
  "date": "2024-01-15",
  "debug": {
    "request_id": "abc123",
    "execution_time_ms": 2500,
    "by_dealership": 3
  }
}
```

### Respuesta Sin Citas Vencidas
```json
{
  "success": true,
  "message": "No hay citas vencidas para auto-completar",
  "completed_count": 0,
  "date": "2024-01-15",
  "debug": {
    "request_id": "abc123",
    "execution_time_ms": 150
  }
}
```

## 🔍 Logs de Auditoría

### Ejemplo de Logs
```
🔄 [Appointments Auto-Complete] ===== INICIO PROCESAMIENTO =====
🆔 [Appointments Auto-Complete] Request ID: abc123
⏰ [Appointments Auto-Complete] Timestamp inicio: 2024-01-15T12:00:00.000Z
🌍 [Appointments Auto-Complete] Información de zona horaria:
   UTC: 2024-01-15T12:00:00.000Z
   México: 2024-01-15T06:00:00.000Z
   Fecha México: 2024-01-15
   Zona horaria: America/Mexico_City
🔍 [Appointments Auto-Complete] Buscando citas vencidas...
📊 [Appointments Auto-Complete] Encontradas 8 citas vencidas
📋 [Appointments Auto-Complete] Resumen por agencia:
   🏢 Agencia 534e6d39-7cea-4182-b9ad-15b0f4997484: 5 citas vencidas
      - ID: abc-123-def, Fecha: 2024-01-10, Estado: pending
      - ID: abc-123-ghi, Fecha: 2024-01-12, Estado: confirmed
   🏢 Agencia 634e6d39-7cea-4182-b9ad-15b0f4997485: 3 citas vencidas
🔄 [Appointments Auto-Complete] Iniciando actualización de citas vencidas...
📤 [Appointments Auto-Complete] Actualizando cita 1/8: abc-123-def
🔗 [Appointments Auto-Complete] Llamando endpoint: https://edgarai.vercel.app/api/appointments/update/abc-123-def
✅ [Appointments Auto-Complete] Cita abc-123-def actualizada exitosamente en 450ms
📊 [Appointments Auto-Complete] Resumen final:
   ✅ Citas actualizadas exitosamente: 8
   ❌ Citas con error: 0
   ⏱️ Tiempo total de ejecución: 2500ms
```

## 🧪 Testing

### Testing Manual
```bash
# Probar el endpoint manualmente
curl -X POST https://tu-dominio.com/api/appointments/auto-complete

# O usando GET (también soportado)
curl -X GET https://tu-dominio.com/api/appointments/auto-complete
```

### Testing con GitHub Actions
1. **Ejecución manual**: Ir a Actions > "EdgarAI Appointments Auto-Complete Cron" > "Run workflow"
2. **Verificar logs**: Revisar los logs en tiempo real durante la ejecución
3. **Monitoreo**: Los resultados se muestran en la pestaña Actions de GitHub

### Casos de Prueba
1. **Sin citas vencidas**: Debe retornar mensaje de "no hay citas vencidas"
2. **Con citas vencidas**: Debe actualizar todas a `'completed'`
3. **Error en actualización**: Debe manejar errores gracefully y continuar con las demás
4. **Múltiples agencias**: Debe procesar todas las agencias correctamente

### Verificación Post-Ejecución
```sql
-- Verificar citas auto-completadas
SELECT 
  COUNT(*) as total_completed,
  dealership_id,
  appointment_date
FROM appointment 
WHERE status = 'completed' 
  AND updated_at >= CURRENT_DATE
GROUP BY dealership_id, appointment_date;
```

## 📈 Métricas y Monitoreo

### KPIs a Monitorear
- **Total citas auto-completadas por día**
- **Distribución por agencia**
- **Tiempo de ejecución del proceso**
- **Tasa de éxito vs fallos**

### Alertas Recomendadas
- **Error en la ejecución**: Notificar si el endpoint falla
- **Volumen alto**: Alertar si se completan más de X citas por día
- **Tiempo de ejecución**: Alertar si toma más de 30 segundos

## 🔄 Integración con Sistema Existente

### Compatibilidad
- ✅ **Usa endpoint existente**: Aprovecha `/api/appointments/update/[id]` existente
- ✅ **Arquitectura API-first**: Sigue el patrón establecido
- ✅ **Logs consistentes**: Usa el mismo formato de logs con emojis
- ✅ **Manejo de errores**: Sigue el patrón de error handling existente

### Impacto en Otros Sistemas
- **Proceso de recordatorios**: Las citas `'completed'` pueden generar recordatorios automáticos
- **Dashboard de citas**: Se muestran como "Completadas"
- **Métricas**: Se incluyen en las estadísticas de citas
- **Transacciones**: Se crean automáticamente al marcar como completada

## 🚀 Despliegue

### Pasos de Despliegue
1. **Deploy del código**: El endpoint estará disponible inmediatamente
2. **Verificar workflow**: El cron se ejecutará automáticamente todos los días a las 6:00 AM México
3. **Monitoreo inicial**: Verificar logs en la pestaña Actions de GitHub durante las primeras ejecuciones
4. **Testing manual**: Usar "workflow_dispatch" para ejecutar manualmente y verificar funcionamiento

### Rollback Strategy
- **Endpoint**: Simplemente deshabilitar el workflow en GitHub Actions
- **Datos**: Las citas `'completed'` pueden ser revertidas manualmente si es necesario
- **Configuración**: Modificar el cron en `.github/workflows/appointments-auto-complete.yml` si es necesario

## 📈 Beneficios Esperados

### Inmediatos
- **Base de datos actualizada**: Refleja el estado real de las citas
- **Mejor rendimiento**: Reduce consultas de citas obsoletas
- **Claridad en datos**: Solo citas válidas en estado `'pending'` o `'confirmed'`

### A Largo Plazo
- **Automatización completa**: Sin intervención manual requerida
- **Consistencia de datos**: Estado uniforme en toda la aplicación
- **Escalabilidad**: Maneja múltiples agencias automáticamente

## 🎯 Beneficios Adicionales

### Automatización de Procesos
- **Recordatorios automáticos**: Las citas completadas generan recordatorios de seguimiento
- **Transacciones automáticas**: Se crean transacciones automáticamente
- **NPS automático**: Se programa encuesta de satisfacción

### Mejoras en UX
- **Dashboard preciso**: Muestra estadísticas reales de citas
- **Reportes confiables**: Datos consistentes para análisis
- **Gestión eficiente**: Reduce trabajo manual de actualización

---

## 📝 Notas de Implementación

### Decisiones Técnicas
- **Usa endpoint existente**: Aprovecha la lógica ya probada de `/api/appointments/update/[id]`
- **Actualización individual**: Procesa cada cita por separado para mejor control de errores
- **Logs detallados**: Incluye información por agencia para debugging
- **Soporte GET**: Permite testing manual fácil

### Consideraciones Futuras
- **Notificaciones**: Podría enviar notificaciones a administradores sobre citas auto-completadas
- **Configuración por agencia**: Podría permitir que cada agencia configure su propia política
- **Retención de datos**: Podría implementar archivo de citas muy antiguas 