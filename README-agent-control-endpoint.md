# Control de Agente AI - Endpoint Centralizado

## 🎯 Objetivo
Implementar un endpoint centralizado `/api/agent-control` que permita gestionar el estado de los agentes AI usando la tabla `phone_agent_settings` como fuente única de verdad.

## 📁 Archivos Creados

### 1. Endpoint API
- **`app/api/agent-control/route.ts`** - Endpoint principal con métodos POST y GET

### 2. Base de Datos
- **`migrations/20241215_create_phone_agent_settings.sql`** - Migración para crear la tabla
- **`types/database.types.ts`** - Tipos TypeScript actualizados

### 3. Documentación
- **`README-agent-control-endpoint.md`** - Este archivo

## 🚀 Funcionalidades Implementadas

### Método POST - Actualizar Estado de Agente

**Endpoint:** `POST /api/agent-control`

**Casos de uso soportados:**

#### Opción 1: Por Client ID
```json
{
  "client_id": "uuid-del-cliente",
  "agent_active": false,
  "notes": "Cliente con cita programada para hoy",
  "updated_by": "ai_agent"
}
```

#### Opción 2: Por Teléfono y Dealership
```json
{
  "phone_number": "5551234567",
  "dealership_id": "uuid-del-dealership",
  "agent_active": false,
  "notes": "Desactivado por intervención manual",
  "updated_by": "user_123"
}
```

**Respuesta de éxito:**
```json
{
  "success": true,
  "phone_number": "5551234567",
  "dealership_id": "uuid-del-dealership",
  "agent_active": false,
  "method": "via_client_id",
  "dealership_name": "Nombre del Dealership",
  "updated_at": "2024-12-15T10:30:00Z",
  "was_created": true,
  "message": "Agente desactivado para 5551234567 en Nombre del Dealership"
}
```

### Método GET - Consultar Estado de Agente

**Endpoint:** `GET /api/agent-control`

**Parámetros de consulta:**

#### Opción 1: Por Client ID
```
/api/agent-control?client_id=uuid-del-cliente
```

#### Opción 2: Por Teléfono y Dealership
```
/api/agent-control?phone_number=5551234567&dealership_id=uuid-del-dealership
```

**Respuesta:**
```json
{
  "phone_number": "5551234567",
  "dealership_id": "uuid-del-dealership",
  "agent_active": true,
  "exists": true,
  "notes": "Última razón de cambio",
  "created_at": "2024-12-15T10:30:00Z",
  "updated_at": "2024-12-15T14:45:00Z",
  "updated_by": "ai_agent"
}
```

## 🏗️ Estructura de Base de Datos

### Tabla `phone_agent_settings`
```sql
CREATE TABLE phone_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  agent_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'system',
  updated_by VARCHAR(50) DEFAULT 'system',
  
  UNIQUE(phone_number, dealership_id)
);
```

### Características de la Tabla
- **Clave única:** `(phone_number, dealership_id)` para evitar duplicados
- **Normalización:** Números de teléfono se normalizan a 10 dígitos
- **Auditoría:** Campos `created_by`, `updated_by` para tracking
- **Trigger automático:** `updated_at` se actualiza automáticamente
- **RLS habilitado:** Políticas de seguridad para usuarios autenticados

## 🔧 Validaciones Implementadas

### POST Request
- ✅ `agent_active` es requerido y debe ser boolean
- ✅ Debe recibir `client_id` O (`phone_number` + `dealership_id`)
- ✅ Si usa `client_id`: verifica que el cliente existe
- ✅ Si usa `phone_number`: normaliza a 10 dígitos numéricos
- ✅ Verifica que el dealership existe
- ✅ Valida formato de número de teléfono

### GET Request
- ✅ Misma lógica de parámetros que POST
- ✅ Si no existe configuración, retorna `agent_active: true` (default)
- ✅ Maneja errores de consulta apropiadamente

## 📊 Logging Detallado

El endpoint incluye logging completo con emojis siguiendo el patrón del proyecto:

```typescript
console.log('🎯 Iniciando control de agente...');
console.log('📝 Payload recibido:', payload);
console.log('🔍 Obteniendo datos del cliente:', client_id);
console.log('✅ Datos obtenidos del cliente:', data);
console.log('🏢 Verificando dealership...');
console.log('💾 Actualizando phone_agent_settings...');
console.log('✅ Configuración de agente actualizada exitosamente');
console.log('🎉 Operación completada:', response);
console.error('❌ Error:', error);
console.log('💥 Error inesperado:', error);
```

## 🧪 Casos de Prueba

### POST - Activación por Client ID
```bash
curl -X POST /api/agent-control \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "uuid-del-cliente",
    "agent_active": true,
    "notes": "Cliente reactivado después de cita",
    "updated_by": "ai_agent"
  }'
```

### POST - Desactivación por Teléfono
```bash
curl -X POST /api/agent-control \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "5551234567",
    "dealership_id": "uuid-del-dealership",
    "agent_active": false,
    "notes": "Desactivado por intervención manual",
    "updated_by": "user_123"
  }'
```

### GET - Consulta por Client ID
```bash
curl "http://localhost:3000/api/agent-control?client_id=uuid-del-cliente"
```

### GET - Consulta por Teléfono
```bash
curl "http://localhost:3000/api/agent-control?phone_number=5551234567&dealership_id=uuid-del-dealership"
```

## ❌ Manejo de Errores

### Códigos de Error
- **400:** Datos inválidos o faltantes
- **404:** Cliente/dealership no encontrado
- **500:** Errores de base de datos o servidor

### Ejemplos de Respuestas de Error
```json
{
  "error": "agent_active is required and must be a boolean"
}
```

```json
{
  "error": "Client not found with the provided ID"
}
```

```json
{
  "error": "Invalid phone number format. Must be a valid 10-digit number"
}
```

## 🔄 Integración con Sistema Existente

### Compatibilidad
- ✅ Mantiene compatibilidad con campo `agent_active` en tabla `client`
- ✅ Puede coexistir con endpoints existentes de reactivación
- ✅ No afecta funcionalidad actual de cron jobs

### Migración Gradual
1. **Fase 1:** Endpoint disponible para nuevas implementaciones
2. **Fase 2:** Migrar cron jobs para usar nueva tabla
3. **Fase 3:** Actualizar interfaces para usar endpoint centralizado

## 📈 Beneficios

### Centralización
- **Fuente única de verdad:** Una tabla para todas las configuraciones
- **Consistencia:** Mismo formato para todos los casos de uso
- **Auditoría:** Tracking completo de cambios

### Flexibilidad
- **Múltiples métodos:** Por cliente o por teléfono directo
- **Notas opcionales:** Contexto para cada cambio
- **Tracking de usuario:** Quién realizó cada cambio

### Escalabilidad
- **Índices optimizados:** Consultas rápidas por teléfono/dealership
- **RLS habilitado:** Seguridad a nivel de fila
- **Triggers automáticos:** Mantenimiento automático de timestamps

## 🚀 Próximos Pasos

1. **Aplicar migración:** Ejecutar `migrations/20241215_create_phone_agent_settings.sql`
2. **Testing:** Probar todos los casos de uso con datos reales
3. **Integración:** Conectar con interfaces existentes
4. **Monitoreo:** Implementar métricas de uso del endpoint
