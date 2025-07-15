# Conversaciones que Necesitan Acción Humana

## 🎯 Objetivo
Implementar una sección dedicada para identificar y gestionar conversaciones donde el agente está inactivo (`agent_active = false`) y requieren intervención humana inmediata.

## 📁 Archivos Creados/Modificados

### **Base de Datos**
- `migrations/20241202_create_human_action_conversations_function.sql` - Funciones RPC y índices optimizados

### **Páginas**
- `app/backoffice/conversaciones/accion-humana/page.tsx` - Nueva página dedicada para acción humana
- `app/backoffice/conversaciones/page.tsx` - Agregado indicador y navegación

## 🚀 Implementación

### **1. Funciones RPC Creadas**

#### **get_conversations_needing_human_action**
```sql
-- Función principal para obtener conversaciones que necesitan acción
CREATE OR REPLACE FUNCTION get_conversations_needing_human_action(
  p_dealership_id UUID,
  p_channel_filter TEXT DEFAULT NULL,
  p_urgency_filter TEXT DEFAULT 'all',
  p_search_query TEXT DEFAULT NULL,
  p_limit_rows INTEGER DEFAULT 20,
  p_offset_rows INTEGER DEFAULT 0
)
```

**Parámetros:**
- `p_dealership_id`: ID de la agencia
- `p_channel_filter`: 'whatsapp', 'phone', o NULL para todos
- `p_urgency_filter`: 'all', 'urgent', 'very_urgent', 'critical'
- `p_search_query`: Búsqueda por identificador, nombre, teléfono o email
- `p_limit_rows`: Límite de resultados (default: 20)
- `p_offset_rows`: Offset para paginación (default: 0)

**Campos Retornados:**
- Todos los campos de `chat_conversations`
- Información del cliente (`client_names`, `client_email`, `client_phone`, `client_agent_active`)
- Métricas de urgencia (`hours_since_last_activity`, `urgency_level`)
- Total count para paginación

#### **get_human_action_metrics**
```sql
-- Función para obtener métricas agregadas
CREATE OR REPLACE FUNCTION get_human_action_metrics(p_dealership_id UUID)
RETURNS JSON
```

**Métricas Retornadas:**
- `total_conversations`: Total de conversaciones que necesitan acción
- `whatsapp_count`: Conversaciones de WhatsApp
- `phone_count`: Conversaciones telefónicas
- `urgent_count`: Conversaciones urgentes (≤24h)
- `normal_count`: Conversaciones normales (>24h)
- `avg_hours_since_activity`: Tiempo promedio desde última actividad
- `urgency_distribution`: Distribución por nivel de urgencia

### **2. Niveles de Urgencia**

| Nivel | Tiempo | Color | Descripción |
|-------|--------|-------|-------------|
| **Urgent** | ≤ 24h | 🟠 Naranja | Requieren atención inmediata |
| **Normal** | > 24h | ⚪ Gris | Prioridad baja |

### **3. Página de Acción Humana**

#### **Características Principales:**
- **Métricas en tiempo real**: KPIs específicos para conversaciones que necesitan acción
- **Filtros avanzados**: Por canal, urgencia y búsqueda de texto
- **Ordenamiento por urgencia**: Las más antiguas aparecen primero
- **Indicadores visuales**: Badges de colores según nivel de urgencia
- **Paginación**: Soporte completo para grandes volúmenes
- **Navegación rápida**: Botón para ver todas las conversaciones

#### **Interfaz de Usuario:**
```typescript
// Métricas principales
- Total que necesitan acción
- Urgentes (≤24h)
- Tiempo promedio desde última actividad

// Filtros
- Búsqueda por texto
- Filtro por canal (WhatsApp/Teléfono)
- Filtro por urgencia

// Tabla con columnas
- Urgencia (badge con color)
- Canal (con ícono)
- Cliente (nombre y teléfono)
- Identificador
- Estado
- Tiempo sin actividad
- Última actividad
- Acciones (Ver detalle)
```

### **4. Integración con Dashboard Principal**

#### **Indicador Visual:**
- Se muestra automáticamente cuando hay conversaciones que necesitan acción
- Diseño destacado con fondo rojo y alerta
- Muestra conteo de conversaciones por nivel de urgencia
- Botón directo para acceder a la sección

#### **Navegación:**
- Botón "Acción Humana" en el header del dashboard
- Botón "Ver Lista" para acceder a todas las conversaciones
- Navegación fluida entre secciones

## 🧪 Testing

### **Escenarios de Prueba**
1. ✅ **Sin conversaciones que necesiten acción**: Muestra mensaje de éxito
2. ✅ **Con conversaciones urgentes**: Badge naranja y ordenamiento correcto
3. ✅ **Filtros funcionando**: Canal, urgencia y búsqueda
4. ✅ **Paginación**: Navegación entre páginas
5. ✅ **Métricas en tiempo real**: Actualización automática
6. ✅ **Navegación**: Enlaces entre páginas funcionando

### **Datos de Prueba**
```sql
-- Crear cliente con agent_active = false
UPDATE client 
SET agent_active = false 
WHERE id = 'cliente-test-id';

-- Verificar que aparece en la función
SELECT * FROM get_conversations_needing_human_action('dealership-id');
```

## 📊 Optimizaciones

### **Índices Creados:**
```sql
-- Índice para consultas por dealership y updated_at
CREATE INDEX idx_chat_conversations_dealership_updated 
ON chat_conversations(dealership_id, updated_at);

-- Índice para clientes inactivos
CREATE INDEX idx_client_agent_active 
ON client(agent_active) 
WHERE agent_active = false;

-- Índice compuesto para búsquedas
CREATE INDEX idx_chat_conversations_human_action_search 
ON chat_conversations(dealership_id, channel, updated_at);
```

### **Rendimiento:**
- **Consulta optimizada**: JOIN eficiente entre `chat_conversations` y `client`
- **Paginación**: LIMIT/OFFSET para grandes volúmenes
- **Cálculo de urgencia**: En tiempo real con EXTRACT(EPOCH)
- **Métricas agregadas**: Función separada para KPIs

## 🎨 UX/UI

### **Diseño Responsivo:**
- **Desktop**: Grid de 4 columnas para métricas
- **Tablet**: Grid de 2 columnas
- **Mobile**: Stack vertical

### **Indicadores Visuales:**
- **Badges de urgencia**: Colores distintivos por nivel
- **Íconos de canal**: WhatsApp (verde) y Teléfono (azul)
- **Estados de carga**: Skeleton loaders
- **Mensajes vacíos**: Feedback positivo cuando no hay acción necesaria

### **Accesibilidad:**
- **Contraste adecuado**: Colores que cumplen WCAG
- **Navegación por teclado**: Tab order correcto
- **Screen readers**: Textos descriptivos
- **Responsive**: Funciona en todos los dispositivos

## 🔄 Flujo de Trabajo

### **Para el Usuario:**
1. **Dashboard principal**: Ve indicador si hay conversaciones que necesitan acción
2. **Clic en "Acción Humana"**: Navega a la sección dedicada
3. **Revisa métricas**: Entiende la urgencia general
4. **Aplica filtros**: Enfoca en conversaciones específicas
5. **Revisa conversaciones**: Ordenadas por urgencia
6. **Toma acción**: Clic en "Ver" para revisar detalle
7. **Resuelve**: Marca cliente como activo o toma otras acciones

### **Para el Sistema:**
1. **Monitoreo continuo**: Función RPC ejecutándose en background
2. **Cálculo de urgencia**: Tiempo desde última actividad
3. **Filtrado automático**: Solo `agent_active = false`
4. **Ordenamiento**: Más antiguas primero
5. **Métricas en tiempo real**: Actualización automática

## 📈 Métricas y KPIs

### **Métricas Clave:**
- **Total de conversaciones que necesitan acción**
- **Distribución por urgencia** (urgentes, normales)
- **Tiempo promedio de respuesta**
- **Conversaciones por canal** (WhatsApp vs Teléfono)

### **Objetivos de Negocio:**
- **Reducir tiempo de respuesta**: Conversaciones urgentes atendidas en <24h
- **Mejorar satisfacción**: Clientes no esperan demasiado
- **Optimizar recursos**: Enfoque en conversaciones urgentes
- **Prevenir pérdidas**: Conversaciones no se pierden por inacción

## 🚀 Próximos Pasos

### **Funcionalidades Futuras:**
1. **Notificaciones push**: Alertas en tiempo real
2. **Asignación de agentes**: Distribuir conversaciones
3. **SLA tracking**: Monitoreo de tiempos de respuesta
4. **Reportes automáticos**: Resúmenes diarios/semanales
5. **Integración con CRM**: Sincronización con sistemas externos

### **Mejoras Técnicas:**
1. **Cache inteligente**: Para métricas frecuentemente consultadas
2. **Webhooks**: Notificaciones automáticas
3. **API endpoints**: Para integraciones externas
4. **Auditoría**: Log de acciones tomadas

## ✅ Resultado

La implementación proporciona:

1. **Visibilidad completa**: Todas las conversaciones que necesitan acción en un lugar
2. **Priorización clara**: Niveles de urgencia bien definidos
3. **Flujo de trabajo optimizado**: Navegación intuitiva y eficiente
4. **Métricas en tiempo real**: KPIs relevantes para la operación
5. **Escalabilidad**: Funciona con grandes volúmenes de conversaciones

**Impacto esperado**: Reducción significativa en tiempo de respuesta y mejora en la satisfacción del cliente. 