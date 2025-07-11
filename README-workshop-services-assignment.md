# Asignación de Servicios a Talleres

## 🎯 Objetivo
Implementar funcionalidad para asignar servicios específicos a talleres particulares, permitiendo que cada taller tenga su propia configuración de servicios disponibles. Esto es crucial para el sistema multi-workshop donde diferentes ubicaciones pueden ofrecer servicios distintos.

## 📁 Archivos Modificados

### Archivos Modificados
- **`app/backoffice/servicios/page.tsx`** - Agregada funcionalidad completa de asignación de talleres

## 🚀 Implementación

### 1. Nuevas Interfaces TypeScript
```typescript
interface Workshop {
  id: string
  name: string
  is_main: boolean
  dealership_id: string
}

interface WorkshopService {
  id: string
  workshop_id: string
  service_id: string
  is_available: boolean
  workshop: {
    name: string
  }
}

interface Servicio {
  // ... campos existentes ...
  workshop_services?: WorkshopService[]
}
```

### 2. Nuevas Funcionalidades

#### Carga de Datos
- **`cargarTalleres()`**: Carga todos los talleres del dealership ordenados por taller principal
- **Estado `talleres`**: Almacena la lista de talleres disponibles
- **Estado `selectedWorkshops`**: Almacena los talleres seleccionados en el formulario

#### Creación de Servicios
1. Crear el servicio en la tabla `services`
2. Asignar el servicio a los talleres seleccionados en `workshop_services`
3. Manejo de errores separado para cada operación

#### Edición de Servicios
1. Cargar talleres asignados al servicio con `getAssignedWorkshops()`
2. Actualizar datos del servicio
3. Eliminar asignaciones existentes en `workshop_services`
4. Crear nuevas asignaciones según selección del usuario

#### Visualización
- Nueva columna "Talleres Asignados" en la tabla
- Badges que muestran talleres asignados
- Indicadores visuales para taller principal

### 3. Componentes UI Agregados

#### Selector de Talleres
```tsx
<Select onValueChange={(value) => {
  if (!selectedWorkshops.includes(value)) {
    setSelectedWorkshops([...selectedWorkshops, value])
  }
}}>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar talleres" />
  </SelectTrigger>
  <SelectContent>
    {talleres.map((taller) => (
      <SelectItem key={taller.id} value={taller.id}>
        {taller.name} {taller.is_main && '(Principal)'}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Badges de Talleres Seleccionados
```tsx
{selectedWorkshops.map((workshopId) => {
  const taller = talleres.find(t => t.id === workshopId)
  return (
    <Badge 
      key={workshopId} 
      variant="secondary"
      className="cursor-pointer"
      onClick={() => setSelectedWorkshops(prev => 
        prev.filter(id => id !== workshopId)
      )}
    >
      {taller?.name} {taller?.is_main && '(Principal)'} ×
    </Badge>
  )
})}
```

## 🔄 Flujo de Trabajo

### Crear Nuevo Servicio
1. Usuario completa datos del servicio
2. Selecciona talleres donde estará disponible
3. Sistema crea registro en `services`
4. Sistema crea registros en `workshop_services` para cada taller seleccionado
5. Se muestra confirmación y se actualiza la lista

### Editar Servicio Existente
1. Sistema carga talleres asignados al servicio
2. Usuario modifica datos del servicio
3. Usuario modifica selección de talleres
4. Sistema actualiza registro en `services`
5. Sistema elimina asignaciones existentes en `workshop_services`
6. Sistema crea nuevas asignaciones según selección actual
7. Se muestra confirmación y se actualiza la lista

### Eliminar Servicio
1. Sistema elimina registro de `services`
2. Las asignaciones en `workshop_services` se eliminan automáticamente por CASCADE

## 🧪 Testing

### Casos de Prueba
1. **Crear servicio sin talleres**: Debe permitir crear servicio sin asignar talleres
2. **Crear servicio con múltiples talleres**: Debe asignar correctamente a todos los talleres seleccionados
3. **Editar talleres de servicio**: Debe actualizar correctamente las asignaciones
4. **Eliminar servicio**: Debe eliminar servicio y todas sus asignaciones
5. **Validación de dealership**: Solo debe mostrar talleres del dealership correcto

### Datos de Prueba
- Dealership con múltiples talleres
- Servicios existentes con y sin asignaciones
- Taller principal marcado correctamente

## 📊 Impacto en el Sistema

### Endpoints Afectados
- **`/api/appointments/availability`**: Ya usa `workshop_services` para validar disponibilidad
- **`/api/appointments/create`**: Debe validar que el servicio esté disponible en el taller
- **`/api/services/list`**: Debe filtrar por talleres disponibles

### Validaciones Agregadas
- Verificación de que el servicio esté disponible en el taller antes de crear citas
- Filtrado de servicios por taller en listados
- Validación de permisos por dealership

## 🚨 Consideraciones Importantes

### Migración de Datos
- Los servicios existentes no tendrán asignaciones en `workshop_services`
- Se recomienda asignar todos los servicios existentes al taller principal
- Script de migración opcional para asignar servicios existentes

### Compatibilidad
- El sistema mantiene compatibilidad hacia atrás
- Servicios sin asignaciones en `workshop_services` se consideran disponibles en todos los talleres
- Gradual migration path para agencias existentes

### Performance
- Índices optimizados para consultas frecuentes
- JOIN eficiente en carga de servicios
- Paginación para listados grandes

## 📈 Métricas y Monitoreo

### Logs Importantes
- Creación de asignaciones workshop-service
- Errores en asignación de talleres
- Validaciones de disponibilidad por taller

### Métricas a Monitorear
- Número de servicios por taller
- Servicios sin asignaciones
- Errores en validaciones de disponibilidad

## 🚀 Próximos Pasos

1. **Validación en creación de citas**: Asegurar que solo se puedan crear citas para servicios disponibles en el taller
2. **Filtrado en listados**: Actualizar endpoints de servicios para filtrar por taller
3. **UI de gestión masiva**: Permitir asignar/desasignar múltiples servicios a talleres
4. **Reportes**: Dashboard de servicios por taller

---

**Nota**: Esta implementación es compatible con el sistema multi-workshop existente y mantiene la arquitectura API-first del proyecto. 