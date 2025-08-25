# Actualización Automática de Conversaciones

## Descripción

Se ha implementado un sistema de actualización automática de conversaciones que se ejecuta cada 20 segundos, similar a WhatsApp, para mantener las listas de conversaciones actualizadas sin necesidad de hacer clic en botones de actualizar.

## Características Implementadas

### 1. Actualización Automática
- **Frecuencia**: Cada 20 segundos
- **Comportamiento**: Silencioso, sin interrumpir al usuario
- **Alcance**: Aplica tanto a la lista general como a la lista de acción humana

### 2. Indicadores Visuales
- **Durante la actualización**: Punto verde pulsante + texto "Actualizando..."
- **Después de la actualización**: Hora de la última actualización
- **Ubicación**: Esquina superior derecha del header

### 3. Actualización Inteligente
- **Detección de cambios**: Solo actualiza conversaciones que realmente cambiaron
- **Nuevas conversaciones**: Se agregan automáticamente al inicio de la lista
- **Conversaciones existentes**: Se actualizan en su lugar sin cambiar el orden

### 4. Actualización de Conversación Abierta
- **Mensajes en tiempo real**: Los nuevos mensajes aparecen automáticamente en la conversación abierta
- **Indicador visual**: Punto verde pulsante durante la actualización automática
- **Sin interrupción**: El usuario puede seguir leyendo mientras se actualiza

## Archivos Modificados

### 1. `edgarai/app/backoffice/conversaciones/lista/page.tsx`
- Agregados hooks `useSilentUpdates` y `useSmartPolling`
- Integrados indicadores visuales en el header
- Actualización automática cada 20 segundos
- **Optimización**: Uso del campo `last_message_time` de la función RPC
- **UX Mejorada**: Truncado inteligente de nombres largos con tooltip

### 2. `edgarai/components/whatsapp-layout/ConversationList.tsx`
- Agregada actualización automática para la página de acción humana
- Integrados indicadores visuales en el header
- Actualización de métricas y conversaciones en paralelo
- **Optimización**: Uso del campo `last_message_time` de la función RPC
- **UX Mejorada**: Truncado inteligente de nombres largos con tooltip

### 3. `edgarai/components/whatsapp-layout/ChatPanel.tsx`
- Agregada actualización automática de la conversación abierta
- Indicador visual durante la actualización automática
- Los nuevos mensajes aparecen automáticamente sin necesidad de actualizar manualmente
- **Fix**: Preserva el estado de "leído/no leído" - solo marca como leída cuando se abre por primera vez

### 4. **Función RPC `get_filtered_conversations`**
- **Ordenamiento mejorado**: Por último mensaje de cualquier tipo (cliente, IA, asesor)
- **Nuevo campo**: `last_message_time` calculado en la base de datos
- **Performance**: Cálculo optimizado en SQL en lugar de JavaScript

### 5. **`edgarai/utils/conversation-helpers.ts`**
- **Nuevas funciones**: `truncateClientName` y `getFullClientName`
- **Truncado inteligente**: Nombres largos se cortan a 30 caracteres con "..."
- **Tooltip nativo**: Muestra el nombre completo al hacer hover

## Hooks Implementados

### `useSilentUpdates`
```typescript
const { isUpdating, lastUpdateTime } = useSilentUpdates(dataToken, cargarConversaciones);
```
- Maneja la actualización silenciosa en background
- Proporciona estados para indicadores visuales
- Ejecuta la función de carga cada 20 segundos

### `useSmartPolling`
```typescript
useSmartPolling(dataToken, setConversaciones);
```
- Detecta cambios en las conversaciones
- Actualiza solo las conversaciones modificadas
- Mantiene el orden y contexto de la lista

## Experiencia de Usuario

### Antes
- Usuario debía hacer clic en botón de actualizar
- No había indicación de cuándo se actualizó por última vez
- Experiencia similar a aplicaciones web tradicionales

### Después
- Actualización automática cada 20 segundos
- Indicadores visuales sutiles pero informativos
- Experiencia similar a WhatsApp y aplicaciones móviles modernas
- No interrumpe el trabajo del usuario
- **Nuevos mensajes aparecen automáticamente en la conversación abierta**
- **No es necesario salir y volver a entrar para ver nuevos mensajes**

## Configuración

### Intervalo de Actualización
- **Actual**: 20 segundos (20000ms)
- **Modificable**: Cambiar el valor en los hooks `useSilentUpdates` y `useSmartPolling`

### Indicadores Visuales
- **Color**: Verde (#10B981)
- **Animación**: Pulsante durante actualización
- **Texto**: "Actualizando..." durante el proceso
- **Hora**: Formato HH:mm para última actualización
- **Texto acortado**: "Últ. actualización:" para mejor alineación
- **Alineación**: Texto alineado a la derecha con margen izquierdo

## Ventajas

1. **Experiencia de Usuario Mejorada**
   - No requiere interacción manual
   - Actualización transparente
   - Indicadores informativos

2. **Eficiencia**
   - Solo actualiza lo que cambió
   - No recarga toda la lista
   - Mantiene el contexto del usuario

3. **Confiabilidad**
   - Fallback a actualización manual disponible
   - Manejo de errores incluido
   - Logs para debugging

## Consideraciones Técnicas

### Performance
- Las actualizaciones son asíncronas y no bloquean la UI
- Se usa `Promise.all` para actualizar métricas y conversaciones en paralelo
- Cache existente se mantiene para optimizar consultas
- **Optimización**: Uso del campo `last_message_time` calculado en la base de datos

### Estado de Lectura
- El marcado como "leído" solo ocurre cuando se abre la conversación por primera vez
- Las actualizaciones automáticas preservan el estado de lectura
- Los indicadores de "no leído" funcionan correctamente con la actualización automática

### Ordenamiento Mejorado
- **Función RPC actualizada**: Ordena por el último mensaje de cualquier tipo
- **Frontend optimizado**: Usa el campo `last_message_time` en lugar de calcularlo manualmente
- **Consistencia**: Mismo ordenamiento en lista general y acción humana

### Compatibilidad
- Funciona con el sistema de filtros existente
- Mantiene la paginación actual
- Compatible con todas las funcionalidades existentes

### Debugging
- Logs detallados en consola para monitoreo
- Indicadores visuales para estado de actualización
- Manejo de errores con fallback

## Próximas Mejoras Posibles

1. **WebSockets**: Implementar actualización en tiempo real
2. **Configuración**: Permitir al usuario ajustar el intervalo
3. **Notificaciones**: Alertas para nuevas conversaciones importantes
4. **Optimización**: Cache más inteligente para reducir consultas
