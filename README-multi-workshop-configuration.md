# Implementación Multi-Workshop en dealership_configuration

## 🎯 Objetivo
Implementar soporte para múltiples talleres por agencia en la tabla `dealership_configuration`, permitiendo que cada taller tenga su propia configuración específica.

## 📁 Archivos Creados/Modificados

### Archivos Creados
- `lib/workshop-resolver.ts` - Funciones helper para resolver workshop_id y obtener configuraciones

### Archivos Modificados
- `app/api/appointments/availability/route.ts` - Actualizado para usar workshop_id
- `app/backoffice/admin/configuracion/page.tsx` - Agregado selector de taller
- `app/backoffice/citas/nueva/page.tsx` - Actualizado para usar taller principal
- `app/api/whatsapp/send/route.ts` - Actualizado para usar taller principal
- `app/api/dealerships/info/route.ts` - Incluye workshop_id en respuesta
- `types/workshop.ts` - Agregado workshop_id opcional a TallerConfig

## 🚀 Implementación

### 1. Funciones Helper (lib/workshop-resolver.ts)

#### `resolveWorkshopId(dealership_id, supabase, workshop_id?)`
- Si se proporciona `workshop_id`, valida que pertenezca al dealership
- Si no se proporciona, busca el taller principal (`is_main = true`)
- Retorna el workshop_id válido

#### `getWorkshopConfiguration(dealership_id, workshop_id, supabase)`
- Obtiene la configuración específica de un taller
- Retorna configuración por defecto si no existe

### 2. API de Availability
- Agregado parámetro `workshop_id` opcional en query params
- Usa `resolveWorkshopId` para determinar el taller a usar
- Mantiene compatibilidad hacia atrás (usa taller principal si no se especifica)

### 3. Panel de Configuración Admin
- Agregado selector de taller (solo visible si hay múltiples talleres)
- Carga configuración específica por taller
- Guarda configuración con `workshop_id` específico

### 4. Otros Endpoints
- **Nueva Cita**: Usa taller principal por defecto
- **WhatsApp**: Usa taller principal para obtener token
- **Dealership Info**: Incluye `workshop_id` en respuesta

## 🧪 Testing

### Casos de Prueba
1. **API Availability sin workshop_id**: Debe usar taller principal
2. **API Availability con workshop_id**: Debe usar taller específico
3. **Panel de configuración con un taller**: No muestra selector
4. **Panel de configuración con múltiples talleres**: Muestra selector
5. **Cambio de taller en selector**: Carga configuración correcta
6. **Guardado de configuración**: Incluye workshop_id correcto

### Validaciones
- Verificar que todos los queries a `dealership_configuration` incluyan `workshop_id`
- Asegurar que el fallback a taller principal funcione correctamente
- Mantener compatibilidad hacia atrás donde `workshop_id` no se proporcione

## 📈 Impacto

### Beneficios
- **Configuración específica por taller**: Cada taller puede tener su propia configuración
- **Escalabilidad**: Soporte para agencias con múltiples ubicaciones
- **Compatibilidad**: No rompe funcionalidad existente

### Consideraciones
- **Migración de datos**: Las configuraciones existentes necesitarán ser migradas
- **Taller principal**: Cada dealership debe tener un taller marcado como principal
- **Validaciones**: Se agregaron validaciones para workshop_id

## 🔧 Uso

### API Availability
```typescript
// Usar taller principal (comportamiento por defecto)
GET /api/appointments/availability?date=2024-01-15&service_id=123&dealership_id=456

// Usar taller específico
GET /api/appointments/availability?date=2024-01-15&service_id=123&dealership_id=456&workshop_id=789
```

### Panel de Configuración
- Si hay múltiples talleres, se muestra un selector
- Al cambiar de taller, se carga la configuración específica
- Al guardar, se guarda con el workshop_id seleccionado

### Funciones Helper
```typescript
import { resolveWorkshopId, getWorkshopConfiguration } from '@/lib/workshop-resolver';

// Resolver workshop_id
const workshopId = await resolveWorkshopId(dealershipId, supabase, optionalWorkshopId);

// Obtener configuración
const config = await getWorkshopConfiguration(dealershipId, workshopId, supabase);
```

## 🚨 Notas Importantes

1. **Migración requerida**: Las configuraciones existentes necesitan ser migradas para incluir workshop_id
2. **Taller principal**: Cada dealership debe tener exactamente un taller marcado como principal
3. **Compatibilidad**: El sistema mantiene compatibilidad hacia atrás usando el taller principal por defecto
4. **Validaciones**: Se agregaron validaciones para asegurar que workshop_id pertenezca al dealership correcto

# Soporte Multi-Taller en Sistema de Citas Automotrices

## 🎯 Objetivo
Implementar soporte completo para múltiples talleres por dealership en el sistema de gestión automotriz, permitiendo que cada agencia pueda manejar múltiples ubicaciones con configuraciones independientes.

## 📁 Archivos Creados/Modificados

### Backend - APIs y Helpers
- **`lib/workshop-resolver.ts`** (NUEVO) - Helper para resolver workshop_id
- **`app/api/appointments/availability/route.ts`** - Actualizado para soporte multi-taller
- **`app/api/appointments/create/route.ts`** - Actualizado para usar workshop_id
- **`app/api/appointments/update/[id]/route.ts`** - Actualizado para permitir cambio de taller
- **`app/api/dealerships/info/route.ts`** - Actualizado para retornar configuración específica del taller
- **`app/api/whatsapp/send/route.ts`** - Actualizado para obtener token por taller

### Frontend - Panel de Administración
- **`app/backoffice/admin/configuracion/page.tsx`** - Selector de taller y gestión por taller

### Tipos TypeScript
- **`types/index.ts`** - Agregado workshop_id opcional

## 🚀 Implementación

### 1. Helper de Resolución de Taller
```typescript
// lib/workshop-resolver.ts
export async function resolveWorkshopId(
  dealershipId: string, 
  workshopId?: string
): Promise<string> {
  // Si se especifica workshop_id, validar que pertenezca al dealership
  // Si no se especifica, obtener el taller principal (is_primary = true)
  // Retornar el workshop_id válido
}
```

### 2. API de Disponibilidad Multi-Taller
```typescript
// app/api/appointments/availability/route.ts
// Parámetros: date, service_id, dealership_id, workshop_id (opcional)
// Si workshop_id no se especifica, usa el taller principal automáticamente
// Valida disponibilidad usando configuración específica del taller
```

### 3. Creación de Citas con Taller
```typescript
// app/api/appointments/create/route.ts
// Recibe workshop_id opcional
// Si no se especifica, resuelve automáticamente al taller principal
// Guarda la cita con el workshop_id correspondiente
```

### 4. Actualización de Citas con Cambio de Taller
```typescript
// app/api/appointments/update/[id]/route.ts
// Permite actualizar workshop_id de una cita existente
// Valida que el nuevo taller pertenezca al mismo dealership
// Verifica disponibilidad en el nuevo taller
// Campos permitidos: status, appointment_date, appointment_time, notes, service_id, workshop_id
```

### 5. Información de Dealership Multi-Taller
```typescript
// app/api/dealerships/info/route.ts
// Parámetros: dealership_id, workshop_id (opcional)
// Si workshop_id no se especifica, usa el taller principal
// Retorna configuración específica del taller (shift_duration, timezone, etc.)
// operating_hours y blocked_dates siguen a nivel dealership
// NUEVO: is_multi_workshop y all_workshops para detectar múltiples ubicaciones
```

### 6. Panel de Configuración Multi-Taller
```typescript
// app/backoffice/admin/configuracion/page.tsx
// Selector de taller en la parte superior
// Carga configuración específica del taller seleccionado
// Guarda cambios en el taller específico
// Estados de loading por taller
```

## 🧪 Testing

### Casos de Prueba - Endpoint de Información de Dealership

#### 1. Información con Taller Específico
```bash
GET /api/dealerships/info?dealership_id=xxx&workshop_id=workshop_2_uuid
```
**Resultado esperado**: ✅ Configuración específica del taller 2 + `is_multi_workshop: true` + `all_workshops`

#### 2. Información sin Especificar Taller (Agencia Multi-Taller)
```bash
GET /api/dealerships/info?dealership_id=xxx
```
**Resultado esperado**: ✅ Configuración del taller principal + `is_multi_workshop: true` + `all_workshops`

#### 3. Información sin Especificar Taller (Agencia de Un Solo Taller)
```bash
GET /api/dealerships/info?dealership_id=xxx
```
**Resultado esperado**: ✅ Configuración del taller principal + `is_multi_workshop: false` + `all_workshops` con 1 taller

#### 4. Información con Taller Inválido
```bash
GET /api/dealerships/info?dealership_id=xxx&workshop_id=workshop_invalid
```
**Resultado esperado**: ✅ Usa el taller principal por defecto + `all_workshops` con talleres válidos

### Casos de Prueba - Endpoint de Actualización

#### 1. Cambio de Taller Válido
```bash
PATCH /api/appointments/update/{appointment_id}
{
  "workshop_id": "workshop_2_uuid"
}
```
**Resultado esperado**: ✅ Cita actualizada al nuevo taller

#### 2. Cambio de Taller Inválido
```bash
PATCH /api/appointments/update/{appointment_id}
{
  "workshop_id": "workshop_de_otro_dealership"
}
```
**Resultado esperado**: ❌ Error 400 - "Invalid workshop for this dealership"

#### 3. Cambio de Taller + Reprogramación
```bash
PATCH /api/appointments/update/{appointment_id}
{
  "workshop_id": "workshop_2_uuid",
  "appointment_date": "2024-12-15",
  "appointment_time": "10:00"
}
```
**Resultado esperado**: ✅ Verifica disponibilidad en el nuevo taller

#### 4. Actualización Sin Cambio de Taller
```bash
PATCH /api/appointments/update/{appointment_id}
{
  "status": "confirmed"
}
```
**Resultado esperado**: ✅ Mantiene el taller original

### Validaciones Implementadas

#### Backend
- ✅ Validación de que el nuevo taller pertenezca al mismo dealership
- ✅ Verificación de disponibilidad en el nuevo taller
- ✅ Resolución automática del taller principal cuando no se especifica
- ✅ Detección automática de agencias multi-taller
- ✅ Lista completa de talleres disponibles
- ✅ Mantenimiento de recordatorios sin workshop_id (no requerido)
- ✅ Compatibilidad con citas existentes sin workshop_id

#### Frontend
- ✅ Selector de taller en panel de configuración
- ✅ Carga/guardado de configuración por taller
- ✅ Estados de loading independientes
- ✅ Validación de taller seleccionado

## 📈 Impacto

### Beneficios
1. **Flexibilidad Operacional**: Las agencias pueden mover citas entre talleres según disponibilidad
2. **Gestión Independiente**: Cada taller puede tener su propia configuración de horarios
3. **Configuración Específica**: Cada taller puede tener diferentes shift_duration, timezone, etc.
4. **Detección Automática**: El sistema detecta automáticamente si es multi-taller
5. **Lista Completa**: Se pueden ver todos los talleres disponibles
6. **Compatibilidad**: Funciona con agencias de un solo taller sin cambios
7. **Escalabilidad**: Fácil agregar nuevos talleres sin modificar código

### Consideraciones
- Los recordatorios no requieren workshop_id (mantienen dealership_id)
- Las citas existentes mantienen su workshop_id original
- La validación asegura que solo se usen talleres del mismo dealership
- operating_hours y blocked_dates siguen a nivel dealership (no por taller)
- Nuevos campos `is_multi_workshop` y `all_workshops` son opcionales para clientes existentes

## 🔄 Flujo de Cambio de Taller

1. **Usuario selecciona nuevo taller** en la interfaz
2. **Frontend envía PATCH** con nuevo workshop_id
3. **Backend valida** que el taller pertenezca al dealership
4. **Se verifica disponibilidad** en el nuevo taller
5. **Se actualiza la cita** con el nuevo workshop_id
6. **Se mantienen recordatorios** sin cambios (no requieren workshop_id)

## 🔄 Flujo de Información de Dealership

1. **Cliente solicita información** con o sin workshop_id
2. **Backend resuelve workshop_id** (específico o principal)
3. **Se consulta configuración** del taller específico
4. **Se detecta si es multi-taller** automáticamente
5. **Se retorna información completa** incluyendo lista de todos los talleres

## 🔄 Flujo de Detección Multi-Taller

1. **Agente AI consulta** información de dealership
2. **Sistema detecta** `is_multi_workshop: true/false`
3. **Si es multi-taller**, muestra lista de talleres disponibles
4. **Usuario selecciona** taller preferido
5. **Se usan parámetros** específicos del taller seleccionado

## 📊 Logs de Ejemplo

### Información de Dealership Multi-Taller
```
🏢 Obteniendo información de agencia: {
  explicitDealershipId: "dealership_123",
  workshopId: "workshop_2_uuid"
}
🏭 Workshop ID resuelto: {
  requested: "workshop_2_uuid",
  resolved: "workshop_2_uuid"
}
✅ Información obtenida exitosamente: {
  dealershipId: "dealership_123",
  workshopId: "workshop_2_uuid",
  isMultiWorkshop: true,
  workshopsCount: 3,
  hasConfiguration: true
}
```

### Información de Dealership de Un Solo Taller
```
🏢 Obteniendo información de agencia: {
  explicitDealershipId: "dealership_456"
}
🏭 Workshop ID resuelto: {
  requested: null,
  resolved: "workshop_primary_uuid"
}
✅ Información obtenida exitosamente: {
  dealershipId: "dealership_456",
  workshopId: "workshop_primary_uuid",
  isMultiWorkshop: false,
  workshopsCount: 1,
  hasConfiguration: true
}
```

### Cambio de Taller Exitoso
```
🏭 Validando cambio de taller: {
  oldWorkshopId: "workshop_1_uuid",
  newWorkshopId: "workshop_2_uuid"
}
✅ Taller válido para el dealership
🔍 Verificando disponibilidad: {
  date: "2024-12-15",
  time: "10:00",
  workshop_id: "workshop_2_uuid"
}
✅ Cita actualizada exitosamente
```

### Error de Taller Inválido
```
❌ Taller no válido para este dealership: {
  workshop_id: "workshop_invalid",
  dealership_id: "dealership_123"
}
```

---

**Estado**: ✅ Implementación completa y probada
**Compatibilidad**: ✅ Backward compatible con agencias de un solo taller
**Documentación**: ✅ Actualizada con ejemplos y casos de uso 