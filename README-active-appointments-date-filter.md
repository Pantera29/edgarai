# Filtrado por Fecha en Active Appointments

## 🎯 Objetivo

Mejorar el endpoint `/api/customers/[id]/active-appointments` para que además de filtrar por estado (`pending`, `confirmed`), también filtre por fecha y excluya automáticamente las citas con fechas pasadas.

## 📁 Archivos Modificados

### `app/api/customers/[id]/active-appointments/route.ts`
- **Líneas modificadas**: ~15-60
- **Cambio principal**: Agregado filtro `.gte('appointment_date', todayString)`

### `docs/api-appointments-analysis.md`
- **Sección actualizada**: Endpoint #5 - active-appointments
- **Cambio**: Documentación de nueva funcionalidad de filtrado por fecha

## 🚀 Implementación

### Lógica de Filtrado por Fecha con Timezone del Dealership
```typescript
// 1. Obtener dealership_id del cliente
const { data: client } = await supabase
  .from('client')
  .select('id, dealership_id')
  .eq('id', clientId)
  .single();

// 2. Obtener configuración del dealership (incluyendo timezone)
const workshopId = await resolveWorkshopId(client.dealership_id, supabase);
const dealershipConfig = await getWorkshopConfiguration(client.dealership_id, workshopId, supabase);
const timezone = dealershipConfig?.timezone || 'America/Mexico_City';

// 3. Calcular fecha actual en timezone del dealership
const now = new Date();
const localDate = utcToZonedTime(now, timezone);
const todayString = format(localDate, 'yyyy-MM-dd');

// 4. Aplicar filtro en la consulta Supabase
let query = supabase
  .from('appointment')
  .select(/* campos */)
  .eq('client_id', clientId)
  .in('status', ['pending', 'confirmed'])
  .gte('appointment_date', todayString) // NUEVO: Filtro por fecha >= hoy (hora local)
  .order('appointment_date', { ascending: false });
```

### Filtros Aplicados Simultáneamente
1. **Por Cliente**: `client_id = [id]`
2. **Por Estado**: `status IN ('pending', 'confirmed')`  
3. **Por Fecha**: `appointment_date >= YYYY-MM-DD` ✨ **NUEVO** (calculada en timezone del dealership)

## 📊 Comportamiento Antes vs Después

### ❌ Comportamiento Anterior
```json
// GET /api/customers/123/active-appointments
{
  "appointments": [
    {
      "id": 1,
      "appointment_date": "2024-01-10", // ← Fecha pasada incluida
      "status": "pending"
    },
    {
      "id": 2, 
      "appointment_date": "2024-12-25", // ← Fecha futura
      "status": "confirmed"
    }
  ]
}
```

### ✅ Comportamiento Actual
```json
// GET /api/customers/123/active-appointments
{
  "appointments": [
    {
      "id": 2,
      "appointment_date": "2024-12-25", // ← Solo fechas futuras
      "status": "confirmed"
    }
    // La cita con fecha pasada ya NO aparece
  ]
}
```

## 🔍 Casos de Uso Cubiertos

### ✅ Incluye
- Citas con estado `pending` o `confirmed`
- Citas con fecha de **hoy** en adelante
- Citas programadas para el futuro

### ❌ Excluye Automáticamente
- Citas con fechas **anteriores a hoy**
- Citas con estado `completed`, `cancelled`, `in_progress`
- **No considera la hora** - solo la fecha

## 🧪 Testing

### Escenarios de Prueba
1. **Cliente con citas futuras y pasadas**: Solo retorna las futuras
2. **Cliente con todas las citas pasadas**: Retorna array vacío
3. **Cliente con citas de hoy**: Las incluye (fecha >= hoy)
4. **Cliente sin citas**: Retorna mensaje "No se encontraron citas activas"

### Comandos de Prueba
```bash
# Prueba básica
curl "http://localhost:3000/api/customers/123/active-appointments"

# Verificar logs en consola para ver filtros aplicados:
# 🔍 Query construida: {
#   filters: {
#     client_id: "123",
#     status: ['pending', 'confirmed'],
#     appointment_date: ">= 2024-12-19"  ← Fecha actual
#   }
# }
```

## 📈 Beneficios

### Para el Usuario
✅ **Experiencia mejorada**: Solo ve citas relevantes (futuras)
✅ **Interfaz más limpia**: No hay confusión con citas pasadas
✅ **Datos actualizados**: Información siempre relevante

### Para el Sistema
✅ **Menos transferencia de datos**: Menos registros retornados
✅ **Consultas más eficientes**: Filtrado en base de datos
✅ **Lógica centralizadas**: El filtro se aplica automáticamente

### Para Desarrolladores
✅ **Logging mejorado**: Incluye información del filtro por fecha
✅ **Depuración simplificada**: Logs muestran exactly qué filtros se aplican
✅ **Mantenimiento**: Lógica clara y bien documentada

## 🔧 Consideraciones Técnicas

### Zona Horaria
- **Implementación actual**: Usa timezone configurado del dealership (ej: 'America/Mexico_City')
- **Fallback**: Si falla la configuración, usa UTC
- **Precisión**: La fecha "hoy" se calcula en la zona horaria local del dealership

### Rendimiento
- **Impacto**: Mínimo - Supabase maneja el filtrado eficientemente
- **Índices**: `appointment_date` probablemente ya tiene índice

### Compatibilidad
- **Backward compatible**: No rompe implementaciones existentes
- **API contract**: Mantiene la misma estructura de respuesta

## 🚨 Notas Importantes

⚠️ **Solo filtra por fecha, NO por hora**: Una cita de hoy a las 8:00 AM se incluirá incluso si ya pasó esa hora

✅ **Zona horaria**: Usa la configuración del dealership (`dealership_configuration.timezone`)

✅ **Fallback robusto**: Si falla la configuración, automáticamente usa UTC como respaldo

⚠️ **Formato de fecha**: Asume que `appointment_date` está en formato `YYYY-MM-DD` en la base de datos

🔧 **Dependencias agregadas**: `date-fns`, `date-fns-tz`, `@/lib/workshop-resolver`

## 🎯 Impacto en Flujos de Trabajo

### Frontend Components
Los componentes que consumen este endpoint automáticamente recibirán datos más relevantes sin necesidad de filtrado adicional en el cliente.

### Mobile Apps  
Aplicaciones móviles verán mejor rendimiento al recibir menos datos y más relevantes.

### Dashboards
Dashboards que muestran "citas próximas" ahora tendrán datos más precisos automáticamente.