# Servicios Específicos - Implementación en Sidebar

## Resumen de Cambios

Se ha implementado la funcionalidad de **Servicios Específicos** en la sección "Administración" del sidebar, permitiendo a las agencias gestionar servicios personalizados para modelos específicos de vehículos.

## Cambios Realizados

### 1. Configuración de Navegación
**Archivo**: `components/sidebar.tsx`

Se agregó la nueva sección en la sección "Administración":
```typescript
{
  title: "Servicios Específicos",
  href: "/backoffice/servicios-especificos",
  icon: Wrench
}
```

**Posición**: En la sección "Administración", después de "Servicios"

### 2. Nueva Página Principal
**Archivo**: `app/backoffice/servicios-especificos/page.tsx`

Se creó una página completa con:
- **Listado de servicios específicos** con tabla organizada
- **Filtros avanzados**: búsqueda, marca, modelo, servicio base, estado
- **Formularios de creación y edición** con validaciones
- **Acciones**: crear, editar, activar/desactivar, eliminar
- **Interfaz moderna** con componentes shadcn/ui

### 3. Funcionalidades Implementadas

#### ✅ Gestión Completa
- [x] **Crear** servicios específicos por modelo
- [x] **Editar** servicios existentes
- [x] **Activar/Desactivar** servicios
- [x] **Eliminar** servicios
- [x] **Filtrar** por múltiples criterios

#### ✅ Interfaz de Usuario
- [x] **Tabla responsiva** con información detallada
- [x] **Filtros en tiempo real** para búsqueda eficiente
- [x] **Formularios intuitivos** con validaciones
- [x] **Notificaciones** de éxito y error
- [x] **Diseño consistente** con el resto de la aplicación

#### ✅ Campos del Servicio
- [x] **Marca y Modelo** de vehículo
- [x] **Nombre del servicio** específico
- [x] **Kilometraje** recomendado
- [x] **Meses** recomendados
- [x] **Precio** del servicio
- [x] **Servicio base** asociado (opcional)
- [x] **Adicional** con precio y descripción
- [x] **Estado** activo/inactivo

### 4. Estructura de Datos

La funcionalidad utiliza la tabla `specific_services` existente:
```sql
- id (UUID, PK)
- model_id (UUID, FK a vehicle_models)
- dealership_id (UUID, FK a dealerships)
- service_name (VARCHAR)
- kilometers (INTEGER)
- months (INTEGER)
- price (NUMERIC)
- is_active (BOOLEAN)
- service_id (UUID, FK a services, opcional)
- additional_price (NUMERIC)
- additional_description (TEXT)
- includes_additional (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 5. Integración con Sistema Existente

#### Autenticación
- Utiliza el sistema de tokens JWT existente
- Verificación de `dealership_id` para aislamiento de datos
- Redirección automática a login si no hay token válido

#### Componentes UI
- Utiliza la librería shadcn/ui existente
- Mantiene consistencia visual con el resto de la aplicación
- Componentes reutilizables y accesibles

#### Base de Datos
- Integración con tablas existentes (`vehicle_makes`, `vehicle_models`, `services`)
- Consultas optimizadas con joins
- Manejo de errores consistente

## Cómo Acceder

### Desde la Aplicación
1. Iniciar sesión en la plataforma
2. En el sidebar izquierdo, expandir la sección "Administración"
3. Hacer clic en "Servicios Específicos"

### URL Directa
```
/backoffice/servicios-especificos?token=TU_TOKEN_JWT
```

## Flujo de Trabajo Típico

### 1. Crear un Servicio Específico
1. Acceder a "Servicios Específicos"
2. Hacer clic en "Nuevo Servicio Específico"
3. Seleccionar marca y modelo de vehículo
4. Completar información del servicio:
   - Nombre del servicio
   - Kilometraje recomendado
   - Meses recomendados
   - Precio
   - Servicio base (opcional)
   - Adicional (opcional)
5. Guardar

### 2. Gestionar Servicios Existentes
1. Usar los filtros para encontrar servicios específicos
2. Utilizar las acciones de la tabla:
   - **Editar**: Modificar información del servicio
   - **Activar/Desactivar**: Cambiar estado
   - **Eliminar**: Remover servicio

## Ventajas de la Implementación

### Para las Agencias
- **Gestión centralizada** de servicios específicos
- **Filtros avanzados** para encontrar servicios rápidamente
- **Interfaz intuitiva** para crear y editar servicios
- **Control total** sobre servicios por modelo

### Para los Desarrolladores
- **Código modular** y reutilizable
- **Integración perfecta** con sistema existente
- **Mantenimiento sencillo** con estructura clara
- **Escalabilidad** para futuras funcionalidades

## Próximas Mejoras

### Funcionalidades Planificadas
- [ ] **Integración con citas**: Usar servicios específicos al crear citas
- [ ] **Reportes**: Analytics de uso de servicios específicos
- [ ] **Importación masiva**: Cargar servicios desde archivos
- [ ] **Plantillas**: Crear plantillas de servicios comunes

### Mejoras de UX
- [ ] **Búsqueda avanzada**: Filtros más sofisticados
- [ ] **Vista de calendario**: Visualización temporal
- [ ] **Acciones masivas**: Operaciones en múltiples servicios
- [ ] **Notificaciones**: Alertas para servicios próximos a vencer

## Consideraciones Técnicas

### Performance
- Filtrado en el cliente para mejor experiencia
- Consultas optimizadas a la base de datos
- Carga lazy de datos cuando sea necesario

### Seguridad
- Validación de tokens JWT
- Filtrado por `dealership_id`
- Sanitización de datos de entrada

### Mantenibilidad
- Código TypeScript bien tipado
- Interfaces claras y documentadas
- Separación de responsabilidades

## Conclusión

La implementación de Servicios Específicos como sección independiente en el sidebar proporciona una solución completa y elegante para que las agencias gestionen servicios personalizados por modelo de vehículo. La funcionalidad está completamente integrada con el sistema existente y mantiene la consistencia en diseño y experiencia de usuario.
