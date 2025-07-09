# Cron de Expiración de Recordatorios

## 🎯 Objetivo
Crear un sistema automático que expire recordatorios pendientes que ya pasaron su fecha programada, marcándolos como `'cancelled'` para mantener la base de datos limpia y evitar confusiones.

## 📁 Archivos Creados/Modificados

### Archivos Creados
- `app/api/reminders/expire/route.ts` - Nuevo endpoint para expirar recordatorios vencidos
- `README-reminders-expiration-cron.md` - Este archivo de documentación

## 🚀 Implementación

### Endpoint de Expiración
El endpoint `/api/reminders/expire` realiza las siguientes operaciones:

1. **Búsqueda de recordatorios vencidos**: Encuentra todos los recordatorios con:
   - `status = 'pending'`
   - `reminder_date < today`

2. **Actualización masiva**: Marca todos los recordatorios vencidos como `'cancelled'`

3. **Logs detallados**: Proporciona información completa del proceso por agencia

### Lógica de Procesamiento
```typescript
// Buscar recordatorios pendientes vencidos
const { data: expiredReminders } = await supabase
  .from('reminders')
  .select('reminder_id, reminder_date, dealership_id, reminder_type, client_id_uuid')
  .eq('status', 'pending')
  .lt('reminder_date', today)
  .order('reminder_date', { ascending: true });

// Actualizar a estado 'cancelled'
const { data: updatedReminders } = await supabase
  .from('reminders')
  .update({ 
    status: 'cancelled',
    updated_at: new Date().toISOString()
  })
  .in('reminder_id', reminderIds);
```

## ⏰ Configuración del Cron (GitHub Actions)

### Horario de Ejecución
- **Frecuencia**: Diario
- **Hora**: 10:00 AM hora de México (UTC-6)
- **Endpoint**: `POST /api/reminders/expire`
- **Plataforma**: GitHub Actions

### Configuración del Workflow
El cron se ejecuta automáticamente usando GitHub Actions en el archivo `.github/workflows/reminders-expire-cron.yml`:

```yaml
on:
  schedule:
    # Ejecutar todos los días a las 10:00 AM hora de México (UTC-6)
    # En UTC sería las 16:00 (4:00 PM)
    - cron: '0 16 * * *'
  workflow_dispatch: # Permitir ejecución manual
```

### Variables de Entorno (GitHub Secrets)
Configurar en Settings > Secrets and variables > Actions:

```env
# Dominio de la aplicación
EDGARAI_DOMAIN=https://edgarai.com.mx

# Opcional: Webhook para notificaciones
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## 📊 Respuesta del Endpoint

### Respuesta Exitosa
```json
{
  "message": "Recordatorios vencidos expirados exitosamente",
  "expired_count": 15,
  "date": "2024-01-15",
  "details": {
    "total_found": 15,
    "total_updated": 15,
    "by_dealership": 3
  }
}
```

### Respuesta Sin Recordatorios Vencidos
```json
{
  "message": "No hay recordatorios pendientes vencidos",
  "expired_count": 0,
  "date": "2024-01-15"
}
```

## 🔍 Logs de Auditoría

### Ejemplo de Logs
```
⏰ [Reminders Expire] Iniciando proceso de expiración de recordatorios
📅 [Reminders Expire] Fecha actual: 2024-01-15
🔍 [Reminders Expire] Buscando recordatorios pendientes vencidos...
📊 [Reminders Expire] Encontrados 15 recordatorios vencidos
🔄 [Reminders Expire] Actualizando recordatorios vencidos a estado "cancelled"...
📋 [Reminders Expire] Resumen por agencia:
   🏢 Agencia 534e6d39-7cea-4182-b9ad-15b0f4997484: 8 recordatorios expirados
      - ID: 016e1a4e-65b4-4d47-94a0-54fd5bf3067f, Tipo: confirmation, Fecha: 2024-01-10
      - ID: 016e1a4e-65b4-4d47-94a0-54fd5bf3068f, Tipo: follow_up, Fecha: 2024-01-12
   🏢 Agencia 634e6d39-7cea-4182-b9ad-15b0f4997485: 7 recordatorios expirados
✅ [Reminders Expire] Proceso completado exitosamente
   📊 Total recordatorios expirados: 15
   📅 Fecha de procesamiento: 2024-01-15
```

## 🧪 Testing

### Testing Manual
```bash
# Probar el endpoint manualmente
curl -X POST https://tu-dominio.com/api/reminders/expire

# O usando GET (también soportado)
curl -X GET https://tu-dominio.com/api/reminders/expire
```

### Testing con GitHub Actions
1. **Ejecución manual**: Ir a Actions > "Expirar Recordatorios Vencidos" > "Run workflow"
2. **Verificar logs**: Revisar los logs en tiempo real durante la ejecución
3. **Monitoreo**: Los resultados se muestran en la pestaña Actions de GitHub

### Casos de Prueba
1. **Sin recordatorios vencidos**: Debe retornar mensaje de "no hay recordatorios"
2. **Con recordatorios vencidos**: Debe actualizar todos a `'cancelled'`
3. **Error de base de datos**: Debe manejar errores gracefully
4. **Múltiples agencias**: Debe procesar todas las agencias correctamente

### Verificación Post-Ejecución
```sql
-- Verificar recordatorios expirados
SELECT 
  COUNT(*) as total_expired,
  dealership_id,
  reminder_type
FROM reminders 
WHERE status = 'cancelled' 
  AND updated_at >= CURRENT_DATE
GROUP BY dealership_id, reminder_type;
```

## 📈 Métricas y Monitoreo

### KPIs a Monitorear
- **Total recordatorios expirados por día**
- **Distribución por agencia**
- **Distribución por tipo de recordatorio**
- **Tiempo de ejecución del proceso**

### Alertas Recomendadas
- **Error en la ejecución**: Notificar si el endpoint falla
- **Volumen alto**: Alertar si se expiran más de X recordatorios por día
- **Tiempo de ejecución**: Alertar si toma más de 30 segundos

## 🔄 Integración con Sistema Existente

### Compatibilidad
- ✅ **Estados existentes**: Usa `'cancelled'` existente, no requiere migración
- ✅ **Arquitectura API-first**: Sigue el patrón establecido
- ✅ **Logs consistentes**: Usa el mismo formato de logs con emojis
- ✅ **Manejo de errores**: Sigue el patrón de error handling existente

### Impacto en Otros Sistemas
- **Proceso de recordatorios**: Los recordatorios `'cancelled'` no se procesan
- **Dashboard de recordatorios**: Se muestran como "Cancelados"
- **Métricas**: Se incluyen en las estadísticas de recordatorios

## 🚀 Despliegue

### Pasos de Despliegue
1. **Deploy del código**: El endpoint estará disponible inmediatamente
2. **Configurar GitHub Secrets**: Agregar `EDGARAI_DOMAIN` en Settings > Secrets and variables > Actions
3. **Verificar workflow**: El cron se ejecutará automáticamente todos los días a las 10:00 AM México
4. **Monitoreo inicial**: Verificar logs en la pestaña Actions de GitHub durante las primeras ejecuciones
5. **Testing manual**: Usar "workflow_dispatch" para ejecutar manualmente y verificar funcionamiento

### Rollback Strategy
- **Endpoint**: Simplemente deshabilitar el workflow en GitHub Actions
- **Datos**: Los recordatorios `'cancelled'` pueden ser reactivados manualmente si es necesario
- **Configuración**: Modificar el cron en `.github/workflows/reminders-expire-cron.yml` si es necesario

## 📈 Beneficios Esperados

### Inmediatos
- **Base de datos limpia**: Elimina recordatorios obsoletos
- **Mejor rendimiento**: Reduce consultas innecesarias
- **Claridad en datos**: Solo recordatorios válidos en estado `'pending'`

### A Largo Plazo
- **Automatización completa**: Sin intervención manual requerida
- **Consistencia de datos**: Estado uniforme en toda la aplicación
- **Escalabilidad**: Maneja múltiples agencias automáticamente

---

## 📝 Notas de Implementación

### Decisiones Técnicas
- **Estado usado**: `'cancelled'` en lugar de crear `'expired'` para mantener consistencia
- **Actualización masiva**: Usa `.in()` para eficiencia en lugar de actualizaciones individuales
- **Logs detallados**: Incluye información por agencia para debugging
- **Soporte GET**: Permite testing manual fácil

### Consideraciones Futuras
- **Notificaciones**: Podría enviar notificaciones a administradores sobre recordatorios expirados
- **Configuración por agencia**: Podría permitir que cada agencia configure su propia política de expiración
- **Retención de datos**: Podría implementar archivo de recordatorios muy antiguos 