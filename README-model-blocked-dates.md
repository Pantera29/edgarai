# Sistema de Bloqueo de Calendario por Modelo de Vehículo

## 🎯 Objetivo
Permitir a las agencias bloquear citas para modelos específicos de vehículos por rangos de fechas, útil para situaciones como falta de repuestos, mantenimiento de equipos específicos, o restricciones operativas.

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
- `migrations/20241204_create_model_blocked_dates.sql` - Migración de la tabla
- `app/api/model-blocked-dates/route.ts` - API CRUD para bloqueos por modelo
- `app/api/model-blocked-dates/[id]/route.ts` - API para actualizar/eliminar bloqueos
- `app/backoffice/admin/bloqueos-modelos/page.tsx` - Página de administración
- `app/backoffice/admin/bloqueos-modelos/model-block-dialog.tsx` - Modal para crear/editar bloqueos

### Archivos Modificados
- `app/api/appointments/availability/route.ts` - Agregada verificación de bloqueos por modelo

## 🚀 Implementación

### Base de Datos
La tabla `model_blocked_dates` almacena:
- `dealership_id` - ID del concesionario
- `make` - Marca del vehículo (ej: Toyota)
- `model` - Modelo del vehículo (ej: Corolla)
- `start_date` - Fecha de inicio del bloqueo
- `end_date` - Fecha de fin del bloqueo
- `reason` - Motivo del bloqueo
- `is_active` - Estado del bloqueo

### API Endpoints

#### GET `/api/model-blocked-dates?dealership_id=xxx`
Lista todos los bloqueos activos de un concesionario.

**Respuesta:**
```json
{
  "blockedDates": [
    {
      "id": "uuid",
      "dealership_id": "uuid",
      "make": "Toyota",
      "model": "Corolla",
      "start_date": "2024-01-15",
      "end_date": "2024-01-20",
      "reason": "Falta de repuestos específicos",
      "is_active": true,
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
    }
  ]
}
```

#### POST `/api/model-blocked-dates`
Crea un nuevo bloqueo por modelo.

**Body:**
```json
{
  "dealership_id": "uuid",
  "make": "Toyota",
  "model": "Corolla",
  "start_date": "2024-01-15",
  "end_date": "2024-01-20",
  "reason": "Falta de repuestos específicos"
}
```

#### PUT `/api/model-blocked-dates/[id]`
Actualiza un bloqueo existente.

#### DELETE `/api/model-blocked-dates/[id]`
Elimina un bloqueo (soft delete).

### Verificación en Disponibilidad
El API de disponibilidad ahora verifica bloqueos por modelo cuando se proporcionan los parámetros `vehicle_make` y `vehicle_model`:

```
GET /api/appointments/availability?date=2024-01-15&service_id=xxx&dealership_id=xxx&vehicle_make=Toyota&vehicle_model=Corolla
```

Si el modelo está bloqueado, retorna:
```json
{
  "availableSlots": [],
  "message": "Vehicle model Toyota Corolla is not available for service on this date: Falta de repuestos específicos",
  "error_code": "MODEL_BLOCKED",
  "details": {
    "make": "Toyota",
    "model": "Corolla",
    "reason": "Falta de repuestos específicos",
    "block_id": "uuid"
  }
}
```

## 🧪 Testing

### Casos de Prueba
1. **Crear bloqueo**: Verificar que se puede crear un bloqueo para Toyota Corolla
2. **Verificar disponibilidad**: Confirmar que no se pueden crear citas para el modelo bloqueado
3. **Editar bloqueo**: Modificar fechas o motivo del bloqueo
4. **Eliminar bloqueo**: Desactivar un bloqueo existente
5. **Múltiples bloqueos**: Crear bloqueos para diferentes modelos

### Datos de Prueba
```sql
-- Insertar bloqueo de prueba
INSERT INTO model_blocked_dates (
  dealership_id, make, model, start_date, end_date, reason, is_active
) VALUES (
  'dealership-uuid',
  'Toyota',
  'Corolla',
  '2024-01-15',
  '2024-01-20',
  'Falta de repuestos específicos',
  true
);
```

### Testing de Endpoints
```bash
# 1. Crear un Bloqueo de Prueba
curl -X POST http://localhost:3000/api/model-blocked-dates \
  -H "Content-Type: application/json" \
  -d '{
    "dealership_id": "tu-dealership-id",
    "make": "Toyota",
    "model": "Corolla",
    "start_date": "2024-12-15",
    "end_date": "2024-12-20",
    "reason": "Falta de repuestos específicos"
  }'

# 2. Listar Bloqueos
curl "http://localhost:3000/api/model-blocked-dates?dealership_id=tu-dealership-id"

# 3. Probar Disponibilidad con Modelo Bloqueado
curl "http://localhost:3000/api/appointments/availability?date=2024-12-16&service_id=tu-service-id&dealership_id=tu-dealership-id&vehicle_make=Toyota&vehicle_model=Corolla"
```

## 📈 Impacto

### Beneficios
- ✅ **Control granular**: Bloqueo específico por modelo sin afectar otros vehículos
- ✅ **Flexibilidad temporal**: Rangos de fechas configurables
- ✅ **Transparencia**: Motivos claros para los bloqueos
- ✅ **Escalabilidad**: Múltiples bloqueos simultáneos
- ✅ **Integración**: Se integra perfectamente con el sistema existente

### Casos de Uso
- **Falta de repuestos**: Bloquear modelos específicos cuando faltan partes
- **Mantenimiento de equipos**: Restringir servicios que requieren equipos en mantenimiento
- **Capacitación**: Bloquear modelos nuevos mientras se capacita al personal
- **Restricciones operativas**: Limitar servicios por capacidad o políticas internas

## 🛠️ Configuración

### Acceso a la Administración
La página de administración está disponible en:
```
/backoffice/admin/bloqueos-modelos?token=xxx
```

### Permisos
- Solo usuarios autenticados con token válido pueden gestionar bloqueos
- Los bloqueos son específicos por concesionario (multi-tenant)

### Integración con Flujo de Citas
Para que la verificación funcione, el flujo de creación de citas debe incluir los parámetros `vehicle_make` y `vehicle_model` al consultar disponibilidad.

## 🔧 Funciones SQL

### `is_model_blocked(dealership_id, make, model, date)`
Verifica si un modelo específico está bloqueado en una fecha dada.

### `get_active_model_blocks(dealership_id)`
Obtiene todos los bloqueos activos de un concesionario.

## 📊 Performance

### Índices Optimizados
- `idx_model_blocked_dates_dealership_id` - Consultas por concesionario
- `idx_model_blocked_dates_make_model` - Búsquedas por marca/modelo
- `idx_model_blocked_dates_date_range` - Filtros por rango de fechas
- `idx_model_blocked_dates_active` - Filtros por estado activo
- `idx_model_blocked_dates_dealership_active` - Consultas combinadas

### Optimizaciones
- Soft delete para mantener historial sin afectar performance
- Consultas optimizadas con índices específicos
- Verificación solo cuando se proporcionan parámetros de vehículo

## 🔄 Flujo de Trabajo

### Crear Bloqueo
1. Ir a `/backoffice/admin/bloqueos-modelos`
2. Hacer clic en "Nuevo Bloqueo"
3. Completar formulario (marca, modelo, fechas, motivo)
4. Guardar bloqueo

### Verificar Disponibilidad
1. Al consultar disponibilidad, incluir `vehicle_make` y `vehicle_model`
2. El sistema verifica automáticamente si el modelo está bloqueado
3. Si está bloqueado, retorna mensaje explicativo

### Gestionar Bloqueos
- **Editar**: Modificar fechas, motivo o estado
- **Eliminar**: Desactivar bloqueo (soft delete)
- **Ver estado**: Badges indican si está activo, inactivo o expirado

## 🚨 Consideraciones

### Seguridad
- Validación de token JWT en todas las operaciones
- Filtrado por dealership_id en todas las consultas
- Validación de inputs en frontend y backend

### Compatibilidad
- No afecta el sistema existente de bloqueos generales
- Compatible con el flujo actual de citas
- Backward compatible con APIs existentes

### Mantenimiento
- Los bloqueos expirados se muestran como "Expirado"
- Soft delete mantiene historial para auditoría
- Trigger automático actualiza `updated_at`

## 📝 Notas de Desarrollo

### Patrones Utilizados
- API-first development pattern
- Componentes shadcn/ui para consistencia
- Logging con emojis para debugging
- Manejo de errores consistente

### Dependencias
- `date-fns` para manejo de fechas
- `lucide-react` para iconos
- `@supabase/auth-helpers-nextjs` para cliente Supabase

### Estructura de Archivos
```
app/
├── api/
│   ├── model-blocked-dates/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   └── appointments/
│       └── availability/
│           └── route.ts (modificado)
└── backoffice/
    └── admin/
        └── bloqueos-modelos/
            ├── page.tsx
            └── model-block-dialog.tsx
```

---

**Fecha de Implementación**: 2024-12-04  
**Versión**: 1.0.0  
**Estado**: ✅ Completado y funcional 