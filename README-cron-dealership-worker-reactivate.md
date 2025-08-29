# Endpoint de Cron para Reactivar Agentes Desactivados por Dealership Worker ✅

## 🎯 Descripción

Endpoint de cron que reactiva automáticamente agentes AI que fueron desactivados por `dealership_worker` hace más de dos días. Esto permite que el agente de AI vuelva a activarse posterior a que un humano los haya atendido.

## 📁 Archivo Creado

- **`app/api/cron/reactivate-dealership-worker-agents/route.ts`** - Endpoint principal ✅

## 🚀 Funcionalidades Implementadas

### Método POST - Reactivar Agentes

**Endpoint:** `POST /api/cron/reactivate-dealership-worker-agents`

**Body (opcional):**
```json
{
  "dealership_id": "uuid-del-dealership"
}
```

**Lógica de Procesamiento:**

1. **Búsqueda de Registros:**
   - Busca en `phone_agent_settings` registros donde:
     - `agent_active = FALSE`
     - `updated_by = 'dealership_worker'`
     - `updated_at < (hoy - 2 días)`

2. **Filtrado por Dealership:**
   - Si se proporciona `dealership_id`: procesa solo ese dealership
   - Si NO se proporciona: procesa todos los dealerships

3. **Reactivación:**
   - Para cada registro encontrado, llama a `/api/agent-control`
   - Cambia `agent_active` a `TRUE`
   - Registra nota explicativa con fecha de desactivación original
   - Marca `updated_by` como `'cron_dealership_worker_reactivate'`

## 📊 Estructura de Respuesta

```json
{
  "success": true,
  "message": "Agentes desactivados por dealership_worker reactivados exitosamente",
  "dealership_id": "uuid-dealership", // null si se procesaron todos
  "processed_count": 5,
  "success_count": 4,
  "error_count": 1,
  "timestamp": "2025-01-13T09:00:00Z",
  "duration_ms": 1500,
  "dealerships_affected": ["uuid1", "uuid2"],
  "details": [
    {
      "setting_id": "uuid",
      "phone_number": "5551234567",
      "dealership_id": "uuid",
      "success": true
    },
    {
      "setting_id": "uuid",
      "phone_number": "5551234568",
      "dealership_id": "uuid",
      "success": false,
      "error": "mensaje de error"
    }
  ]
}
```

## 🔧 Validaciones Implementadas

### Request Validation
- ✅ `dealership_id` debe ser UUID válido si se proporciona
- ✅ Manejo de errores de parsing del body
- ✅ Zona horaria de Ciudad de México para cálculos de fecha

### Database Validation
- ✅ Consulta optimizada con índices existentes
- ✅ Manejo de errores de base de datos
- ✅ Verificación de existencia de registros

### Agent Control Integration
- ✅ Usa endpoint `/api/agent-control` existente
- ✅ Mantiene consistencia con sistema centralizado
- ✅ Logging detallado de cada operación

## 📈 Logging Detallado

El endpoint incluye logging completo con emojis siguiendo el patrón del proyecto:

```typescript
console.log('🚀 [CRON-DEALERSHIP-WORKER-REACTIVATE] Iniciando reactivación...');
console.log('📅 [CRON-DEALERSHIP-WORKER-REACTIVATE] Buscando agentes desactivados antes del:', date);
console.log('📊 [CRON-DEALERSHIP-WORKER-REACTIVATE] Encontrados X agentes para reactivar');
console.log('🔄 [CRON-DEALERSHIP-WORKER-REACTIVATE] Procesando agente:', phone_number);
console.log('✅ [CRON-DEALERSHIP-WORKER-REACTIVATE] Agente reactivado exitosamente');
console.log('❌ [CRON-DEALERSHIP-WORKER-REACTIVATE] Error reactivando agente:', error);
console.log('🎉 [CRON-DEALERSHIP-WORKER-REACTIVATE] Proceso completado:', stats);
```

## 🕐 Configuración de Cron Job

### GitHub Actions Workflow (Recomendado)
```yaml
name: EdgarAI Reactivar Agentes Dealership Worker

on:
  schedule:
    # Reactivar agentes todos los días a las 9:00 AM (Ciudad de México)
    - cron: '0 15 * * *'  # UTC-6 = 9:00 AM Ciudad de México
  workflow_dispatch:

jobs:
  call-reactivate-dealership-worker-agents:
    runs-on: ubuntu-latest
    steps:
      - name: Call reactivate dealership worker agents endpoint
        run: |
          curl -v -L -X POST "https://edgarai.vercel.app/api/cron/reactivate-dealership-worker-agents/" \
            -H "Content-Type: application/json"
```

### Para Dealership Específico
```bash
# Reactivar agentes a las 9:00 AM
0 15 * * * curl -X POST https://edgarai.vercel.app/api/cron/reactivate-dealership-worker-agents \
  -H "Content-Type: application/json" \
  -d '{"dealership_id":"uuid-dealership"}'
```

### Para Todos los Dealerships
```bash
# Reactivar agentes a las 9:00 AM
0 15 * * * curl -X POST https://edgarai.vercel.app/api/cron/reactivate-dealership-worker-agents
```

## 🎯 Casos de Uso

### Escenario Típico
1. **Cliente contacta por WhatsApp** → Agente AI responde
2. **Cliente necesita atención humana** → `dealership_worker` desactiva agente
3. **Pasan más de 48 horas** → Cron job reactiva automáticamente el agente
4. **Cliente puede volver a interactuar** → Agente AI está disponible nuevamente

### Beneficios
- ✅ **Automatización completa:** No requiere intervención manual
- ✅ **Trazabilidad:** Registra quién desactivó y cuándo se reactivó
- ✅ **Flexibilidad:** Permite procesar dealership específico o todos
- ✅ **Robustez:** Manejo de errores y logging detallado
- ✅ **Consistencia:** Usa sistema centralizado de agent-control

## 🔄 Integración con Sistema Existente

### Compatibilidad
- ✅ **Usa `/api/agent-control`:** Mantiene consistencia con sistema existente
- ✅ **Tabla `phone_agent_settings`:** Fuente única de verdad
- ✅ **Logging estándar:** Sigue patrones del proyecto
- ✅ **Validaciones:** Mismas reglas que otros endpoints

### Diferencias con Otros Crons
- **`/api/cron/reactivate-agents`:** Basado en citas de ayer
- **`/api/cron/deactivate-agents`:** Basado en citas de hoy
- **`/api/cron/reactivate-dealership-worker-agents`:** Basado en intervención humana

## 🚀 Estado de Implementación

**✅ COMPLETADO:** El endpoint está listo para usar en producción.

### Próximos Pasos
1. **Crear GitHub Actions workflow** para automatización
2. **Configurar horario de ejecución** (recomendado: 9:00 AM)
3. **Monitorear logs** para verificar funcionamiento
4. **Ajustar horario** según necesidades del negocio

## 📝 Notas Técnicas

### Zona Horaria
- **Configurada:** Ciudad de México (UTC-6)
- **Cálculo:** `updated_at < (hoy - 2 días)`
- **Consideración:** Horario de verano no implementado

### Performance
- **Índices utilizados:** `idx_phone_agent_settings_updated_at`
- **Consultas optimizadas:** Filtros en orden correcto
- **Batch processing:** Procesa registros uno por uno con logging

### Seguridad
- **Validación de UUID:** Formato estricto para dealership_id
- **Manejo de errores:** No expone información sensible
- **Logging seguro:** Solo información necesaria para debugging

## 🔍 Ejemplo de Uso

### Ejecución Manual
```bash
# Para todos los dealerships
curl -X POST https://edgarai.vercel.app/api/cron/reactivate-dealership-worker-agents \
  -H "Content-Type: application/json"

# Para dealership específico
curl -X POST https://edgarai.vercel.app/api/cron/reactivate-dealership-worker-agents \
  -H "Content-Type: application/json" \
  -d '{"dealership_id":"b8ecf479-16ed-4f38-a726-cc1617a1fcbf"}'
```

### Respuesta de Ejemplo
```json
{
  "success": true,
  "message": "Agentes desactivados por dealership_worker reactivados exitosamente",
  "dealership_id": null,
  "processed_count": 3,
  "success_count": 3,
  "error_count": 0,
  "timestamp": "2025-01-13T09:00:00.123Z",
  "duration_ms": 1250,
  "dealerships_affected": ["b8ecf479-16ed-4f38-a726-cc1617a1fcbf"],
  "details": [
    {
      "setting_id": "uuid-1",
      "phone_number": "5551234567",
      "dealership_id": "b8ecf479-16ed-4f38-a726-cc1617a1fcbf",
      "success": true
    },
    {
      "setting_id": "uuid-2",
      "phone_number": "5551234568",
      "dealership_id": "b8ecf479-16ed-4f38-a726-cc1617a1fcbf",
      "success": true
    },
    {
      "setting_id": "uuid-3",
      "phone_number": "5551234569",
      "dealership_id": "b8ecf479-16ed-4f38-a726-cc1617a1fcbf",
      "success": true
    }
  ]
}
```

## 🎉 Resumen

El endpoint `/api/cron/reactivate-dealership-worker-agents` está completamente implementado y listo para usar. Proporciona:

- **Automatización completa** de reactivación de agentes
- **Trazabilidad detallada** de todas las operaciones
- **Flexibilidad** para procesar dealerships específicos o todos
- **Integración perfecta** con el sistema existente
- **Logging robusto** para monitoreo y debugging

El siguiente paso es crear el GitHub Actions workflow para automatizar la ejecución diaria.
