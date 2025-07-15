# Filtrado de Servicios por Workshop

## 🎯 Objetivo
Actualizar el endpoint `/api/services/list` para filtrar servicios por `workshop_id` cuando se proporcione, permitiendo obtener solo los servicios disponibles en un taller específico.

## 📁 Archivos Modificados

### Archivos Modificados
- `app/api/services/list/route.ts` - Agregado filtrado por workshop_id
- `README-services-workshop-filter.md` - Este archivo de documentación

## 🚀 Implementación

### Parámetros del Endpoint
- **`dealership_id`** (obligatorio) - ID del concesionario
- **`workshop_id`** (opcional) - ID del taller específico
- **`category`** (opcional) - Categoría de servicios

### Lógica de Filtrado

#### Con workshop_id
```typescript
// Consulta con JOIN a workshop_services
let query = supabase
  .from('services')
  .select(`
    *,
    workshop_services!inner (
      workshop_id,
      is_available
    )
  `)
  .eq('dealership_id', dealership_id)
  .eq('client_visible', true)
  .eq('workshop_services.workshop_id', workshop_id)
  .eq('workshop_services.is_available', true)
  .order('service_name');
```

#### Sin workshop_id
```typescript
// Consulta original sin filtro de workshop
let query = supabase
  .from('services')
  .select('*')
  .eq('dealership_id', dealership_id)
  .eq('client_visible', true)
  .order('service_name');
```

### Limpieza de Respuesta
Cuando se filtra por workshop, se remueven los datos de `workshop_services` de la respuesta para mantener la compatibilidad:

```typescript
const cleanData = data?.map(service => {
  const { workshop_services, ...cleanService } = service;
  return cleanService;
});
```

## 📡 Uso

### Ejemplo 1: Todos los servicios del dealership
```bash
GET /api/services/list?dealership_id=6fa78291-c16a-4c78-9fe2-9e3695d24d48
```

**Respuesta**:
```json
{
  "services": [
    {
      "id_uuid": "service_1",
      "service_name": "Cambio de aceite",
      "description": "Cambio de aceite y filtro",
      "duration_minutes": 30,
      "price": 500,
      "client_visible": true,
      "dealership_id": "6fa78291-c16a-4c78-9fe2-9e3695d24d48"
    }
  ]
}
```

### Ejemplo 2: Servicios disponibles en un taller específico
```bash
GET /api/services/list?dealership_id=6fa78291-c16a-4c78-9fe2-9e3695d24d48&workshop_id=1b95ea37-1965-4d24-b964-17e1df5cbf52
```

**Respuesta**:
```json
{
  "services": [
    {
      "id_uuid": "service_1",
      "service_name": "Cambio de aceite",
      "description": "Cambio de aceite y filtro",
      "duration_minutes": 30,
      "price": 500,
      "client_visible": true,
      "dealership_id": "6fa78291-c16a-4c78-9fe2-9e3695d24d48"
    }
  ]
}
```

### Ejemplo 3: Servicios por categoría y taller
```bash
GET /api/services/list?dealership_id=6fa78291-c16a-4c78-9fe2-9e3695d24d48&workshop_id=1b95ea37-1965-4d24-b964-17e1df5cbf52&category=mantenimiento
```

## 🔍 Logs de Debugging

### Con workshop_id
```
🔧 Obteniendo lista de servicios: {
  category: null,
  dealership_id: '6fa78291-c16a-4c78-9fe2-9e3695d24d48',
  workshop_id: '1b95ea37-1965-4d24-b964-17e1df5cbf52',
  url: 'https://www.edgarai.com.mx/api/services/list/?dealership_id=6fa78291-c16a-4c78-9fe2-9e3695d24d48&workshop_id=1b95ea37-1965-4d24-b964-17e1df5cbf52'
}
🔍 Aplicando filtro por workshop_id: 1b95ea37-1965-4d24-b964-17e1df5cbf52
⏳ Ejecutando consulta con filtro de workshop...
✅ Servicios obtenidos exitosamente para workshop: {
  count: 3,
  dealership_id: '6fa78291-c16a-4c78-9fe2-9e3695d24d48',
  workshop_id: '1b95ea37-1965-4d24-b964-17e1df5cbf52',
  category: null
}
```

### Sin workshop_id
```
🔧 Obteniendo lista de servicios: {
  category: null,
  dealership_id: '6fa78291-c16a-4c78-9fe2-9e3695d24d48',
  workshop_id: null,
  url: 'https://www.edgarai.com.mx/api/services/list/?dealership_id=6fa78291-c16a-4c78-9fe2-9e3695d24d48'
}
⏳ Ejecutando consulta sin filtro de workshop...
✅ Servicios obtenidos exitosamente: {
  count: 6,
  dealership_id: '6fa78291-c16a-4c78-9fe2-9e3695d24d48',
  category: null
}
```

## 🧪 Testing

### Casos de Prueba
1. **Sin workshop_id**: Debe retornar todos los servicios del dealership
2. **Con workshop_id válido**: Debe retornar solo servicios asignados al taller
3. **Con workshop_id inválido**: Debe retornar array vacío
4. **Con categoría y workshop_id**: Debe filtrar por ambos criterios
5. **Compatibilidad**: La respuesta debe mantener el formato original

### Datos de Prueba
- Dealership con múltiples servicios
- Taller con servicios asignados específicamente
- Servicios sin asignaciones en workshop_services

## 📈 Beneficios

### Para el Sistema
- ✅ **Filtrado preciso**: Solo servicios realmente disponibles en el taller
- ✅ **Performance**: Consulta optimizada con JOIN
- ✅ **Compatibilidad**: Mantiene formato de respuesta existente

### Para el Frontend
- ✅ **Menos datos**: Solo recibe servicios relevantes
- ✅ **Mejor UX**: No muestra servicios no disponibles
- ✅ **Filtrado automático**: No requiere lógica adicional

## 🚨 Consideraciones

### Validaciones
- Verifica que el workshop_id pertenezca al dealership_id
- Maneja casos donde no hay servicios asignados al taller
- Mantiene compatibilidad hacia atrás

### Performance
- JOIN eficiente con workshop_services
- Índices optimizados para las consultas
- Limpieza de datos innecesarios en respuesta

### Seguridad
- Valida dealership_id obligatorio
- Filtra por client_visible = true
- Verifica is_available = true en workshop_services

## 🔮 Próximos Pasos

### Mejoras Futuras
- [ ] Agregar paginación para listados grandes
- [ ] Incluir información del taller en la respuesta
- [ ] Agregar filtros adicionales (precio, duración, etc.)
- [ ] Cache de servicios por taller para mejor performance 