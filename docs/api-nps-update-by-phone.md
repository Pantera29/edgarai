# API NPS Update by Phone

## 🎯 Objetivo
Endpoint para actualizar encuestas NPS pendientes usando el número de teléfono del cliente, específicamente diseñado para integración con WhatsApp.

## 📍 Endpoint
```
PATCH /api/nps/update-by-phone
```

## 📋 Parámetros del Body (JSON)

### Requeridos
- `phone_number` (string): Número de teléfono del cliente
- `score` (number): Puntuación NPS (0-10)

### Opcionales
- `comments` (string): Comentarios del cliente

## 🔄 Lógica de Negocio

### 1. Validación de Parámetros
- Verifica que `phone_number` esté presente
- Valida que `score` sea un número entre 0 y 10

### 2. Búsqueda de Cliente
- Normaliza el número de teléfono (quita caracteres no numéricos)
- Busca el cliente probando múltiples variaciones del número:
  - Número normalizado
  - Número original
  - Con prefijo +52
  - Sin prefijo +52

### 3. Búsqueda de NPS Pendiente
- Busca en la tabla `nps` donde `customer_id` = cliente encontrado
- Filtra por `status = 'pending'`
- Ordena por `created_at` descendente (más reciente primero)
- Toma solo el primer registro

### 4. Actualización de NPS
- Calcula `classification` basado en score:
  - score >= 9: 'promoter'
  - score >= 7: 'neutral'
  - score < 7: 'detractor'
- Actualiza campos: `score`, `classification`, `comments`, `status = 'completed'`, `updated_at`

## 📤 Estructura de Respuesta

### Respuesta Exitosa (200)
```json
{
  "message": "Encuesta NPS completada exitosamente",
  "nps": {
    "id": "uuid",
    "score": 9,
    "classification": "promoter",
    "status": "completed",
    "comments": "Excelente servicio, muy recomendado",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T14:45:00Z"
  },
  "client": {
    "id": "uuid",
    "names": "Juan Pérez",
    "phone_number": "+525512345678",
    "dealership_id": "uuid"
  }
}
```

## ❌ Códigos de Error

### 400 - Parámetros Inválidos
```json
{
  "message": "phone_number es requerido"
}
```
```json
{
  "message": "score debe ser un número entre 0 y 10"
}
```

### 404 - Cliente No Encontrado
```json
{
  "message": "Cliente no encontrado con el número de teléfono proporcionado",
  "phone_number": "5512345678",
  "tried_variations": ["5512345678", "+525512345678", "+525512345678", "5512345678"]
}
```

### 404 - NPS Pendiente No Encontrado
```json
{
  "message": "No se encontró encuesta NPS pendiente para este cliente",
  "client_id": "uuid",
  "phone_number": "+525512345678"
}
```

### 500 - Error de Base de Datos
```json
{
  "message": "Error al buscar encuesta NPS pendiente"
}
```

## 🧪 Ejemplo de Uso

### cURL
```bash
curl -X PATCH http://localhost:3000/api/nps/update-by-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+525512345678",
    "score": 9,
    "comments": "Excelente servicio, muy recomendado"
  }'
```

### JavaScript/Node.js
```javascript
const response = await fetch('/api/nps/update-by-phone', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone_number: '+525512345678',
    score: 9,
    comments: 'Excelente servicio, muy recomendado'
  })
});

const data = await response.json();
console.log(data);
```

### Python
```python
import requests

response = requests.patch(
    'http://localhost:3000/api/nps/update-by-phone',
    json={
        'phone_number': '+525512345678',
        'score': 9,
        'comments': 'Excelente servicio, muy recomendado'
    }
)

data = response.json()
print(data)
```

## 🔍 Logs de Debugging

El endpoint incluye logs detallados con emojis para facilitar el debugging:

- 📱 Actualizando NPS por WhatsApp
- 🔍 Buscando cliente...
- ✅ Cliente encontrado
- 📊 NPS pendiente encontrado
- 💾 Actualizando registro NPS
- ✅ NPS actualizado exitosamente

## 🏗️ Arquitectura

### Dependencias
- `createServerComponentClient` de `@supabase/auth-helpers-nextjs`
- `cookies` de `next/headers`
- `NextResponse` de `next/server`

### Tablas Utilizadas
- `client`: Búsqueda de cliente por número de teléfono
- `nps`: Actualización de encuesta NPS

### Validaciones
- Parámetros requeridos
- Rango de score (0-10)
- Existencia de cliente
- Existencia de NPS pendiente

## 🚀 Casos de Uso

### Integración con WhatsApp
Este endpoint está diseñado específicamente para recibir respuestas de encuestas NPS a través de WhatsApp, donde el cliente responde con un número del 0 al 10.

### Flujo Típico
1. Cliente recibe mensaje de WhatsApp con encuesta NPS
2. Cliente responde con número del 0 al 10 (opcionalmente con comentarios)
3. Sistema de WhatsApp llama a este endpoint
4. Endpoint actualiza la encuesta NPS correspondiente
5. Sistema puede enviar confirmación al cliente

## 📈 Métricas y Monitoreo

### Logs Importantes
- Búsqueda de cliente por número de teléfono
- Encuentra de NPS pendiente
- Actualización exitosa de NPS
- Errores de validación y base de datos

### Métricas Clave
- Tasa de éxito en actualización de NPS
- Tiempo de respuesta del endpoint
- Errores por tipo (cliente no encontrado, NPS no encontrado, etc.)

## 🔒 Seguridad

### Validaciones
- Validación de parámetros de entrada
- Sanitización de número de teléfono
- Verificación de existencia de registros

### Consideraciones
- No requiere autenticación específica (diseñado para integración externa)
- Validación robusta de entrada para prevenir inyecciones
- Logs detallados para auditoría 