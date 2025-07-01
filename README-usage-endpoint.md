# Endpoint de Uso Mensual de Conversaciones

## 🎯 Objetivo
Este endpoint calcula el uso mensual de conversaciones por agencia, combinando datos de llamadas telefónicas y WhatsApp para proporcionar métricas de uso únicas por mes.

## 📁 Archivos Creados

### 1. Endpoint Principal
- **`app/api/dealerships/usage/route.ts`** - Endpoint API principal

### 2. Migración de Base de Datos
- **`migrations/20241201_create_monthly_usage_function.sql`** - Función RPC y índices optimizados

### 3. Documentación
- **`docs/api-usage-endpoint.md`** - Documentación completa del API
- **`examples/usage-endpoint-example.js`** - Ejemplos de uso
- **`README-usage-endpoint.md`** - Este archivo

## 🚀 Instalación

### 1. Ejecutar Migración SQL
```bash
# Conectar a tu base de datos PostgreSQL y ejecutar:
psql -d tu_base_de_datos -f migrations/20241201_create_monthly_usage_function.sql
```

### 2. Verificar Configuración
Asegúrate de que las variables de entorno estén configuradas:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

## 📊 Uso del Endpoint

### URL Base
```
GET /api/dealerships/usage
```

### Parámetros
| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `dealership_id` | UUID | ID directo de la agencia | `123e4567-e89b-12d3-a456-426614174000` |
| `dealership_phone` | String | Número de teléfono de la agencia | `+525512345678` |
| `months` | Integer | Número de meses (default: 12) | `6` |
| `start_date` | ISO Date | Fecha de inicio específica | `2024-01-01T00:00:00Z` |

### Ejemplos de Uso

#### Consulta Básica
```bash
curl "http://localhost:3000/api/dealerships/usage?dealership_phone=+525512345678"
```

#### Consulta con Período Específico
```bash
curl "http://localhost:3000/api/dealerships/usage?dealership_id=123e4567-e89b-12d3-a456-426614174000&months=6"
```

#### Consulta con Fecha de Inicio
```bash
curl "http://localhost:3000/api/dealerships/usage?dealership_phone=+525512345678&start_date=2024-06-01T00:00:00Z&months=3"
```

### Respuesta de Ejemplo
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

## 🔧 Lógica de Cálculo

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

## ⚡ Optimizaciones

### Índices de Base de Datos
El endpoint utiliza índices optimizados para mejorar el rendimiento:
- `idx_chat_conversations_dealership_channel_duration`
- `idx_historial_chat_dealership_created`
- `idx_chat_conversations_user_identifier`
- `idx_historial_chat_chat_id`

### Función RPC
Se utiliza una función RPC (`get_monthly_conversation_usage`) para optimizar el rendimiento de la consulta.

### Fallback
Si la función RPC no está disponible, el endpoint utiliza una query directa como fallback.

## 🧪 Testing

### Probar el Endpoint
```bash
# Usando curl
curl "http://localhost:3000/api/dealerships/usage?dealership_phone=+525512345678&months=3"

# Usando el ejemplo JavaScript
node examples/usage-endpoint-example.js
```

### Verificar Logs
El endpoint incluye logs detallados para facilitar el debugging:
```
📊 Obteniendo uso mensual de conversaciones: {...}
🔍 Determinando ID de agencia...
✅ ID de agencia determinado: ...
📅 Parámetros de consulta: {...}
✅ Uso mensual obtenido exitosamente: {...}
```

## 🔒 Seguridad

- El endpoint utiliza autenticación de Supabase
- Validación de parámetros de entrada
- Manejo seguro de errores
- Logs sin información sensible

## 📈 Métricas Disponibles

- **`unique_conversations`**: Total de conversaciones únicas (sin duplicados)
- **`phone_users`**: Usuarios únicos por llamadas telefónicas
- **`whatsapp_users`**: Usuarios únicos por WhatsApp

## 🐛 Troubleshooting

### Error: "Could not determine dealership ID"
- Verifica que el `dealership_phone` o `dealership_id` sea correcto
- Asegúrate de que la agencia exista en la base de datos

### Error: "Error executing usage query"
- Verifica que la función RPC esté instalada
- Revisa los logs del servidor para más detalles

### Rendimiento Lento
- Verifica que los índices estén creados
- Considera reducir el número de meses consultados
- Revisa el plan de ejecución de la query

## 📞 Soporte

Para problemas o preguntas sobre este endpoint:
1. Revisa los logs del servidor
2. Verifica la documentación en `docs/api-usage-endpoint.md`
3. Consulta los ejemplos en `examples/usage-endpoint-example.js` 