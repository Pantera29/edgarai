# Configuración de Agencias - Gestión de Marcas y Mapeos

## 🎯 Objetivo
Permitir la configuración específica de cada agencia desde la interfaz de administración de plataforma, gestionando marcas de vehículos permitidas y mapeos de teléfono para WhatsApp.

## 📁 Archivos Creados/Modificados

### Archivos Modificados
- **`app/backoffice/plataforma/agencias/page.tsx`** - Agregado botón de configuración y modal de configuración

### Documentación
- **`README-agency-configuration.md`** - Este archivo

## 🚀 Implementación

### Funcionalidades Agregadas

#### 1. Botón de Configuración por Agencia
- **Ubicación**: Columna "Acciones" en la tabla de agencias
- **Icono**: Settings (⚙️)
- **Acción**: Abre modal de configuración específica para la agencia

#### 2. Modal de Configuración con Pestañas
- **Pestaña "Marcas de Vehículos"**: Gestión de marcas permitidas
- **Pestaña "Mapeos de Teléfono"**: Gestión de mapeos para WhatsApp
- **Interfaz**: Modal responsive con scroll para contenido extenso

### Gestión de Marcas de Vehículos

#### Funcionalidades
- **Visualización**: Grid de todas las marcas disponibles con estado visual
- **Toggle**: Click para habilitar/deshabilitar marcas (cambios pendientes)
- **Contador**: Muestra marcas habilitadas vs total disponible
- **Guardado**: Botón "Guardar Cambios" para persistir modificaciones
- **Indicadores**: Muestra cuando hay cambios pendientes sin guardar

#### Interfaz Visual
```typescript
// Marcas habilitadas: Verde con check
// Marcas deshabilitadas: Gris sin check
// Click para cambiar estado (cambios pendientes)
// Botón "Guardar Cambios" aparece cuando hay cambios
// Indicador "• Cambios pendientes" en la parte superior
```

#### Flujo de Trabajo
1. **Selección**: Click en marcas para habilitar/deshabilitar
2. **Feedback Visual**: Cambios se reflejan inmediatamente en la UI
3. **Indicador**: Aparece "• Cambios pendientes" y botón de guardar
4. **Persistencia**: Click en "Guardar Cambios" para guardar en base de datos
5. **Confirmación**: Al cerrar con cambios pendientes, pide confirmación

#### Estructura de Datos
```sql
-- Tabla: dealership_brands
dealership_id: UUID (referencia a dealerships.id)
make_id: UUID (referencia a vehicle_makes.id)
```

### Gestión de Mapeos de Teléfono

#### Funcionalidades
- **Listado**: Muestra todos los mapeos existentes para la agencia
- **Agregar**: Formulario para nuevos mapeos con validación
- **Eliminar**: Botón de eliminación con confirmación
- **Campos**: Número de teléfono (requerido) y Whapi ID (opcional)

#### Formulario de Agregar Mapeo
```typescript
interface NewMapping {
  phone_number: string;  // Formato: 525512345678
  whapi_id?: string;     // ID de WhatsApp (opcional)
}
```

#### Estructura de Datos
```sql
-- Tabla: dealership_mapping
id: UUID (primary key)
dealership_id: UUID (referencia a dealerships.id)
phone_number: TEXT (formato normalizado)
whapi_id: TEXT (opcional)
created_at: TIMESTAMP
```

## 🔧 Componentes Técnicos

### AgencyConfigContent
Componente interno que maneja toda la lógica de configuración:

```typescript
interface AgencyConfigContentProps {
  agency: Agency;
  token: string;
  onClose: () => void;
}
```

#### Estados del Componente
- `activeTab`: Controla la pestaña activa ('brands' | 'mapping')
- `brands`: Marcas configuradas para la agencia
- `allBrands`: Todas las marcas disponibles
- `mappings`: Mapeos de teléfono existentes
- `loading`: Estado de carga de datos
- `saving`: Estado de guardado de cambios
- `pendingBrandChanges`: Set de cambios pendientes en marcas
- `hasUnsavedChanges`: Indica si hay cambios sin guardar

#### Funciones Principales
- `loadData()`: Carga datos iniciales de marcas y mapeos
- `handleBrandToggle()`: Marca cambios pendientes en marcas (no guarda automáticamente)
- `saveChanges()`: Guarda todos los cambios pendientes de marcas
- `handleAddMapping()`: Agrega nuevo mapeo de teléfono
- `handleDeleteMapping()`: Elimina mapeo existente
- `handleClose()`: Maneja cierre con confirmación de cambios pendientes

### Integración con Supabase

#### Consultas de Marcas
```typescript
// Cargar marcas configuradas para la agencia
const { data: brandsData } = await supabase
  .from('dealership_brands')
  .select(`
    make_id,
    vehicle_makes!inner (
      id,
      name
    )
  `)
  .eq('dealership_id', agency.id);

// Cargar todas las marcas disponibles
const { data: allBrandsData } = await supabase
  .from('vehicle_makes')
  .select('id, name')
  .order('name');
```

#### Consultas de Mapeos
```typescript
// Cargar mapeos de teléfono
const { data: mappingsData } = await supabase
  .from('dealership_mapping')
  .select('*')
  .eq('dealership_id', agency.id)
  .order('created_at');
```

## 🎨 Interfaz de Usuario

### Diseño Responsive
- **Modal**: Máximo 4xl de ancho, 80vh de alto con scroll
- **Grid de Marcas**: 2 columnas en móvil, 3 en desktop
- **Formularios**: Layout responsive con grid adaptativo

### Estados Visuales
- **Loading**: Spinner con texto "Cargando configuración..."
- **Saving**: Botones deshabilitados con spinner
- **Marcas**: Verde para habilitadas, gris para deshabilitadas
- **Mapeos**: Lista con botones de eliminación

### Navegación
- **Tabs**: Pestañas para cambiar entre marcas y mapeos
- **Botones**: Cerrar modal desde cualquier pestaña
- **Acciones**: Botones contextuales en cada sección

## 🔒 Seguridad y Validación

### Validaciones de Entrada
- **Número de Teléfono**: Requerido, formato libre (se normaliza)
- **Whapi ID**: Opcional, texto libre
- **Marcas**: Solo IDs válidos de `vehicle_makes`

### Filtrado por Agencia
- **Dealership ID**: Todas las consultas filtran por `agency.id`
- **RLS**: Respetado automáticamente por Supabase
- **Acceso**: Solo agencias autorizadas para plataforma

### Confirmaciones
- **Eliminar Mapeo**: Confirmación antes de eliminar
- **Errores**: Mensajes de error descriptivos
- **Éxito**: Logs de consola para debugging

## 📊 Logging y Debugging

### Logs Incluidos
```typescript
console.log('✅ Configuración de marcas actualizada');
console.log('✅ Mapeo agregado exitosamente');
console.log('✅ Mapeo eliminado exitosamente');
console.error('❌ Error actualizando marcas:', error);
console.error('❌ Error agregando mapeo:', error);
console.error('❌ Error eliminando mapeo:', error);
```

### Estados de Debugging
- **Loading**: Indicador visual durante carga
- **Saving**: Indicador visual durante guardado
- **Errores**: Alertas para errores críticos
- **Éxito**: Feedback visual para acciones completadas

## 🚀 Beneficios

### Para Administradores
- **Configuración Centralizada**: Todo desde la interfaz de agencias
- **Gestión Visual**: Interfaz intuitiva con estados claros
- **Acceso Rápido**: No hay que navegar a otras secciones
- **Validación en Tiempo Real**: Feedback inmediato de cambios

### Para el Sistema
- **Consistencia**: Configuración específica por agencia
- **Escalabilidad**: Fácil agregar nuevas agencias
- **Mantenibilidad**: Código modular y reutilizable
- **Performance**: Carga eficiente de datos filtrados

### Para Usuarios Finales
- **Marcas Relevantes**: Solo ven marcas configuradas para su agencia
- **WhatsApp Funcional**: Mapeos correctos para envío de mensajes
- **Experiencia Mejorada**: Configuración específica por contexto

## 🔮 Próximos Pasos

### Mejoras Potenciales
1. **Búsqueda en Marcas**: Filtro de texto para marcas
2. **Bulk Actions**: Seleccionar múltiples marcas
3. **Import/Export**: Cargar configuraciones desde archivos
4. **Templates**: Configuraciones predefinidas por tipo de agencia
5. **Audit Log**: Historial de cambios en configuración

### Integraciones Futuras
1. **API Endpoints**: Endpoints específicos para configuración
2. **Webhooks**: Notificaciones de cambios de configuración
3. **Sincronización**: Sync automático con sistemas externos
4. **Backup**: Respaldo automático de configuraciones

---

**Estado**: ✅ Implementado y documentado
**Versión**: 1.0.0
**Compatibilidad**: ✅ Integrado con sistema existente
**Impacto**: 🎯 Mejora significativa en UX de administración 