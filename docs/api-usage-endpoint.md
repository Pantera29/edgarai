# Endpoint de Uso Mensual de Conversaciones

## Descripción
Este endpoint calcula el uso mensual de conversaciones por agencia, combinando datos de llamadas telefónicas (`chat_conversations`) y conversaciones de WhatsApp (`historial_chat`).

## Endpoint
```
GET /api/dealerships/usage
```

## Parámetros de Consulta

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `dealership_id` | UUID | No* | ID directo de la agencia | `123e4567-e89b-12d3-a456-426614174000` |
| `dealership_phone` | String | No* | Número de teléfono de la agencia | `+525512345678` |
| `phone_number` | String | No* | Alias para `dealership_phone` (compatibilidad) | `+525512345678` |
| `months` | Integer | No | Número de meses a consultar (default: 12) | `6` |
| `start_date` | ISO Date | No | Fecha de inicio específica | `2024-01-01T00:00:00Z` |

*Al menos uno de `dealership_id`, `dealership_phone` o `phone_number` debe ser proporcionado.

## Respuesta

### Estructura de Respuesta Exitosa
```json
{
  "dealership_id": "123e4567-e89b-12d3-a456-426614174000",
  "usage_data": [
    {
      "period": "2024-12",
      "unique_conversations": 150,
      "phone_users": 80,
      "whatsapp_users": 70
    },
    {
      "period": "2024-11",
      "unique_conversations": 142,
      "phone_users": 75,
      "whatsapp_users": 67
    }
  ],
  "query_params": {
    "start_date": "2024-01-01T00:00:00.000Z",
    "months": 12
  }
}
```

### Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `dealership_id` | UUID | ID de la agencia consultada |
| `usage_data` | Array | Array de datos mensuales |
| `usage_data[].period` | String | Período en formato YYYY-MM |
| `usage_data[].unique_conversations` | Number | Total de conversaciones únicas (sin duplicados) |
| `usage_data[].phone_users` | Number | Usuarios únicos por llamadas telefónicas |
| `usage_data[].whatsapp_users` | Number | Usuarios únicos por WhatsApp |
| `query_params` | Object | Parámetros utilizados en la consulta |

## Lógica de Cálculo

### Fuentes de Datos
1. **Llamadas Telefónicas** (`chat_conversations`)
   - Filtro: `channel = 'phone'`
   - Filtro de calidad: `duration_seconds >= 30`
   - Campo: `user_identifier` (formato: +52XXXXXXXXXX)

2. **WhatsApp** (`historial_chat`)
   - Campo: `chat_id` (formato: XXXXXXXXXX)
   - Múltiples mensajes por usuario

### Normalización de Números
- Se extraen solo los dígitos del número de teléfono
- Se toman los últimos 10 dígitos
- Se eliminan duplicados por mes

### Filtros de Calidad
- **Llamadas**: Solo se cuentan llamadas de 30 segundos o más
- **WhatsApp**: Se cuentan todos los usuarios únicos

## Ejemplos de Uso

### Consulta Básica (12 meses)
```bash
GET /api/dealerships/usage?dealership_phone=+525512345678
```

### Consulta con Período Específico
```bash
GET /api/dealerships/usage?dealership_id=123e4567-e89b-12d3-a456-426614174000&months=6
```

### Consulta con Fecha de Inicio
```bash
GET /api/dealerships/usage?dealership_phone=+525512345678&start_date=2024-06-01T00:00:00Z&months=3
```

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `400` | No se pudo determinar el ID de la agencia |
| `500` | Error interno del servidor |

## Optimizaciones

### Índices de Base de Datos
El endpoint utiliza índices optimizados:
- `idx_chat_conversations_dealership_channel_duration`
- `idx_historial_chat_dealership_created`
- `idx_chat_conversations_user_identifier`
- `idx_historial_chat_chat_id`

### Función RPC
Se utiliza una función RPC (`get_monthly_conversation_usage`) para optimizar el rendimiento de la consulta.

## Migración de Base de Datos

Para habilitar la función RPC, ejecutar:
```sql
-- Archivo: migrations/20241201_create_monthly_usage_function.sql
```

## Notas Técnicas

- El endpoint maneja automáticamente la conversión de formatos de teléfono
- Se implementa un fallback a query directa si la función RPC no está disponible
- Los logs detallados facilitan el debugging
- Compatible con el patrón de autenticación existente 