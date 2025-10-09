# Sistema de Service Advisors (Asesores de Servicio)

## Descripción General

Sistema completo para gestionar la capacidad de citas en talleres automotrices mediante asesores de servicio. Permite configurar asesores con sus horarios, días laborables, y asignar servicios específicos a cada slot de su jornada.

## Fecha de Implementación

Octubre 2025

## Tablas de Base de Datos

### `service_advisors`
Tabla principal que almacena la información de los asesores de servicio.

**Campos principales:**
- `id`: UUID único del asesor
- `dealership_id`: Referencia al dealership
- `workshop_id`: Referencia al taller
- `name`: Nombre completo del asesor
- `email`: Email (opcional)
- `phone`: Teléfono (opcional)
- `shift_start_time`: Hora de inicio del turno
- `shift_end_time`: Hora de fin del turno
- `lunch_start_time`: Hora de inicio del almuerzo
- `lunch_end_time`: Hora de fin del almuerzo
- `works_monday` a `works_sunday`: Días laborables (boolean)
- `max_consecutive_services`: Máximo de servicios consecutivos por día
- `is_active`: Estado del asesor

### `advisor_slot_configuration`
Tabla que define qué servicios puede realizar cada asesor en cada slot de su jornada.

**Campos principales:**
- `id`: UUID único
- `advisor_id`: Referencia al asesor
- `slot_position`: Posición del slot (1, 2, 3...)
- `service_id`: Referencia al servicio
- `created_at`: Fecha de creación

### Tablas actualizadas
- `appointment`: Se agregó el campo `assigned_advisor_id` para relacionar citas con asesores
- `dealerships`: Campo `capacity_model` ya existía para soportar modelo de asesores

## Tipos TypeScript

### Archivo: `/types/database.types.ts`

**Tipos principales:**
- `ServiceAdvisor`: Tipo Row de la tabla service_advisors
- `ServiceAdvisorInsert`: Tipo para inserción
- `ServiceAdvisorUpdate`: Tipo para actualización
- `AdvisorSlotConfiguration`: Tipo de configuración de slots
- `CreateServiceAdvisorInput`: Input para crear asesor (sin campos auto-generados)
- `UpdateServiceAdvisorInput`: Input para actualizar asesor (campos opcionales)
- `ConfigureAdvisorSlotsInput`: Input para configurar múltiples slots
- `AdvisorSlotWithService`: Slot con información del servicio (para vistas)
- `ServiceAdvisorWithRelations`: Asesor con relaciones cargadas

**Funciones helper:**
- `getWorkingDaysFromAdvisor()`: Obtiene objeto con días laborables
- `formatTimeRange()`: Formatea rango de horas (HH:MM - HH:MM)
- `getWorkingDaysString()`: Obtiene string legible de días laborables

## API Endpoints

### GET `/api/service-advisors`
Obtiene lista de asesores con filtros.

**Query Parameters:**
- `dealershipId` (requerido): ID del dealership
- `workshopId` (opcional): Filtrar por taller
- `isActive` (opcional): Filtrar por estado

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "workshop": { "id": "uuid", "name": "Taller Principal" },
      ...
    }
  ],
  "count": 10
}
```

### GET `/api/service-advisors/[id]`
Obtiene los datos completos de un asesor específico.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "workshop": { "id": "uuid", "name": "Taller Principal" },
    "dealership": { "id": "uuid", "name": "Dealership ABC" },
    ...
  }
}
```

### POST `/api/service-advisors`
Crea un nuevo asesor de servicio.

**Body:**
```json
{
  "dealership_id": "uuid",
  "workshop_id": "uuid",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "5551234567",
  "shift_start_time": "07:00:00",
  "shift_end_time": "17:00:00",
  "lunch_start_time": "13:00:00",
  "lunch_end_time": "14:00:00",
  "works_monday": true,
  "works_tuesday": true,
  "works_wednesday": true,
  "works_thursday": true,
  "works_friday": true,
  "works_saturday": false,
  "works_sunday": false,
  "max_consecutive_services": 10
}
```

**Validaciones:**
- Campos requeridos: dealership_id, workshop_id, name, horarios
- Formato de hora: HH:MM o HH:MM:SS
- Horario de almuerzo debe estar dentro del turno
- Hora fin debe ser posterior a hora inicio
- Al menos un día laborable debe estar seleccionado
- Email único por dealership (si se proporciona)

### PATCH `/api/service-advisors/[id]`
Actualiza un asesor existente.

**Body:** Mismo formato que POST, todos los campos opcionales

### DELETE `/api/service-advisors/[id]`
Desactiva un asesor (soft delete).

**Validaciones:**
- No permite desactivar si tiene citas futuras asignadas
- Retorna lista de citas si hay conflictos

### GET `/api/service-advisors/[id]/slots`
Obtiene la configuración de slots del asesor con información del servicio.

**Response:**
```json
{
  "success": true,
  "data": {
    "advisor_id": "uuid",
    "advisor_name": "Juan Pérez",
    "slots": [
      {
        "id": "uuid",
        "slot_position": 1,
        "service_id": "uuid",
        "service": {
          "id_uuid": "uuid",
          "service_name": "Mantenimiento",
          "duration_minutes": 60
        }
      }
    ],
    "total_slots": 10
  }
}
```

### POST `/api/service-advisors/[id]/slots`
Configura los slots de un asesor (reemplaza configuración anterior).

**Body:**
```json
{
  "slots": [
    { "position": 1, "serviceId": "uuid" },
    { "position": 2, "serviceId": "uuid" },
    { "position": 3, "serviceId": "uuid" }
  ]
}
```

**Validaciones:**
- No exceder `max_consecutive_services` del asesor
- Posiciones únicas y positivas
- Todos los servicios deben existir y pertenecer al mismo dealership

### DELETE `/api/service-advisors/[id]/slots/[position]`
Elimina un slot específico.

**Parámetros:**
- `id`: ID del asesor
- `position`: Posición del slot a eliminar

## Interfaz de Usuario

### Página Principal: `/backoffice/asesores-servicio`

**Funcionalidades:**
- Lista de asesores en tabla
- Filtros por búsqueda (nombre/email), taller y estado
- Columnas: Nombre, Email, Taller, Horario, Días laborables, Estado
- Acciones por fila: Editar, Configurar Slots, Desactivar
- Botón "Nuevo Asesor"
- Indicador visual de días laborables
- Contador de resultados filtrados

**Componentes utilizados:**
- `Table` (shadcn/ui)
- `Card`, `Badge`, `Button`
- `Select`, `Switch` para filtros
- `DropdownMenu` para acciones

### Página de Creación: `/backoffice/asesores-servicio/nuevo`

**Secciones del formulario:**

1. **Información Básica**
   - Nombre completo (requerido)
   - Taller (requerido)
   - Email
   - Teléfono

2. **Horarios de Trabajo**
   - Inicio del turno
   - Fin del turno
   - Inicio del almuerzo
   - Fin del almuerzo

3. **Días Laborables**
   - Checkboxes para cada día de la semana

4. **Configuración Adicional**
   - Máximo de servicios consecutivos

**Validaciones frontend:**
- Campos requeridos
- Formato de email
- Horarios lógicos (fin > inicio)
- Almuerzo dentro del turno
- Al menos un día laborable

### Página de Edición: `/backoffice/asesores-servicio/[id]/editar`

**Características:**
- Mismo formulario que creación
- Pre-carga datos del asesor existente
- Muestra loading state mientras carga
- Validaciones iguales a la creación

### Página de Configuración de Slots: `/backoffice/asesores-servicio/[id]/slots`

**Funcionalidades:**
- Muestra información del turno del asesor
- Calcula slots disponibles basados en:
  - Horario de inicio/fin del turno
  - Duración del shift (de dealership_configuration)
  - Horario de almuerzo (se excluye)
  - Máximo de servicios consecutivos
- Cada slot muestra:
  - Número de posición
  - Hora calculada
  - Selector de servicio (dropdown)
  - Botón para quitar servicio
- Resumen de slots configurados vs disponibles
- Guarda toda la configuración de una vez

**Lógica de cálculo:**
```typescript
totalMinutes = (endTime - startTime) / 60
lunchMinutes = (lunchEnd - lunchStart) / 60
workingMinutes = totalMinutes - lunchMinutes
maxSlots = min(floor(workingMinutes / shiftDuration), max_consecutive_services)
```

## Flujo de Uso

### 1. Crear un Asesor
1. Ir a "Asesores de Servicio"
2. Click en "Nuevo Asesor"
3. Completar información básica y horarios
4. Seleccionar días laborables
5. Guardar

### 2. Configurar Slots del Asesor
1. En la lista de asesores, click en "⋮" → "Configurar Slots"
2. Ver los slots calculados automáticamente
3. Asignar servicio a cada slot que se desee habilitar
4. Guardar configuración

### 3. Editar un Asesor
1. En la lista de asesores, click en "⋮" → "Editar"
2. Modificar información necesaria
3. Guardar cambios

### 4. Desactivar un Asesor
1. En la lista de asesores, click en "⋮" → "Desactivar"
2. Confirmar acción
3. El sistema valida que no tenga citas futuras

## Integración con Sistema de Citas

El campo `assigned_advisor_id` en la tabla `appointment` permite:
- Asignar citas a asesores específicos
- Validar capacidad por asesor en lugar de por bahías físicas
- Filtrar citas por asesor
- Reportes de carga de trabajo por asesor

## Validaciones Importantes

### Al Crear/Editar Asesor
- ✅ Dealership y workshop deben existir
- ✅ Workshop debe pertenecer al dealership
- ✅ Email único por dealership
- ✅ Horarios válidos y lógicos
- ✅ Al menos un día laborable

### Al Configurar Slots
- ✅ No exceder `max_consecutive_services`
- ✅ Posiciones de slots únicas
- ✅ Servicios deben existir y pertenecer al dealership
- ✅ Elimina configuración anterior antes de guardar nueva

### Al Desactivar Asesor
- ✅ No permitir si tiene citas futuras
- ✅ Soft delete (cambia is_active a false)

## Componentes Reutilizables

### Helpers de Formato
```typescript
// Formato de rango de horas
formatTimeRange("07:00:00", "17:00:00") 
// → "07:00 - 17:00"

// String de días laborables
getWorkingDaysString(advisor)
// → "Lun, Mar, Mié, Jue, Vie"
```

## Consideraciones Técnicas

### Autenticación
- Usa JWT tokens en query params
- Verifica dealership_id en token
- Redirige a login si token inválido

### Manejo de Errores
- Todos los endpoints retornan JSON consistente
- Códigos HTTP apropiados (400, 404, 409, 500)
- Mensajes de error descriptivos
- Toast notifications en UI

### Performance
- JOINs en queries para reducir requests
- Filtros aplicados en backend
- Carga lazy de datos relacionados

### UX
- Loading states en todas las operaciones
- Confirmación antes de desactivar
- Validación en tiempo real en formularios
- Feedback visual con toasts
- Contadores y badges informativos

## Próximas Mejoras Sugeridas

1. **Asignación Automática de Asesores**
   - Algoritmo para asignar automáticamente el asesor menos cargado
   - Balance de carga entre asesores

2. **Vista de Calendario por Asesor**
   - Ver todas las citas de un asesor en calendario
   - Drag & drop para reasignar citas

3. **Reportes de Capacidad**
   - Utilización promedio por asesor
   - Horas pico y valles
   - Recomendaciones de contratación

4. **Notificaciones**
   - Alertar cuando un asesor está cerca de su capacidad
   - Notificar al asesor de nuevas citas asignadas

5. **Horarios Flexibles**
   - Permitir horarios diferentes por día
   - Configurar ausencias temporales

6. **Especialidades**
   - Asignar especialidades a asesores
   - Matching automático servicio → asesor por especialidad

## Archivos Creados/Modificados

### Tipos
- ✅ `/types/database.types.ts` (actualizado)

### API Endpoints
- ✅ `/app/api/service-advisors/route.ts`
- ✅ `/app/api/service-advisors/[id]/route.ts`
- ✅ `/app/api/service-advisors/[id]/slots/route.ts`
- ✅ `/app/api/service-advisors/[id]/slots/[position]/route.ts`

### Páginas UI
- ✅ `/app/backoffice/asesores-servicio/page.tsx`
- ✅ `/app/backoffice/asesores-servicio/nuevo/page.tsx`
- ✅ `/app/backoffice/asesores-servicio/[id]/editar/page.tsx`
- ✅ `/app/backoffice/asesores-servicio/[id]/slots/page.tsx`

### Documentación
- ✅ `/README-service-advisors.md` (este archivo)

## Testing Sugerido

### Endpoints
```bash
# Crear asesor
POST /api/service-advisors

# Listar asesores
GET /api/service-advisors?dealershipId=xxx

# Obtener asesor específico
GET /api/service-advisors/[id]

# Actualizar asesor
PATCH /api/service-advisors/[id]

# Configurar slots
POST /api/service-advisors/[id]/slots

# Obtener slots
GET /api/service-advisors/[id]/slots
```

### Casos de Prueba UI
1. ✅ Crear asesor con todos los campos
2. ✅ Crear asesor solo con campos requeridos
3. ✅ Editar información de asesor existente
4. ✅ Configurar slots de un asesor
5. ✅ Desactivar asesor sin citas
6. ✅ Intentar desactivar asesor con citas futuras
7. ✅ Filtrar por taller
8. ✅ Filtrar por estado activo/inactivo
9. ✅ Búsqueda por nombre/email

## Soporte

Para preguntas o issues relacionados con este sistema, contactar al equipo de desarrollo.

---

**Desarrollado por:** AI Assistant  
**Fecha:** Octubre 2025  
**Versión:** 1.0

