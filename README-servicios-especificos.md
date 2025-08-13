# Servicios Específicos - Documentación

## Descripción

La funcionalidad de Servicios Específicos permite a las agencias crear y gestionar servicios personalizados para modelos específicos de vehículos. Esta funcionalidad complementa los servicios generales y permite ofrecer servicios más precisos y relevantes para cada tipo de vehículo.

## Características Principales

### 1. Gestión de Servicios Específicos
- **Creación**: Las agencias pueden crear servicios específicos para modelos particulares
- **Edición**: Modificación de servicios existentes
- **Activación/Desactivación**: Control del estado de los servicios
- **Eliminación**: Remoción de servicios específicos

### 2. Filtros Avanzados
- **Búsqueda por texto**: Nombre del servicio, marca o modelo
- **Filtro por marca**: Filtrar por marca de vehículo
- **Filtro por modelo**: Filtrar por modelo específico
- **Filtro por servicio base**: Filtrar por servicio general asociado
- **Filtro por estado**: Mostrar solo servicios activos o todos

### 3. Campos del Servicio Específico
- **Modelo de vehículo**: Marca y modelo específico
- **Nombre del servicio**: Descripción del servicio
- **Kilometraje**: Intervalo de kilometraje para el servicio
- **Meses**: Intervalo de tiempo en meses
- **Precio**: Costo del servicio
- **Servicio base**: Servicio general asociado (opcional)
- **Adicional**: Servicio adicional con precio y descripción
- **Estado**: Activo/Inactivo

## Estructura de la Base de Datos

### Tabla: `specific_services`
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

## Endpoints API

### 1. Listar Servicios Específicos
```
GET /api/services/specific/list?dealership_id={id}&make_id={id}&model_id={id}&service_id={id}&is_active={boolean}&search={text}
```

### 2. Crear Servicio Específico
```
POST /api/services/specific/create
Body: {
  model_id: string,
  dealership_id: string,
  service_name: string,
  kilometers: number,
  months: number,
  price: number,
  service_id?: string,
  additional_price?: number,
  additional_description?: string,
  includes_additional?: boolean,
  is_active?: boolean
}
```

### 3. Actualizar Servicio Específico
```
PUT /api/services/specific/update/{id}
Body: {
  model_id: string,
  service_name: string,
  kilometers: number,
  months: number,
  price: number,
  service_id?: string,
  additional_price?: number,
  additional_description?: string,
  includes_additional?: boolean,
  is_active?: boolean
}
```

### 4. Eliminar Servicio Específico
```
DELETE /api/services/specific/update/{id}
```

### 5. Obtener Marcas y Modelos
```
GET /api/vehicles/makes-models?make_id={id}
```

## Navegación

### Sección de Administración
Los Servicios Específicos están disponibles en la sección "Administración" del sidebar:
- **Ruta**: `/backoffice/servicios-especificos`
- **Icono**: Llave inglesa (Wrench)
- **Posición**: En "Administración" → "Servicios Específicos"

### Acceso
- Desde el sidebar, expandir "Administración" y hacer clic en "Servicios Específicos"
- URL directa: `/backoffice/servicios-especificos?token=TU_TOKEN_JWT`

## Interfaz de Usuario

### Página Principal de Servicios Específicos
- **Header**: Título, descripción y botón de crear
- **Filtros**: Panel de filtros avanzados
- **Tabla**: Lista de servicios con acciones
- **Modales**: Formularios de creación y edición

### Componentes Utilizados
- **Cards**: Para organizar secciones
- **Tables**: Para mostrar datos
- **Dialogs**: Para formularios
- **Selects**: Para filtros y selecciones
- **Switches**: Para toggles
- **Badges**: Para estados y etiquetas

## Flujo de Trabajo

### 1. Crear Servicio Específico
1. Navegar a Servicios Específicos
2. Hacer clic en "Nuevo Servicio Específico"
3. Seleccionar marca y modelo
4. Completar información del servicio
5. Configurar adicional (opcional)
6. Guardar

### 2. Editar Servicio Específico
1. En la tabla, hacer clic en "Editar servicio"
2. Modificar campos necesarios
3. Guardar cambios

### 3. Gestionar Estado
1. Usar el menú de acciones
2. Seleccionar "Activar" o "Desactivar"
3. Confirmar cambio

## Validaciones

### Campos Requeridos
- Modelo de vehículo
- Nombre del servicio
- Kilometraje (debe ser > 0)
- Meses (debe ser > 0)

### Validaciones de Negocio
- El kilometraje debe ser un valor positivo
- Los meses deben ser un valor positivo
- El precio puede ser 0 o mayor
- El servicio base es opcional

## Integración con Servicios Existentes

### Relación con Servicios Generales
- Los servicios específicos pueden estar asociados a un servicio general
- Esto permite mantener consistencia en la estructura de servicios
- Facilita la gestión y reportes

### Uso en Citas
- Los servicios específicos pueden ser utilizados al crear citas
- Se almacena la referencia en la tabla `appointment` (campo `specific_service_id`)
- Permite trazabilidad completa

## Consideraciones Técnicas

### Performance
- Los filtros se aplican en el frontend para mejor experiencia
- Las consultas a la base de datos incluyen joins optimizados
- Se utiliza paginación para grandes volúmenes de datos

### Seguridad
- Validación de token JWT para autenticación
- Filtrado por `dealership_id` para aislamiento de datos
- Validación de entrada en todos los endpoints

### Mantenibilidad
- Código modular y reutilizable
- Interfaces TypeScript bien definidas
- Documentación completa de endpoints

## Próximas Mejoras

### Funcionalidades Planificadas
1. **Importación masiva**: Cargar servicios desde archivos CSV
2. **Plantillas**: Crear plantillas de servicios específicos
3. **Reportes**: Análisis de uso de servicios específicos
4. **Notificaciones**: Alertas para servicios próximos a vencer

### Mejoras de UX
1. **Búsqueda avanzada**: Filtros más sofisticados
2. **Vista de calendario**: Visualización temporal de servicios
3. **Drag & Drop**: Reordenamiento visual de servicios
4. **Bulk actions**: Acciones masivas en múltiples servicios
