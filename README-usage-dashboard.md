# Dashboard de Uso de la Plataforma

## Descripción

Sección completa para monitorear el uso de conversaciones de la plataforma por agencia, incluyendo dashboard detallado y card de resumen para el dashboard principal.

## Archivos Creados

### 1. Página Principal: `app/backoffice/uso/page.tsx`
- **Ruta**: `/backoffice/uso?token=xxx`
- **Funcionalidad**: Página principal con autenticación estándar del backoffice
- **Características**:
  - Verificación de token JWT con `dealership_id`
  - Layout responsive con header y breadcrumb
  - Botón de refresh manual
  - Manejo robusto de estados (loading, error, data)
  - Integración con el componente `UsageDashboard`

### 2. Componente Dashboard: `components/usage-dashboard.tsx`
- **Props**: `dealershipId`, `token`
- **Funcionalidad**: Dashboard completo con datos de uso
- **Características**:
  - Fetch automático de datos del endpoint `/api/dealerships/usage`
  - Card principal con conversaciones del mes actual
  - Gráfico de líneas con histórico de 12 meses (Recharts)
  - Tabla detallada con datos mensuales
  - Indicadores de crecimiento y badges
  - Actualización manual con botón refresh

### 3. Componente Resumen: `components/usage-summary-card.tsx`
- **Props**: `dealershipId`, `token`
- **Funcionalidad**: Card compacto para dashboard principal
- **Características**:
  - Número de conversaciones del mes actual
  - Indicador de crecimiento vs mes anterior
  - Link a la página completa de uso
  - Actualización automática cada 5 minutos
  - Manejo silencioso de errores

## Estructura de Datos

### Endpoint API: `/api/dealerships/usage`
```typescript
// Respuesta del endpoint
{
  dealership_id: string,
  usage_data: Array<{
    period: string,           // "2025-06"
    unique_conversations: number,
    phone_conversations: number,
    whatsapp_conversations: number
  }>,
  query_params: {
    start_date: string,
    months: number
  }
}
```

### Tipos TypeScript
```typescript
// types/index.ts
export interface UsageData {
  dealership_id: string
  current_period: {
    period: string
    year: number
    month: number
    unique_conversations: number
    by_channel: {
      phone: number
      whatsapp: number
    }
  }
  historical_usage: Array<{
    period: string
    year: number
    month: number
    unique_conversations: number
    by_channel: { 
      phone: number
      whatsapp: number 
    }
  }>
  calculated_at: string
}

export interface UsageSummaryData {
  current_period: {
    unique_conversations: number
    by_channel: {
      phone: number
      whatsapp: number
    }
  }
  previous_period?: {
    unique_conversations: number
  }
}
```

## Características del Dashboard

### Card Principal (Mes Actual)
- Número grande centrado de conversaciones
- Subtítulo con mes y año
- Badge de crecimiento vs mes anterior (verde/rojo)
- Desglose por canal (WhatsApp vs Llamadas)
- Icono MessageSquare
- Indicador de última actualización

### Gráfico Histórico
- LineChart de Recharts con 12 meses
- Eje X: meses en formato "Ene 2025"
- Eje Y: número de conversaciones
- Tooltip informativo
- Grid horizontal para facilitar lectura
- Responsive design

### Tabla Detallada
- Columnas: Mes, Total, WhatsApp, Llamadas, Cambio
- Últimos 12 meses ordenados por fecha descendente
- Badge "Actual" en el mes corriente
- Iconos TrendingUp/TrendingDown para cambios
- Hover effects y zebra striping

## Integración en Dashboard Principal

El componente `UsageSummaryCard` se integra automáticamente en el dashboard principal:

```tsx
// app/backoffice/page.tsx
import { UsageSummaryCard } from "@/components/usage-summary-card"

// En el grid de cards
{dataToken?.dealership_id && (
  <UsageSummaryCard 
    dealershipId={dataToken.dealership_id} 
    token={token}
  />
)}
```

## Patrones de Diseño

### Autenticación
- Verificación estándar de token JWT
- Redirección a `/login` si token inválido
- Uso de `dealership_id` del token

### Estados
- **Loading**: Skeleton components
- **Error**: Alert cards con opción de retry
- **Empty**: Mensaje informativo
- **Success**: Datos completos con indicadores

### Responsive Design
- Mobile-first con breakpoints `md:` y `lg:`
- Grid adaptativo para diferentes tamaños
- Tabla con scroll horizontal en mobile

### Colores y UX
- **Primary**: Azul para destacados
- **Green-600**: Crecimiento positivo
- **Red-600**: Crecimiento negativo
- **Muted-foreground**: Texto secundario
- Hover effects y transiciones suaves

## Funcionalidades Adicionales

### Actualización Automática
- Card de resumen: cada 5 minutos
- Dashboard completo: manual con botón refresh
- Indicador de última actualización

### Manejo de Errores
- Toast notifications para errores críticos
- Manejo silencioso en card de resumen
- Opción de retry en componentes principales
- Fallback graceful para datos faltantes

### Estados Vacíos
- Mensaje informativo cuando no hay datos
- Indicadores visuales claros
- No rompe la funcionalidad del dashboard

## Dependencias

- **Recharts**: Para gráficos
- **date-fns**: Para formateo de fechas
- **lucide-react**: Para iconos
- **shadcn/ui**: Para componentes de UI

## Logging y Debugging

- Console logs detallados para debugging
- Indicadores de estado en cada operación
- Manejo de errores con contexto completo
- Logs de performance para operaciones críticas

## Uso

1. **Acceso directo**: `/backoffice/uso?token=xxx`
2. **Desde dashboard**: Click en card "Uso de la Plataforma"
3. **Navegación**: Breadcrumb "Dashboard > Uso de la Plataforma"

## Mantenimiento

- Actualización automática de datos
- Logs para monitoreo de errores
- Tipos TypeScript para type safety
- Componentes reutilizables y modulares 