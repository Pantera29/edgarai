# Parámetro Limit en Endpoints de Citas de Clientes

## 🎯 Objetivo
Agregar un parámetro opcional `limit` a los endpoints de citas de clientes para controlar el número máximo de resultados devueltos, mejorando el rendimiento y la flexibilidad de las consultas.

## 📁 Archivos Modificados

### Backend
- **`app/api/customers/[id]/appointments/route.ts`** - Endpoint principal de citas
- **`app/api/customers/[id]/active-appointments/route.ts`** - Endpoint de citas activas

### Documentación
- **`README-customer-appointments-limit.md`** - Este archivo

## 🚀 Implementación

### Parámetro Limit
- **Nombre**: `limit`
- **Tipo**: Query parameter (opcional)
- **Rango**: 1-100
- **Valor por defecto**: Sin límite (todas las citas)

### Validación Implementada
```typescript
// Validar y convertir el parámetro limit
let limit: number | null = null;
if (limitParam) {
  const parsedLimit = parseInt(limitParam);
  if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
    limit = parsedLimit;
  } else {
    return NextResponse.json(
      { message: 'Invalid limit parameter. Must be a number between 1 and 100.' },
      { status: 400 }
    );
  }
}
```

## 📡 Uso de los Endpoints

### 1. Endpoint Principal - Todas las Citas
```typescript
GET /api/customers/{client_id}/appointments
```

#### Parámetros Disponibles:
- `client_id` (path): ID del cliente (requerido)
- `status` (query): Filtrar por estado (opcional)
- `limit` (query): Número máximo de resultados (opcional, 1-100)

#### Ejemplos de Uso:
```bash
# Obtener todas las citas (sin límite)
GET /api/customers/client-uuid/appointments

# Obtener solo las últimas 5 citas
GET /api/customers/client-uuid/appointments?limit=5

# Obtener las últimas 10 citas confirmadas
GET /api/customers/client-uuid/appointments?status=confirmed&limit=10

# Obtener las últimas 3 citas completadas
GET /api/customers/client-uuid/appointments?status=completed&limit=3
```

### 2. Endpoint de Citas Activas
```typescript
GET /api/customers/{client_id}/active-appointments
```

#### Parámetros Disponibles:
- `client_id` (path): ID del cliente (requerido)
- `limit` (query): Número máximo de resultados (opcional, 1-100)

#### Ejemplos de Uso:
```bash
# Obtener todas las citas activas (sin límite)
GET /api/customers/client-uuid/active-appointments

# Obtener solo las últimas 3 citas activas
GET /api/customers/client-uuid/active-appointments?limit=3

# Obtener la próxima cita activa
GET /api/customers/client-uuid/active-appointments?limit=1
```

## 📊 Respuesta de los Endpoints

### Estructura de Respuesta Mejorada
```json
{
  "appointments": [
    {
      "id": "uuid",
      "appointment_date": "2024-12-03",
      "appointment_time": "10:00:00",
      "status": "confirmed",
      "notes": "Notas de la cita",
      "service_id": "uuid",
      "vehicle_id": "uuid",
      "services": {
        "id_uuid": "uuid",
        "service_name": "Cambio de aceite",
        "duration_minutes": 60,
        "price": 500
      },
      "vehicles": {
        "id_uuid": "uuid",
        "make": "Toyota",
        "model": "Corolla",
        "license_plate": "ABC123",
        "year": 2020
      }
    }
  ],
  "total": 5,
  "limit": 10
}
```

### Campos de Respuesta:
- **`appointments`**: Array de citas (limitado si se especifica)
- **`total`**: Número total de citas devueltas
- **`limit`**: Límite aplicado o "unlimited" si no se especificó

## 🔧 Casos de Uso Comunes

### 1. Dashboard - Últimas Citas
```typescript
// Obtener las últimas 5 citas para mostrar en dashboard
const response = await fetch(`/api/customers/${clientId}/appointments?limit=5`);
const data = await response.json();
// data.appointments contiene las últimas 5 citas
```

### 2. Próxima Cita
```typescript
// Obtener solo la próxima cita activa
const response = await fetch(`/api/customers/${clientId}/active-appointments?limit=1`);
const data = await response.json();
// data.appointments[0] contiene la próxima cita
```

### 3. Historial Reciente
```typescript
// Obtener las últimas 10 citas completadas
const response = await fetch(`/api/customers/${clientId}/appointments?status=completed&limit=10`);
const data = await response.json();
// data.appointments contiene el historial reciente
```

### 4. Citas Pendientes
```typescript
// Obtener las últimas 3 citas pendientes
const response = await fetch(`/api/customers/${clientId}/appointments?status=pending&limit=3`);
const data = await response.json();
// data.appointments contiene las citas pendientes
```

## 🎯 Beneficios

### Performance
- **Consultas más rápidas**: Menos datos transferidos
- **Menos uso de memoria**: Resultados limitados en el servidor
- **Mejor experiencia de usuario**: Respuestas más rápidas

### Flexibilidad
- **Control granular**: Cada consulta puede tener su propio límite
- **Casos de uso específicos**: Diferentes límites para diferentes necesidades
- **Escalabilidad**: Manejo eficiente de clientes con muchas citas

### UX Mejorada
- **Dashboard optimizado**: Solo las citas más relevantes
- **Carga rápida**: Menos datos para procesar
- **Navegación eficiente**: Resultados específicos por contexto

## 🧪 Testing

### Casos de Prueba
1. **Sin límite**: Debe devolver todas las citas
2. **Con límite válido**: Debe devolver solo el número especificado
3. **Límite inválido**: Debe devolver error 400
4. **Límite mayor al total**: Debe devolver todas las citas disponibles
5. **Combinación con filtros**: Debe funcionar con status y limit

### Ejemplos de Testing
```bash
# Test 1: Sin límite
curl "http://localhost:3000/api/customers/client-uuid/appointments"

# Test 2: Con límite válido
curl "http://localhost:3000/api/customers/client-uuid/appointments?limit=5"

# Test 3: Límite inválido (debe fallar)
curl "http://localhost:3000/api/customers/client-uuid/appointments?limit=150"

# Test 4: Combinación de filtros
curl "http://localhost:3000/api/customers/client-uuid/appointments?status=confirmed&limit=3"
```

## 📈 Métricas de Éxito

### Objetivos
- **Performance**: Reducción del 50% en tiempo de respuesta para consultas con límite
- **Usabilidad**: 90% de consultas usando límites apropiados
- **Estabilidad**: 0 errores por límites inválidos

### KPIs
- **Tiempo de respuesta**: < 200ms para consultas con límite
- **Uso de memoria**: Reducción del 30% en consultas grandes
- **Satisfacción del usuario**: Mejor experiencia en dashboards

## 🔒 Consideraciones de Seguridad

### Validación Implementada
- **Rango de valores**: Solo permite 1-100
- **Tipo de dato**: Valida que sea un número válido
- **Mensajes de error**: Respuestas claras para valores inválidos

### Límites de Seguridad
- **Máximo 100**: Previene consultas que consuman demasiados recursos
- **Mínimo 1**: Asegura que siempre haya al menos un resultado
- **Validación estricta**: Rechaza valores no numéricos

---

## 🎉 Resultado Final

Los endpoints de citas de clientes ahora son más flexibles y eficientes:

- ✅ **Parámetro limit opcional** (1-100)
- ✅ **Validación robusta** de parámetros
- ✅ **Respuesta mejorada** con metadatos
- ✅ **Compatible hacia atrás** (sin breaking changes)
- ✅ **Performance optimizada** para consultas grandes
- ✅ **Casos de uso específicos** cubiertos

La implementación es **segura**, **escalable** y **fácil de usar**. 