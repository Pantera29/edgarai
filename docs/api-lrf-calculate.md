# docs/api-lrf-calculate.md

## Endpoint Details

### 🎯 Objetivo
Calcular y actualizar los scores LRF (Length, Recency, Frequency) para clientes de talleres, segmentarlos automáticamente y auditar cambios críticos de segmento. Soporta recálculo diario, semanal y mensual, procesamiento por dealership y modo dry-run.

### 📁 Archivos Creados/Modificados
- `app/api/lrf/calculate/route.ts`: Lógica principal del endpoint
- `docs/api-lrf-calculate.md`: Esta documentación

### 🚀 Implementación
- **Método:** GET
- **Ruta:** `/api/lrf/calculate`
- **Query Params:**
  - `type` (obligatorio): `recency_update` | `frequency_full` | `full_recalculation`
  - `dealership_id` (opcional): UUID del dealership a procesar
  - `dry_run` (opcional): `true` para simular sin escribir en DB

#### Tipos de cálculo:
- `recency_update`: Solo recalcula Recency (diario)
- `frequency_full`: Recalcula Frequency + Recency (semanal)
- `full_recalculation`: Recalcula Length + Frequency + Recency (mensual)

#### Lógica:
- Procesa clientes en batches de 1000
- Calcula scores L, R, F y segmento según fórmulas del dominio
- Upsert en `client_lrf_scores` con auditoría de cambios de segmento
- Logging detallado en consola (emojis, español)
- Manejo de errores por cliente (no detiene el batch)
- Respuesta estructurada con resumen de segmentos

### 🧪 Testing
- Llamar el endpoint con diferentes tipos y dealership_id
- Usar `dry_run=true` para simular sin afectar la base
- Revisar logs en consola para seguimiento de procesamiento y errores

#### Ejemplos de uso:
```bash
# Recálculo diario de recency
gcurl "/api/lrf/calculate?type=recency_update"

# Recálculo semanal de frequency para dealership específico
gcurl "/api/lrf/calculate?type=frequency_full&dealership_id=uuid-123"

# Recálculo mensual completo (simulación)
gcurl "/api/lrf/calculate?type=full_recalculation&dry_run=true"
```

### 📈 Impacto
- Segmentación automática y auditable de clientes
- Permite alertas y campañas basadas en cambios críticos de segmento
- Optimiza retención y reactivación de clientes

### Request/Response Examples

#### Request
```
GET /api/lrf/calculate?type=full_recalculation&dealership_id=uuid-123
```

#### Response
```json
{
  "success": true,
  "type": "full_recalculation",
  "dealership_id": "uuid-123",
  "processed_clients": 1200,
  "segments_changed": 87,
  "processing_time_ms": 1543,
  "summary": {
    "champions": 34,
    "loyal_customers": 210,
    "potential_loyalists": 320,
    "at_risk": 90,
    "cannot_lose": 12,
    "new_customers": 45,
    "lost_customers": 489
  }
}
```

### Authentication Requirements
- El endpoint asume uso interno/admin. Si se expone públicamente, agregar validación de token JWT y permisos.

### Error Handling
- Responde 400 si falta o es inválido el parámetro `type`
- Responde 500 ante errores internos
- Los errores por cliente se loguean pero no detienen el procesamiento

### Consideraciones
- Si la tabla `client_lrf_scores` no existe, crearla según el esquema documentado
- El endpoint es idempotente y seguro para ejecuciones periódicas
- Se recomienda ejecutar fuera de horario pico para grandes volúmenes 