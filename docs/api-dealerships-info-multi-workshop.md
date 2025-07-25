# API Dealerships Info - Soporte Multi-Taller

## 📋 Resumen
El endpoint `/api/dealerships/info` ha sido actualizado para soportar múltiples talleres por dealership, permitiendo obtener configuración específica de cada taller y detectar si una agencia es multi-taller.

## 🔄 Cambios Implementados

### Parámetros
- **Nuevo**: `workshop_id` (opcional) - UUID del taller específico
- **Mantenidos**: `dealership_id`, `dealership_phone`, `phone_number`

### Comportamiento
1. **Con `workshop_id`**: Retorna configuración específica del taller
2. **Sin `workshop_id`**: Usa automáticamente el taller principal (`is_primary = true`)
3. **`workshop_id` inválido**: Usa el taller principal por defecto

## 📡 Uso

### Ejemplo 1: Información del Taller Principal
```bash
GET /api/dealerships/info?dealership_id=dealership_123
```

**Respuesta**:
```json
{
  "dealership": { ... },
  "operating_hours": [ ... ],
  "configuration": {
    "dealership_id": "dealership_123",
    "workshop_id": "workshop_primary_uuid",
    "shift_duration": 30,
    "timezone": "America/Mexico_City",
    "shift_duration": 30,
    "custom_morning_slots": [...]
  },
  "blocked_dates": [ ... ],
  "workshop_id": "workshop_primary_uuid",
  "is_multi_workshop": false,
  "all_workshops": [
    {
      "workshop_id": "workshop_primary_uuid",
      "name": "Taller Principal",
      "is_primary": true,
      "address": "Av. Principal 123",
      "city": "CDMX",
      "phone": "555-1234",
      "location_url": "https://maps.google.com/?q=Av.+Principal+123,+CDMX",
      "is_active": true
    }
  ]
}
```

### Ejemplo 2: Información de Taller Específico (Agencia Multi-Taller)
```bash
GET /api/dealerships/info?dealership_id=dealership_123&workshop_id=workshop_2_uuid
```

**Respuesta**:
```json
{
  "dealership": { ... },
  "operating_hours": [ ... ],
  "configuration": {
    "dealership_id": "dealership_123",
    "workshop_id": "workshop_2_uuid",
    "shift_duration": 45,
    "timezone": "America/Mexico_City",
    "shift_duration": 45,
    "custom_morning_slots": [...]
  },
  "blocked_dates": [ ... ],
  "workshop_id": "workshop_2_uuid",
  "is_multi_workshop": true,
  "all_workshops": [
    {
      "workshop_id": "workshop_primary_uuid",
      "name": "Taller Principal",
      "is_primary": true,
      "address": "Av. Principal 123",
      "city": "CDMX",
      "phone": "555-1234",
      "location_url": "https://maps.google.com/?q=Av.+Principal+123,+CDMX",
      "is_active": true
    },
    {
      "workshop_id": "workshop_2_uuid",
      "name": "Taller Norte",
      "is_primary": false,
      "address": "Calle Norte 456",
      "city": "CDMX",
      "phone": "555-5678",
      "location_url": "https://maps.google.com/?q=Calle+Norte+456,+CDMX",
      "is_active": true
    },
    {
      "workshop_id": "workshop_3_uuid",
      "name": "Taller Sur",
      "is_primary": false,
      "address": "Blvd. Sur 789",
      "city": "CDMX",
      "phone": "555-9012",
      "location_url": "https://maps.google.com/?q=Blvd.+Sur+789,+CDMX",
      "is_active": true
    }
  ]
}
```

## 🔧 Implementación Técnica

### Código Clave
```typescript
// Resolver workshop_id automáticamente
const finalWorkshopId = await resolveWorkshopId(dealershipId, workshopId);

// Consultar configuración específica del taller
const configResponse = await supabase
  .from('dealership_configuration')
  .select('*')
  .eq('dealership_id', dealershipId)
  .eq('workshop_id', finalWorkshopId)
  .maybeSingle();

// Consultar todos los talleres de la agencia
const allWorkshopsResponse = await supabase
  .from('dealership_configuration')
  .select('*')
  .eq('dealership_id', dealershipId)
  .order('is_primary', { ascending: false });

// Determinar si es multi-taller
const isMultiWorkshop = allWorkshopsResponse.data && allWorkshopsResponse.data.length > 1;
```

### Logs de Debug
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

## 🧪 Casos de Prueba

### ✅ Caso Exitoso - Agencia Multi-Taller
```bash
curl "http://localhost:3000/api/dealerships/info?dealership_id=dealership_123"
```
**Resultado**: 
- `is_multi_workshop: true`
- `all_workshops` con 3 talleres
- Configuración del taller principal

### ✅ Caso Exitoso - Agencia de Un Solo Taller
```bash
curl "http://localhost:3000/api/dealerships/info?dealership_id=dealership_456"
```
**Resultado**: 
- `is_multi_workshop: false`
- `all_workshops` con 1 taller
- Configuración del taller principal

### ✅ Caso Exitoso - Taller Específico
```bash
curl "http://localhost:3000/api/dealerships/info?dealership_id=dealership_123&workshop_id=workshop_2_uuid"
```
**Resultado**: 
- `is_multi_workshop: true`
- `all_workshops` con todos los talleres
- Configuración del taller 2

### ✅ Caso Exitoso - Taller Inválido
```bash
curl "http://localhost:3000/api/dealerships/info?dealership_id=dealership_123&workshop_id=workshop_invalid"
```
**Resultado**: 
- Usa el taller principal por defecto
- `all_workshops` con todos los talleres válidos

### ❌ Caso de Error - Dealership No Encontrado
```bash
curl "http://localhost:3000/api/dealerships/info?dealership_id=dealership_invalid"
```
**Resultado**: Error 404 - "Dealership not found"

## 📊 Estructura de Respuesta

### Campos Nuevos
- **`is_multi_workshop`**: Boolean que indica si la agencia tiene múltiples talleres
- **`all_workshops`**: Array con información de todos los talleres de la agencia
- **`location_url`**: URL de Google Maps para la ubicación del taller (nuevo campo agregado en v1.2.0)

### Campos Mantenidos
- **`dealership`**: Información básica de la agencia
- **`operating_hours`**: Horarios de operación (a nivel dealership)
- **`configuration`**: Configuración específica del taller consultado
- **`blocked_dates`**: Fechas bloqueadas (a nivel dealership)
- **`workshop_id`**: UUID del taller usado para la consulta

### Estructura de `all_workshops`
```json
[
  {
    "workshop_id": "workshop_primary_uuid",
    "name": "Taller Principal",
    "is_primary": true,
    "address": "Av. Principal 123",
    "city": "CDMX",
    "phone": "555-1234",
    "location_url": "https://maps.google.com/?q=Av.+Principal+123,+CDMX",
    "is_active": true
  },
  {
    "workshop_id": "workshop_2_uuid",
    "name": "Taller Norte",
    "is_primary": false,
    "address": "Calle Norte 456",
    "city": "CDMX",
    "phone": "555-5678",
    "location_url": "https://maps.google.com/?q=Calle+Norte+456,+CDMX",
    "is_active": true
  }
]
```

## 🔒 Consideraciones de Seguridad

### Validaciones
1. **Taller pertenece al dealership**: Validado por `resolveWorkshopId`
2. **Dealership existe**: Verificado antes de consultar configuración
3. **Workshop válido**: Si no existe, usa el taller principal

### Acceso
- **Público**: No requiere autenticación
- **Filtrado**: Solo talleres del dealership especificado

## 🔄 Compatibilidad

### Backward Compatibility
- ✅ Funciona sin `workshop_id` (usa taller principal)
- ✅ Funciona con agencias de un solo taller
- ✅ Mantiene estructura de respuesta existente
- ✅ Nuevos campos son opcionales para clientes existentes

### Migración
- **No requiere cambios** en clientes existentes
- **Opcional** usar nuevos campos para multi-taller
- **Automático** fallback al taller principal

## 📈 Beneficios

1. **Detección Clara**: Saber inmediatamente si es multi-taller
2. **Lista Completa**: Ver todos los talleres disponibles
3. **Información Detallada**: Configuración de cada taller
4. **Selección Inteligente**: Permitir al usuario elegir
5. **Mejor UX**: Mostrar opciones claras al usuario
6. **Compatibilidad**: No rompe implementaciones existentes

## 🚀 Estrategia para Agente AI

### Detección de Multi-Taller
```javascript
// 1. Obtener información de dealership
const response = await fetch('/api/dealerships/info?dealership_id=dealership_123');
const { is_multi_workshop, all_workshops, configuration } = await response.json();

if (is_multi_workshop) {
  console.log('🏭 Agencia multi-taller detectada');
  console.log('📋 Talleres disponibles:', all_workshops.map(w => w.name));
  
  // Permitir al usuario elegir taller
  const availableWorkshops = all_workshops.map(w => ({
    id: w.workshop_id,
    name: w.name,
    is_primary: w.is_primary,
    shift_duration: w.shift_duration
  }));
} else {
  console.log(' Agencia de un solo taller');
  // Usar automáticamente el taller principal
}
```

### Flujo de Usuario
```javascript
// Si es multi-taller, mostrar opciones
if (is_multi_workshop) {
  const message = `Esta agencia tiene ${all_workshops.length} talleres disponibles:\n` +
    all_workshops.map(w => `• ${w.name}${w.is_primary ? ' (Principal)' : ''} - ${w.shift_duration} min`).join('\n') +
    '\n\n¿En cuál taller te gustaría agendar tu cita?';
    
  // Permitir selección
  const selectedWorkshop = await getUserSelection(all_workshops);
  workshopId = selectedWorkshop.workshop_id;
} else {
  // Usar automáticamente el taller principal
  workshopId = all_workshops[0].workshop_id;
}
```

## 🚀 Próximos Pasos

1. **Frontend**: Actualizar interfaces para usar `is_multi_workshop`
2. **Testing**: Validar con múltiples talleres
3. **Documentación**: Actualizar documentación de clientes
4. **Monitoreo**: Agregar métricas de uso por taller

---

**Estado**: ✅ Implementado y documentado
**Versión**: 1.2.0
**Compatibilidad**: ✅ Backward compatible 