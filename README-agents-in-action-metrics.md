# 🤖 Agents in Action - Métricas del Dashboard

## 📋 **Descripción**

Implementación de 3 métricas principales para el dashboard de conversaciones que miden la efectividad del agente AI en el mes actual. Estas métricas reemplazan las 3 cards anteriores de "Métricas de Conversión" con datos más específicos sobre el rendimiento del agente.

## 🎯 **Métricas Implementadas**

### **1. Unique Customers**
**Definición**: Clientes únicos que interactuaron en WhatsApp O llamadas telefónicas en el mes actual.

**Fuentes de datos**:
- `historial_chat` - Mensajes de WhatsApp (campo `chat_id`)
- `chat_conversations` - Llamadas telefónicas (campo `user_identifier`)

**Lógica**: 
- Normalizar números de teléfono (últimos 10 dígitos)
- UNION para combinar ambas fuentes
- COUNT DISTINCT para eliminar duplicados cross-canal
- Filtrar llamadas telefónicas de 30+ segundos

### **2. Appointments del AI**
**Definición**: Citas que el agente de AI logró gestionar en el mes actual.

**Fuente de datos**: Tabla `appointment`

**Filtros**:
- `channel = 'agenteai'` - Solo citas del AI
- `created_at` del mes actual
- `dealership_id` de la agencia

**Métricas incluidas**:
- **Total**: Todas las citas gestionadas por AI
- **Booked**: Citas exitosas (confirmed, pending, completed)
- **Rescheduled**: Citas reagendadas pero activas
- **Cancelled**: Citas canceladas

### **3. % Without Transfers**
**Definición**: Porcentaje de conversaciones de WhatsApp que el AI resolvió sin necesidad de derivar a un agente humano.

**Fuentes de datos**:
- `chat_conversations` - Conversaciones de WhatsApp
- `client` - Información de clientes (campo `agent_active`)

**Lógica**:
- `agent_active = true` → Cliente necesita atención humana (WITH transfer)
- `agent_active = false/null` → AI maneja al cliente (WITHOUT transfer)
- Conversaciones sin cliente registrado se consideran "without transfers"

## 🏗️ **Arquitectura Técnica**

### **Backend - Nuevas Funciones RPC**

#### **1. `get_unique_customers_month(p_dealership_id UUID)`**
```sql
-- Calcula clientes únicos que interactuaron en WhatsApp o llamadas telefónicas
-- Normaliza números de teléfono y elimina duplicados cross-canal
```

#### **2. `get_ai_appointments_month(p_dealership_id UUID)`**
```sql
-- Calcula métricas de citas gestionadas por el agente AI
-- Incluye total, agendadas, reagendadas y canceladas
```

#### **3. `get_conversations_without_transfers(p_dealership_id UUID)`**
```sql
-- Calcula porcentaje de conversaciones resueltas sin derivar a humano
-- Usa LEFT JOIN con tabla client para determinar agent_active
```

### **API Endpoint**

#### **`GET /api/conversations/agents-in-action`**
- **Parámetros**: `dealership_id` (requerido)
- **Cache**: 5 minutos in-memory
- **Respuesta**: JSON con las 3 métricas principales

**Estructura de respuesta**:
```json
{
  "unique_customers": 150,
  "appointments": {
    "total": 45,
    "booked": 38,
    "rescheduled": 5,
    "cancelled": 2
  },
  "without_transfers": {
    "percentage": 78.5,
    "total_conversations": 200,
    "without_transfers": 157,
    "with_transfers": 43
  }
}
```

### **Frontend - Componente Actualizado**

#### **Archivo**: `app/backoffice/conversaciones/page.tsx`

**Cambios principales**:
1. **Nuevo estado**: `agentsInActionMetrics` para almacenar las métricas
2. **Nueva función**: `cargarAgentsInActionMetrics()` para obtener datos
3. **UI actualizada**: Reemplazo de las 3 cards anteriores con nuevas métricas

**Estructura de las cards**:
```tsx
{/* Unique Customers */}
<Card>
  <h3>Unique Customers</h3>
  <div className="text-3xl font-bold">{unique_customers}</div>
  <p>Clientes únicos que interactuaron</p>
</Card>

{/* Appointments del AI */}
<Card>
  <h3>Appointments</h3>
  <div className="text-3xl font-bold">{appointments.total}</div>
  <p>{booked} agendadas, {cancelled} canceladas</p>
</Card>

{/* % Without Transfers */}
<Card>
  <h3>% Without Transfers</h3>
  <div className="text-3xl font-bold">{percentage}%</div>
  <p>{without_transfers} de {total_conversations} conversaciones</p>
</Card>
```

## 📁 **Archivos Creados/Modificados**

### **Nuevos Archivos**
- `app/api/conversations/agents-in-action/route.ts` - Endpoint API
- `migrations/20241201_agents_in_action_functions.sql` - Funciones RPC

### **Archivos Modificados**
- `app/backoffice/conversaciones/page.tsx` - Frontend actualizado

## 🚀 **Implementación**

### **1. Ejecutar Migración**
```bash
# Aplicar las funciones RPC a la base de datos
psql -d your_database -f migrations/20241201_agents_in_action_functions.sql
```

### **2. Verificar Endpoint**
```bash
# Test del endpoint
curl "http://localhost:3000/api/conversations/agents-in-action?dealership_id=your-dealership-id"
```

### **3. Verificar Frontend**
- Navegar a `/backoffice/conversaciones`
- Verificar que las 3 nuevas cards aparezcan
- Confirmar que los datos se cargan correctamente

## 📊 **Métricas de Performance**

### **Cache Strategy**
- **TTL**: 5 minutos para métricas de Agents in Action
- **Scope**: Por dealership_id
- **Type**: In-memory cache

### **Optimizaciones**
- **Queries optimizadas**: Uso de CTEs y filtros eficientes
- **Normalización**: Procesamiento de números de teléfono en SQL
- **Indexing**: Aprovecha índices existentes en `created_at` y `dealership_id`

## 🔍 **Debugging**

### **Logs a Monitorear**
```bash
# Carga exitosa
🤖 Iniciando carga de métricas de Agents in Action...
🤖 Datos de Agents in Action recibidos: { unique_customers: 150, appointments_total: 45, without_transfers_pct: 78.5 }

# Cache funcionando
🚀 Agents in Action cache hit for agents-{dealershipId}

# Primera carga
💾 Computing fresh Agents in Action metrics for {dealershipId}
✅ Agents in Action metrics calculadas exitosamente
```

### **Errores Comunes**
1. **Missing dealership_id**: Verificar que el parámetro se pase correctamente
2. **RPC errors**: Verificar que las funciones estén instaladas en la BD
3. **Data inconsistencies**: Verificar que las tablas tengan los datos esperados

## 🎯 **Próximos Pasos**

### **Mejoras Futuras**
1. **Filtros temporales**: Permitir seleccionar diferentes períodos
2. **Comparativas**: Mostrar métricas vs mes anterior
3. **Drill-down**: Permitir ver detalles de cada métrica
4. **Alertas**: Notificaciones cuando las métricas bajen de cierto umbral

### **Integración con Otros Dashboards**
- **Backoffice principal**: Incluir métricas en dashboard general
- **Reportes**: Exportar datos para análisis externo
- **APIs**: Exponer métricas para integraciones de terceros

## 📈 **Impacto Esperado**

### **Inmediato**
- **Visibilidad mejorada**: Métricas específicas del rendimiento AI
- **UX mejorada**: Cards más relevantes para el negocio
- **Performance**: Cache optimizado para cargas rápidas

### **A Largo Plazo**
- **Toma de decisiones**: Datos para optimizar el agente AI
- **ROI tracking**: Medir efectividad de la inversión en AI
- **Escalabilidad**: Sistema preparado para métricas adicionales
