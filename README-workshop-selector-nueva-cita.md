# Selector de Workshop en Nueva Cita

## 🎯 Objetivo
Implementar el selector de workshop en la página de nueva cita para completar el flujo multi-workshop, permitiendo que los usuarios seleccionen específicamente en qué taller desean agendar su cita.

## 📁 Archivos Modificados

### Archivos Modificados
- **`app/backoffice/citas/nueva/page.tsx`** - Agregado selector de workshop y lógica de filtrado

## 🚀 Implementación

### 1. Nuevo Flujo de Selección
El flujo de creación de cita ahora sigue este orden lógico:

1. **Cliente** → Seleccionar cliente
2. **Vehículo** → Cargar vehículos del cliente seleccionado
3. **Taller** → Seleccionar taller específico (NUEVO)
4. **Servicio** → Filtrar servicios disponibles en el taller seleccionado
5. **Calendario** → Mostrar disponibilidad específica del taller

### 2. Nuevas Interfaces TypeScript
```typescript
interface Workshop {
  id: string;
  name: string;
  is_main: boolean;
  dealership_id: string;
  address?: string;
  city?: string;
  phone?: string;
  location_url?: string;
  is_active: boolean;
}
```

### 3. Nuevos Estados
```typescript
const [selectedWorkshop, setSelectedWorkshop] = useState<string>('');
const [workshops, setWorkshops] = useState<Workshop[]>([]);
const [filteredServices, setFilteredServices] = useState<ExtendedService[]>([]);
```

### 4. Funcionalidades Agregadas

#### Carga de Talleres
- Carga todos los talleres activos del dealership
- Ordena por taller principal primero, luego alfabéticamente
- Selecciona automáticamente el taller principal por defecto

#### Filtrado de Servicios por Taller
- Consulta la tabla `workshop_services` para obtener servicios disponibles
- Filtra servicios que están asignados al taller seleccionado
- Fallback a todos los servicios si no hay asignaciones específicas
- Resetea servicio seleccionado si no está disponible en el nuevo taller

#### Configuración Dinámica por Taller
- Carga configuración específica del taller seleccionado
- Actualiza `shift_duration` y otras configuraciones automáticamente
- Usa configuración por defecto si no existe configuración específica

#### Validación de Disponibilidad
- Incluye `workshop_id` en la consulta de disponibilidad
- Verifica disponibilidad específica del taller seleccionado
- Mantiene compatibilidad con el endpoint de availability

### 5. Componente UI Agregado

#### Selector de Taller
```tsx
<Select 
  value={selectedWorkshop || ''} 
  onValueChange={(value) => {
    console.log("Taller seleccionado:", value);
    setSelectedWorkshop(value);
    setSelectedService(''); // Resetear servicio al cambiar taller
  }}
  disabled={!selectedVehicle}
>
  <SelectTrigger>
    <SelectValue placeholder={
      !selectedVehicle 
        ? "Primero seleccione un vehículo" 
        : "Seleccione un taller"
    } />
  </SelectTrigger>
  <SelectContent>
    {workshops.length > 0 ? (
      workshops.map((workshop) => (
        <SelectItem key={workshop.id} value={workshop.id}>
          {workshop.name} {workshop.is_main && '(Principal)'}
        </SelectItem>
      ))
    ) : (
      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
        No hay talleres disponibles
      </div>
    )}
  </SelectContent>
</Select>
```

### 6. Efectos React Agregados

#### Efecto para Configuración de Taller
```typescript
useEffect(() => {
  if (selectedWorkshop) {
    loadConfig();
  }
}, [selectedWorkshop]);
```

#### Efecto para Filtrado de Servicios
```typescript
useEffect(() => {
  if (!selectedWorkshop) {
    setFilteredServices([]);
    setSelectedService('');
    return;
  }

  const filterServicesByWorkshop = async () => {
    // Lógica de filtrado de servicios por taller
  };

  filterServicesByWorkshop();
}, [selectedWorkshop, servicios]);
```

## 🔄 Flujo de Trabajo

### Crear Nueva Cita
1. **Usuario selecciona cliente** → Se cargan vehículos del cliente
2. **Usuario selecciona vehículo** → Se habilita selector de taller
3. **Usuario selecciona taller** → Se filtran servicios disponibles
4. **Usuario selecciona servicio** → Se habilita calendario
5. **Usuario selecciona fecha/hora** → Se valida disponibilidad específica del taller
6. **Usuario confirma cita** → Se crea con `workshop_id` específico

### Cambio de Taller
1. **Usuario cambia taller** → Se resetea servicio seleccionado
2. **Sistema filtra servicios** → Solo muestra servicios del nuevo taller
3. **Sistema carga configuración** → Configuración específica del taller
4. **Sistema actualiza calendario** → Disponibilidad del nuevo taller

## 🧪 Testing

### Casos de Prueba
1. **Agencia de un solo taller**: Debe mostrar solo el taller principal
2. **Agencia multi-taller**: Debe mostrar todos los talleres disponibles
3. **Cambio de taller**: Debe resetear servicio y filtrar correctamente
4. **Servicios por taller**: Debe mostrar solo servicios asignados al taller
5. **Configuración por taller**: Debe cargar configuración específica
6. **Disponibilidad por taller**: Debe verificar disponibilidad correcta

### Validaciones
- Verificar que `workshop_id` se incluya en la creación de citas
- Asegurar que servicios se filtren correctamente por taller
- Confirmar que configuración se cargue específica del taller
- Validar que disponibilidad sea específica del taller

## 📈 Impacto

### Beneficios
1. **Flujo Completo Multi-Taller**: Ahora el sistema soporta completamente agencias con múltiples talleres
2. **Selección Específica**: Los usuarios pueden elegir exactamente en qué taller agendar
3. **Servicios Filtrados**: Solo se muestran servicios disponibles en el taller seleccionado
4. **Configuración Dinámica**: Cada taller puede tener su propia configuración
5. **Disponibilidad Precisa**: La disponibilidad se calcula específicamente por taller
6. **Mejor UX**: Flujo lógico y intuitivo para el usuario

### Consideraciones
- **Compatibilidad**: Mantiene compatibilidad con agencias de un solo taller
- **Fallback**: Si no hay servicios asignados específicamente, muestra todos
- **Validación**: Incluye `workshop_id` en todas las validaciones
- **Performance**: Carga eficiente de datos con Promise.all

## 🔧 Uso

### Flujo Típico
```typescript
// 1. Seleccionar cliente
setSelectedClient(clientId);

// 2. Seleccionar vehículo
setSelectedVehicle(vehicleId);

// 3. Seleccionar taller (NUEVO)
setSelectedWorkshop(workshopId);

// 4. Seleccionar servicio (filtrado por taller)
setSelectedService(serviceId);

// 5. Seleccionar fecha/hora
setSelectedDate(date);
setSelectedSlot(time);

// 6. Crear cita con workshop_id
const appointmentData = {
  client_id: selectedClient,
  vehicle_id: selectedVehicle,
  workshop_id: selectedWorkshop, // ← NUEVO
  service_id: selectedService,
  appointment_date: selectedDate,
  appointment_time: selectedSlot,
  // ... otros campos
};
```

### Validación de Campos
```typescript
const camposFaltantes = {
  cliente: !selectedClient,
  vehiculo: !selectedVehicle,
  taller: !selectedWorkshop, // ← NUEVO
  servicio: !selectedService,
  fecha: !selectedDate,
  hora: !selectedSlot
};
```

## 🚨 Notas Importantes

1. **Orden de Selección**: El taller debe seleccionarse después del vehículo y antes del servicio
2. **Reseteo de Servicio**: Al cambiar taller, se resetea el servicio seleccionado
3. **Filtrado Dinámico**: Los servicios se filtran automáticamente según el taller
4. **Configuración Específica**: Cada taller puede tener su propia configuración
5. **Disponibilidad Precisa**: La disponibilidad se calcula específicamente por taller
6. **Compatibilidad**: Funciona tanto con agencias de un solo taller como multi-taller

## 🔄 Próximos Pasos

1. **Testing Exhaustivo**: Validar con múltiples talleres y configuraciones
2. **Optimización**: Considerar cache de servicios por taller
3. **UX Mejoras**: Agregar indicadores visuales de taller seleccionado
4. **Documentación**: Actualizar documentación de usuarios finales
5. **Monitoreo**: Agregar métricas de uso por taller

---

## 📊 Logs de Ejemplo

### Carga de Talleres
```
Talleres cargados: 3
Taller principal seleccionado por defecto: Taller Principal
```

### Filtrado de Servicios
```
Servicios disponibles para el taller: 5
No hay servicios específicos asignados al taller, mostrando todos
```

### Cambio de Taller
```
Taller seleccionado: workshop_2_uuid
Servicios disponibles para el taller: 3
```

### Creación de Cita
```
Valores al enviar: {
  cliente: "client_123",
  vehiculo: "vehicle_456", 
  taller: "workshop_2_uuid", // ← NUEVO
  servicio: "service_789",
  fecha: "2024-12-15",
  hora: "10:00"
}
``` 