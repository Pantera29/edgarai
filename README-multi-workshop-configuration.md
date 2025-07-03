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