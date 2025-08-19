# Indicadores de Mensajes No Leídos en Conversaciones de Acción Humana

## 📋 Resumen

Se implementó un sistema de indicadores visuales para mostrar cuando una conversación tiene mensajes nuevos del cliente sin leer en la vista de "Acción Humana".

## 🎯 Funcionalidad

### Lógica de Negocio
Una conversación se considera "no leída" cuando:
1. `last_read_at` es NULL (nunca se ha leído), O
2. El último mensaje con `role: "customer"` tiene `created_at` posterior a `last_read_at`

### Indicador Visual
- **Círculo rojo pequeño** con animación pulse
- **Posición**: Inmediatamente antes del botón "Ver"
- **Clases CSS**: `w-2 h-2 bg-red-500 rounded-full animate-pulse`
- **Visibilidad**: Solo cuando `isConversationUnread(conversation)` retorna true

## 📁 Archivos Modificados

### 1. `utils/conversation-helpers.ts` (NUEVO)
```typescript
// Funciones principales:
- getLastCustomerMessageTimestamp(messages): Obtiene timestamp del último mensaje del cliente
- isConversationUnread(conversation): Determina si la conversación tiene mensajes no leídos
- markConversationAsRead(conversationId): Marca la conversación como leída
```

### 2. `migrations/20241203_add_messages_and_last_read_to_human_action_function.sql` (NUEVO)
- Actualiza la función RPC `get_conversations_needing_human_action`
- Agrega campos `messages JSONB` y `last_read_at TIMESTAMPTZ` al resultado

### 3. `app/backoffice/conversaciones/accion-humana/page.tsx`
**Cambios:**
- Import de `isConversationUnread`
- Actualización de interfaz `ConversacionAccionHumana` para incluir `messages` y `last_read_at`
- Agregado indicador visual en la tabla de conversaciones

### 4. `app/backoffice/conversaciones/[id]/page.tsx`
**Cambios:**
- Import de `markConversationAsRead`
- Llamada automática para marcar como leída al abrir la conversación

## 🔧 Estructura de Datos

### Campo `messages` (JSONB)
```json
[
  {
    "id": "OrgE.3IHYtPdVg-gHMEvliAxHk",
    "role": "customer",
    "content": "Hola buenas noches", 
    "created_at": "2025-08-09T04:12:25.252315+00:00"
  },
  {
    "id": "PsrPkxZHhKvo.as-wMcEvliAxHk", 
    "role": "ai_agent",
    "content": "Hola, buenas noches...",
    "created_at": "2025-08-09T04:12:42.097629+00:00"
  }
]
```

### Campo `last_read_at` (TIMESTAMPTZ)
- NULL: Nunca se ha leído
- Timestamp: Última vez que se marcó como leída

## 🧪 Testing Manual

### Casos de Prueba
1. **Conversación nueva** (`last_read_at = null`): Debe mostrar indicador
2. **Conversación con mensajes nuevos del cliente**: Debe mostrar indicador
3. **Conversación sin mensajes del cliente**: No debe mostrar indicador
4. **Al abrir conversación**: El indicador debe desaparecer de la lista
5. **Solo mensajes de ai_agent**: No debe mostrar indicador

### Verificaciones
- ✅ Indicador aparece para conversaciones no leídas
- ✅ Indicador desaparece al abrir la conversación
- ✅ Solo se consideran mensajes con `role: "customer"`
- ✅ No hay errores en console
- ✅ Mantiene funcionalidad existente

## 🚀 Implementación

### Flujo de Usuario
1. Usuario ve lista de conversaciones que necesitan acción humana
2. Conversaciones con mensajes no leídos muestran indicador rojo
3. Al hacer clic en "Ver", se abre el detalle de la conversación
4. Automáticamente se marca como leída (`last_read_at` se actualiza)
5. Al volver a la lista, el indicador desaparece

### Consideraciones Técnicas
- **Solo mensajes del cliente**: Se ignoran mensajes con `role: "ai_agent"`
- **Comparación de timestamps**: Se usa `created_at` del último mensaje del cliente vs `last_read_at`
- **Manejo de errores**: Errores se loggean en console pero no interrumpen la funcionalidad
- **Performance**: La lógica es eficiente y no afecta el rendimiento de la lista

## 📝 Notas Adicionales

- La función RPC ya incluye los campos necesarios
- El indicador visual es sutil pero efectivo
- La funcionalidad es automática y no requiere intervención del usuario
- Se mantiene la compatibilidad con conversaciones existentes
