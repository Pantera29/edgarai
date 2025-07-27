# Dashboard de Análisis de Lealtad de Clientes (LRF)

## 🎯 Objetivo
Crear un dashboard completo para análisis de lealtad de clientes basado en scores LRF (Length, Recency, Frequency) que permita identificar clientes en riesgo y tomar acciones proactivas para retenerlos.

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
- `migrations/20241203_create_client_lrf_scores_table.sql` - Tabla para almacenar scores LRF
- `migrations/20241203_create_lrf_analytics_functions.sql` - Funciones RPC para análisis optimizado
- `app/api/lrf/analytics/route.ts` - Endpoint API para obtener datos de análisis
- `app/backoffice/analytics/lealtad/page.tsx` - Página del dashboard
- `README-lrf-analytics-dashboard.md` - Esta documentación

### Archivos Modificados
- `types/database.types.ts` - Agregados tipos para tabla `client_lrf_scores`

## 🚀 Implementación

### 1. Base de Datos

#### Tabla `client_lrf_scores`
```sql
CREATE TABLE client_lrf_scores (
  client_id UUID NOT NULL,
  dealership_id UUID NOT NULL,
  length_score DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  recency_score DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  frequency_score DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  lrf_composite_score DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  current_segment VARCHAR(50) NOT NULL DEFAULT 'lost_customers',
  previous_segment VARCHAR(50),
  segment_changed_at TIMESTAMP WITH TIME ZONE,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  data_as_of_date DATE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  first_appointment_date DATE,
  last_appointment_date DATE,
  total_appointments_12m INTEGER DEFAULT 0,
  vehicle_age_years INTEGER,
  expected_interval_days INTEGER DEFAULT 180,
  days_since_last_appointment INTEGER DEFAULT 9999,
  PRIMARY KEY (client_id, dealership_id)
);
```

#### Funciones RPC Optimizadas
- `get_lrf_summary()` - Resumen general de métricas
- `get_lrf_segment_distribution()` - Distribución por segmentos
- `get_lrf_critical_clients()` - Clientes críticos con datos completos
- `get_lrf_temporal_evolution()` - Evolución temporal por semanas

### 2. API Endpoint

#### `/api/lrf/analytics`
- **Método:** GET
- **Parámetros:** `dealership_id` (requerido)
- **Funcionalidad:**
  - Resumen general con KPIs clave
  - Distribución de clientes por segmentos
  - TOP 20 clientes críticos (en riesgo)
  - Evolución temporal de últimos 8 semanas
  - Cálculo automático de días vencidos

#### Respuesta Estructurada
```json
{
  "success": true,
  "dealership_id": "uuid",
  "summary": {
    "total_clientes": 1250,
    "clientes_en_riesgo": 89,
    "porcentaje_en_riesgo": 7.1,
    "score_promedio": 3.2,
    "ultima_actualizacion": "2024-12-03T10:30:00Z",
    "clientes_criticos": 15
  },
  "segment_distribution": [
    {
      "name": "champions",
      "value": 45,
      "color": "#10B981"
    }
  ],
  "critical_clients": [
    {
      "client_id": "uuid",
      "current_segment": "cannot_lose",
      "lrf_composite_score": 2.1,
      "days_since_last_appointment": 245,
      "expected_interval_days": 180,
      "dias_vencidos": 65,
      "client_names": "Juan Pérez",
      "client_phone": "+525512345678",
      "client_email": "juan@email.com"
    }
  ],
  "temporal_evolution": [
    {
      "semana": 0,
      "fecha_inicio": "2024-11-25",
      "champions": 42,
      "loyal_customers": 156,
      "at_risk": 23,
      "cannot_lose": 8
    }
  ]
}
```

### 3. Dashboard Frontend

#### Características Principales
- **Responsive Design:** Adaptable a desktop, tablet y mobile
- **Loading States:** Skeleton loaders durante carga
- **Error Handling:** Manejo robusto de errores con reintentos
- **Real-time Updates:** Botón de actualización manual

#### Componentes Implementados

##### KPI Cards (4 métricas principales)
1. **Total Clientes** - Número total de clientes con scores LRF
2. **% En Riesgo** - Porcentaje de clientes en segmentos críticos
3. **Score Promedio** - Score LRF promedio del dealership
4. **Clientes Críticos** - Número de clientes que requieren atención inmediata

##### Gráficos
- **Donut Chart (PieChart):** Distribución de clientes por segmentos
- **Line Chart:** Evolución temporal de 4 segmentos principales
- **Lista Scrolleable:** Clientes críticos con botón de contacto

##### Colores de Segmentos
- `champions`: Verde (#10B981)
- `loyal_customers`: Azul (#3B82F6)
- `new_customers`: Cyan (#06B6D4)
- `at_risk`: Naranja (#F59E0B)
- `cannot_lose`: Rojo (#EF4444)
- `lost_customers`: Gris (#6B7280)
- `potential_loyalists`: Púrpura (#8B5CF6)

#### Navegación Integrada
- Botón "Contactar" en cada cliente crítico
- Navega a `/backoffice/clients/{clientId}/conversation`
- Mantiene el token de autenticación

## 🧪 Testing

### Escenarios de Prueba
1. **Sin datos LRF:** Muestra mensaje apropiado
2. **Con clientes críticos:** Lista funcional con navegación
3. **Gráficos vacíos:** Manejo de datos faltantes
4. **Errores de API:** Fallback con datos mock
5. **Responsive:** Funciona en diferentes tamaños de pantalla

### Datos de Prueba
```sql
-- Ejecutar cálculo LRF para generar datos
SELECT * FROM get_lrf_summary('534e6d39-7cea-4182-b9ad-15b0f4997484');

-- Verificar clientes críticos
SELECT * FROM get_lrf_critical_clients('534e6d39-7cea-4182-b9ad-15b0f4997484', 5);
```

## 📈 Impacto Esperado

### Métricas de Negocio
- **Identificación temprana** de clientes en riesgo de abandono
- **Reducción de churn** mediante acciones proactivas
- **Mejora en retención** de clientes valiosos
- **Optimización de recursos** enfocando esfuerzos en clientes críticos

### Beneficios Operativos
- **Dashboard accionable** con navegación directa a conversaciones
- **Métricas en tiempo real** con actualización manual
- **Visualización clara** de segmentos y tendencias
- **Integración completa** con sistema de conversaciones existente

### KPIs Medibles
- Reducción del % de clientes en riesgo
- Aumento del score LRF promedio
- Incremento en conversiones de clientes críticos
- Mejora en tiempo de respuesta a clientes en riesgo

## 🔧 Configuración Técnica

### Dependencias Utilizadas
- **Recharts:** Gráficos interactivos (PieChart, LineChart)
- **Lucide React:** Iconos consistentes
- **date-fns:** Formateo de fechas en español
- **shadcn/ui:** Componentes UI base

### Optimizaciones Implementadas
- **Índices DB:** Optimizados para consultas frecuentes
- **Funciones RPC:** Reducen latencia de red
- **Paginación:** Límite de 20 clientes críticos
- **Caching:** Datos calculados en tiempo real

### Seguridad
- **Validación de token:** Verificación JWT obligatoria
- **Filtrado por dealership:** Aislamiento de datos
- **Sanitización:** Validación de inputs
- **Error handling:** No expone información sensible

## 🚀 Uso/Implementación

### Acceso al Dashboard
```
/backoffice/analytics/lealtad?token={jwt_token}
```

### Flujo de Trabajo
1. **Análisis:** Revisar KPIs y distribución de segmentos
2. **Identificación:** Localizar clientes críticos en la lista
3. **Acción:** Hacer clic en "Contactar" para iniciar conversación
4. **Seguimiento:** Monitorear evolución temporal semanal

### Mantenimiento
- **Cálculo LRF:** Ejecutar periódicamente via `/api/lrf/calculate`
- **Actualización datos:** Botón "Actualizar" en dashboard
- **Monitoreo:** Revisar logs de errores en consola

## 📊 Métricas y Alertas

### Alertas Automáticas
- Clientes con >30 días vencidos
- Segmentos con >15% de clientes en riesgo
- Score promedio <2.5

### Reportes Sugeridos
- Resumen semanal de cambios de segmento
- Análisis de efectividad de acciones de retención
- Comparación de métricas entre dealerships

## 🎯 Próximos Pasos

### Mejoras Futuras
- **Notificaciones push** para clientes críticos
- **Campañas automáticas** basadas en segmentos
- **Análisis predictivo** de riesgo de abandono
- **Integración con CRM** para seguimiento

### Escalabilidad
- **Multi-dealership:** Dashboard consolidado
- **Exportación:** Reportes en PDF/Excel
- **API pública:** Endpoints para integraciones externas
- **Webhooks:** Notificaciones en tiempo real

---

**Resultado:** Dashboard funcional que proporciona insights accionables sobre la lealtad de clientes, permitiendo identificar y contactar proactivamente a clientes en riesgo para mejorar la retención y rentabilidad del negocio. 