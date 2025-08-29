# Endpoints de Cron para Activación/Desactivación de Agentes AI ✅ MIGRADOS

## Descripción General

Se han implementado dos endpoints de cron para gestionar automáticamente la activación y desactivación de agentes AI basándose en las citas de los clientes. Esto resuelve el problema de conflictos cuando tanto el agente AI como los mecánicos responden al mismo número de WhatsApp.

**✅ ESTADO ACTUAL:** Ambos endpoints han sido migrados para usar el nuevo sistema centralizado `/api/agent-control` y la tabla `phone_agent_settings`.

## Endpoints Implementados

### 1. Reactivar Agentes - `/api/cron/reactivate-agents` ✅ MIGRADO

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
- **NUEVO:** Para cada cliente encontrado, llama al endpoint `POST /api/agent-control` con `{ agent_active: true }`
- Genera logs detallados de cada operación
- Retorna resumen con cantidad procesada y resultados

### 2. Desactivar Agentes - `/api/cron/deactivate-agents` ✅ MIGRADO

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
- **NUEVO:** Para cada cliente encontrado, llama al endpoint `POST /api/agent-control` con `{ agent_active: false }`
- Genera logs detallados de cada operación
- Retorna resumen con cantidad procesada y resultados

## 🔄 Cambios en la Migración

### Antes (Legacy):
```typescript
// Actualizaba directamente client.agent_active
const { data, error } = await supabase
  .from('client')
  .update({ agent_active: true })
  .eq('id', client_id);
```

### Después (Migrado):
```typescript
// Usa el endpoint centralizado /api/agent-control
const response = await fetch('/api/agent-control', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: client_id,
    agent_active: true,
    notes: 'Reactivado automáticamente por cron job',
    updated_by: 'cron_reactivate'
  })
});
```

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

## 🎉 Beneficios de la Migración

### Centralización
- **Fuente única de verdad:** Todos los cambios pasan por `/api/agent-control`
- **Consistencia:** Mismo formato para todas las operaciones de `agent_active`
- **Auditoría:** Tracking completo de cambios con notas y `updated_by`

### Trazabilidad
- **Notas automáticas:** Cada operación incluye contexto ("Reactivado automáticamente por cron job")
- **Usuario tracking:** Se registra `cron_reactivate` o `cron_deactivate` como `updated_by`
- **Timestamps:** Fechas exactas de cada cambio

### Robustez
- **Validación centralizada:** Todas las validaciones están en `/api/agent-control`
- **Manejo de errores:** Consistente en todas las operaciones
- **Fallback:** Mantiene compatibilidad con `client.agent_active` si es necesario

## 📊 Logging Mejorado

Los cron jobs ahora incluyen logs más detallados sobre la migración:

```typescript
console.log('🔄 [CRON-REACTIVATE] Iniciando reactivación de agentes...');
console.log('📊 [CRON-REACTIVATE] Procesando cliente:', client_id);
console.log('✅ [CRON-REACTIVATE] Agente reactivado via /api/agent-control');
console.log('❌ [CRON-REACTIVATE] Error reactivando agente:', error);
```

## 🚀 Estado Actual

**✅ MIGRACIÓN COMPLETADA:** Los cron jobs están completamente migrados y funcionando con el nuevo sistema centralizado. Todos los cambios de `agent_active` ahora se registran en `phone_agent_settings` con trazabilidad completa.
