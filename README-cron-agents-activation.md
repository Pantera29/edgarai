# Endpoints de Cron para Activación/Desactivación de Agentes AI

## Descripción General

Se han implementado dos endpoints de cron para gestionar automáticamente la activación y desactivación de agentes AI basándose en las citas de los clientes. Esto resuelve el problema de conflictos cuando tanto el agente AI como los mecánicos responden al mismo número de WhatsApp.

## Endpoints Implementados

### 1. Reactivar Agentes - `/api/cron/reactivate-agents`

**Propósito:** Reactiva agentes AI para clientes que tuvieron citas ayer (cualquier status).

**Método:** `POST`

**Ejecución:** Todos los días a las 7:55 AM

**Body (opcional):**
```json
{
  "dealership_id": "uuid-del-dealership"
}
```

**Lógica:**
- Busca todos los clientes que tuvieron citas ayer (fecha = ayer, cualquier status)
- Si se proporciona `dealership_id`: filtra solo clientes de ese dealership
- Si NO se proporciona `dealership_id`: procesa clientes de todos los dealerships
- Para cada cliente encontrado, llama al endpoint `PATCH /api/customers/update/{client_id}` con `{ agent_active: true }`
- Genera logs detallados de cada operación
- Retorna resumen con cantidad procesada y resultados

### 2. Desactivar Agentes - `/api/cron/deactivate-agents`

**Propósito:** Desactiva agentes AI para clientes que tienen citas hoy (solo status 'pending' o 'confirmed').

**Método:** `POST`

**Ejecución:** Todos los días a las 8:00 AM

**Body (opcional):**
```json
{
  "dealership_id": "uuid-del-dealership"
}
```

**Lógica:**
- Busca clientes que tienen citas HOY con status 'pending' o 'confirmed'
- Si se proporciona `dealership_id`: filtra solo clientes de ese dealership
- Si NO se proporciona `dealership_id`: procesa clientes de todos los dealerships
- Para cada cliente encontrado, llama al endpoint `PATCH /api/customers/update/{client_id}` con `{ agent_active: false }`
- Genera logs detallados de cada operación
- Retorna resumen con cantidad procesada y resultados

## Estructura de Respuesta

Ambos endpoints retornan la misma estructura de respuesta:

```json
{
  "success": true,
  "message": "Agentes reactivados/desactivados exitosamente",
  "dealership_id": "uuid-dealership", // null si se procesaron todos
  "processed_count": 15,
  "success_count": 14,
  "error_count": 1,
  "timestamp": "2025-01-13T07:55:00Z",
  "duration_ms": 2500,
  "dealerships_affected": ["uuid1", "uuid2"], // array de dealerships procesados
  "details": [
    { 
      "client_id": "uuid", 
      "dealership_id": "uuid", 
      "success": true 
    },
    { 
      "client_id": "uuid", 
      "dealership_id": "uuid", 
      "success": false, 
      "error": "mensaje de error" 
    }
  ]
}
```

## Configuración de Cron Jobs

### Para dealership específico:
```bash
# Reactivar agentes a las 7:55 AM
55 7 * * * curl -X POST https://tu-dominio.com/api/cron/reactivate-agents \
  -H "Content-Type: application/json" \
  -d '{"dealership_id":"uuid-dealership"}'

# Desactivar agentes a las 8:00 AM
0 8 * * * curl -X POST https://tu-dominio.com/api/cron/deactivate-agents \
  -H "Content-Type: application/json" \
  -d '{"dealership_id":"uuid-dealership"}'
```

### Para todos los dealerships:
```bash
# Reactivar agentes a las 7:55 AM
55 7 * * * curl -X POST https://tu-dominio.com/api/cron/reactivate-agents

# Desactivar agentes a las 8:00 AM
0 8 * * * curl -X POST https://tu-dominio.com/api/cron/deactivate-agents
```

## Características Técnicas

### Validaciones
- **Formato UUID:** Valida que el `dealership_id` sea un UUID válido si se proporciona
- **Fechas:** Calcula automáticamente las fechas en zona horaria de Ciudad de México (ayer para reactivación, hoy para desactivación)
- **Status:** Filtra por status específicos según el caso

### Manejo de Errores
- **Continuidad:** Si falla un cliente, continúa con los demás
- **Logs detallados:** Cada operación se registra con emojis y timestamps
- **Timeout:** Maneja timeouts en las llamadas al endpoint de update
- **Idempotencia:** Los endpoints pueden ejecutarse múltiples veces sin problemas

### Performance
- **Clientes únicos:** Procesa cada cliente solo una vez, incluso si tiene múltiples citas el mismo día
- **Batch processing:** Procesa clientes secuencialmente para evitar sobrecarga
- **Duración:** Mide y reporta el tiempo de ejecución

### Logs y Debugging
Los endpoints generan logs detallados con emojis para fácil identificación:

```
🚀 [CRON-REACTIVATE] Iniciando reactivación de agentes AI
🏢 [CRON-REACTIVATE] Procesando dealership específico: abc123
📅 [CRON-REACTIVATE] Buscando citas del: 2025-01-12
📊 [CRON-REACTIVATE] Procesando 15 clientes únicos
🔄 [CRON-REACTIVATE] Procesando cliente: uuid123 (Juan Pérez)
✅ [CRON-REACTIVATE] Cliente uuid123 reactivado exitosamente
🎯 [CRON-REACTIVATE] Proceso completado: 15 procesados, 14 exitosos, 1 error
```

## Casos Edge Considerados

1. **Cliente con múltiples citas:** Se procesa solo una vez por día
2. **Citas canceladas:** Se incluyen en la reactivación (cualquier status)
3. **Clientes inexistentes:** Se maneja el error y continúa con los demás
4. **Endpoint de update falla:** Se registra el error y continúa
5. **Dealership_id inválido:** Se valida el formato antes de procesar
6. **Dealership sin clientes:** Retorna respuesta exitosa con 0 procesados

## Integración con Sistema Existente

- **Reutiliza endpoint existente:** Usa `PATCH /api/customers/update/{client_id}` para actualizar `agent_active`
- **Mantiene consistencia:** Sigue los mismos patrones de logging y manejo de errores
- **No duplica lógica:** Aprovecha la validación y lógica existente del endpoint de update

## Monitoreo y Alertas

Los endpoints están diseñados para ser monitoreados fácilmente:

- **Logs estructurados:** Fáciles de filtrar y analizar
- **Métricas detalladas:** Cantidad procesada, exitosos, errores
- **Timestamps:** Para tracking de ejecución
- **Duración:** Para monitoreo de performance

## Pruebas

Para probar los endpoints manualmente:

```bash
# Probar reactivación
curl -X POST http://localhost:3000/api/cron/reactivate-agents \
  -H "Content-Type: application/json" \
  -d '{"dealership_id":"tu-uuid-dealership"}'

# Probar desactivación
curl -X POST http://localhost:3000/api/cron/deactivate-agents \
  -H "Content-Type: application/json" \
  -d '{"dealership_id":"tu-uuid-dealership"}'
```

## Archivos Creados

- `app/api/cron/reactivate-agents/route.ts` - Endpoint de reactivación
- `app/api/cron/deactivate-agents/route.ts` - Endpoint de desactivación
- `README-cron-agents-activation.md` - Esta documentación
