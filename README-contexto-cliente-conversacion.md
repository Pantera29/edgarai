# Panel de Contexto del Cliente en Conversaciones

## Descripción
Se ha implementado una nueva funcionalidad que enriquece el panel de información en la vista de conversación individual, agregando contexto relevante del cliente sin necesidad de salir de la conversación.

## Funcionalidades Implementadas

### 1. Sección "Vehículos del Cliente"
- **Límite**: Máximo 3 vehículos más recientes
- **Información mostrada**:
  - Marca y modelo del vehículo
  - Año
  - Placa (si existe)
  - Fecha del último servicio (si existe)
- **Ordenamiento**: Por fecha de creación descendente (más reciente primero)
- **Estados**: Loading, error, vacío, y datos

### 2. Sección "Servicios Recientes"
- **Límite**: Máximo 3 servicios más recientes
- **Información mostrada**:
  - Nombre del servicio
  - Vehículo asociado (marca y modelo)
  - Estado con badge de color
  - Fecha del servicio
- **Ordenamiento**: Por fecha de cita descendente
- **Estados de servicios**:
  - Pendiente (outline)
  - Confirmada (secondary)
  - En Progreso (default)
  - Completada (default)
  - Cancelada (destructive)

### 3. Navegación al Perfil Completo
- Botón "Ver perfil completo" que redirige a la vista detallada del cliente
- Mantiene el token de autenticación en la navegación

## Componentes Creados

### `ClienteContextPanel`
**Ubicación**: `components/cliente-context-panel.tsx`

**Props**:
- `clientId`: ID del cliente
- `dealershipId`: ID del dealership (para filtrado)
- `onViewProfile`: Función opcional para navegar al perfil completo

**Características**:
- Carga asíncrona de datos
- Manejo de estados de carga y error
- Diseño responsive y compacto
- Reutilización de componentes UI existentes
- Colores consistentes con la aplicación

## APIs Modificadas

### `/api/customers/[id]/vehicles`
**Cambios**:
- Agregado soporte para parámetro `limit`
- Ordenamiento por `created_at DESC`
- Respuesta mejorada con metadata

**Uso**:
```bash
GET /api/customers/{client_id}/vehicles?limit=3
```

### `/api/customers/[id]/appointments`
**Cambios**:
- Agregado soporte para parámetro `limit`
- Filtrado automático por `dealership_id` del cliente
- Incluye `dealership_id` en la respuesta

**Uso**:
```bash
GET /api/customers/{client_id}/appointments?limit=3
```

## Integración en Conversaciones

### Ubicación
El panel se integra en `app/backoffice/conversaciones/[id]/page.tsx` dentro del panel de información izquierdo.

### Condiciones de Visualización
- Solo se muestra si existe `conversacion.client_id`
- Solo se muestra si existe `dataToken.dealership_id`
- Se posiciona después de la información básica del cliente
- Incluye separador visual antes de las nuevas secciones

### Funcionalidad de Navegación
- Botón "Ver perfil completo" que utiliza la función `verPerfilCliente` existente
- Mantiene el token de autenticación en la URL

## Diseño Visual

### Colores Utilizados
- **Vehículos**: Azul (`text-blue-600`, `text-blue-700`, `border-blue-100`, `bg-blue-50/30`)
- **Servicios**: Verde (`text-green-600`, `text-green-700`, `border-green-100`, `bg-green-50/30`)
- **Consistencia**: Usa la misma paleta de colores que la vista de cliente

### Componentes UI Reutilizados
- `Card`: Para contenedores de información
- `Badge`: Para estados de servicios
- `Skeleton`: Para estados de carga
- `Separator`: Para división visual
- Iconos de Lucide React

## Casos Edge Manejados

### Cliente sin Vehículos
- Muestra mensaje "No hay vehículos registrados"
- Incluye icono de carro
- No rompe la funcionalidad

### Cliente sin Servicios
- Muestra mensaje "No hay servicios registrados"
- Incluye icono de llave inglesa
- No rompe la funcionalidad

### Errores de Red/Base de Datos
- Manejo silencioso de errores
- Mensajes de error apropiados
- No impacta la funcionalidad principal

### Cliente sin dealership_id
- API de appointments maneja el caso
- Retorna error apropiado
- No rompe la interfaz

## Performance

### Optimizaciones Implementadas
- Límites en las consultas (3 vehículos, 3 servicios)
- Carga asíncrona independiente
- Manejo de errores sin bloquear la UI
- Reutilización de componentes existentes

### Impacto en Carga
- No afecta la velocidad de carga de la conversación principal
- Datos se cargan en paralelo
- Estados de carga apropiados

## Testing

### Casos Verificados
- ✅ Cliente con múltiples vehículos y servicios
- ✅ Cliente con solo un vehículo
- ✅ Cliente sin vehículos registrados
- ✅ Cliente sin historial de servicios
- ✅ Cliente con servicios en diferentes estados
- ✅ Conversación sin client_id asociado
- ✅ Navegación al perfil completo
- ✅ Responsive design

### Funcionalidad Existente
- ✅ Panel de información principal intacto
- ✅ Chat principal funcional
- ✅ Layout responsive mantenido
- ✅ Funcionalidad de WhatsApp intacta

## Mantenimiento

### Código Modular
- Componente reutilizable `ClienteContextPanel`
- APIs con parámetros flexibles
- Separación clara de responsabilidades

### Futuras Expansiones
- Fácil agregar más secciones de contexto
- APIs preparadas para más filtros
- Componente extensible para otros usos

## Archivos Modificados

1. `components/cliente-context-panel.tsx` (nuevo)
2. `app/backoffice/conversaciones/[id]/page.tsx`
3. `app/api/customers/[id]/vehicles/route.ts`
4. `app/api/customers/[id]/appointments/route.ts`
5. `README-contexto-cliente-conversacion.md` (este archivo)

## Resultado Final

Se ha implementado exitosamente un panel de contexto del cliente que:
- Proporciona información relevante sin salir de la conversación
- Mantiene consistencia visual con el resto de la aplicación
- Reutiliza código existente al máximo
- Maneja todos los casos edge apropiadamente
- No impacta la performance de la aplicación
- Facilita el trabajo del agente con contexto inmediato del cliente
