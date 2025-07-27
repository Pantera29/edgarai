# Nueva Sección Analytics

## 🎯 Objetivo
Implementar una nueva sección "Analytics" en el sidebar principal con subsecciones para análisis de retención y performance del taller.

## 📁 Archivos Creados/Modificados

### **Sidebar Principal**
- `components/sidebar.tsx` - Agregada nueva sección "Analytics" con subsecciones

### **Páginas de Analytics**
- `app/backoffice/analytics/retencion/page.tsx` - Página de retención por cohort
- `app/backoffice/analytics/performance/page.tsx` - Página de performance del taller

## 🚀 Implementación

### **1. Nueva Sección en Sidebar**
```typescript
// components/sidebar.tsx
{
  title: "Analytics",
  icon: TrendingUp,
  isSection: true,
  items: [
    {
      title: "Retención",
      href: "/backoffice/analytics/retencion",
      icon: TrendingUp
    },
    {
      title: "Performance Taller",
      href: "/backoffice/analytics/performance",
      icon: Activity
    }
  ]
}
```

### **2. Página de Retención por Cohort**
- ✅ **Integración con endpoint** `/api/retention/cohort`
- ✅ **Métricas principales**: Total de cohorts, retención por períodos, total de clientes
- ✅ **Información detallada**: Mejores/peores cohorts, benchmarks estadísticos
- ✅ **Tabla de cohorts**: Vista detallada con tasas de retención
- ✅ **Estados de loading y error** con skeleton y alertas
- ✅ **Autenticación JWT** con validación de token

### **3. Página de Performance del Taller**
- ✅ **Métricas principales**: Citas totales, ingresos, satisfacción, eficiencia
- ✅ **Tendencias**: Comparación con mes anterior con indicadores visuales
- ✅ **Servicios populares**: Ranking de servicios más solicitados
- ✅ **Performance mensual**: Tabla con evolución temporal
- ✅ **Datos mock** para demostración (preparado para endpoints reales)

## 📊 Funcionalidades Implementadas

### **Página de Retención**
```typescript
// Métricas principales
- Total de Cohorts (completos vs parciales)
- Retención 0-6 meses (promedio)
- Retención 6-12 meses (promedio)
- Total de Clientes (nuevos)

// Información adicional
- Mejor/peor cohort por retención 0-6m
- Último cohort completo
- Benchmarks estadísticos por período

// Tabla detallada
- Cohort, tamaño, tasas de retención por período
- Estado (completo/parcial)
```

### **Página de Performance**
```typescript
// Métricas principales
- Citas Totales (con tendencia)
- Ingresos (con tendencia)
- Satisfacción del Cliente (con tendencia)
- Eficiencia del Taller (con tendencia)

// Métricas secundarias
- Tasa de Completación
- Duración Promedio
- Utilización del Taller

// Análisis detallado
- Servicios más populares (ranking)
- Performance por mes (tabla)
```

## 🎨 Características de UI/UX

### **Diseño Consistente**
- ✅ **Cards responsivas** con grid adaptativo
- ✅ **Iconos Lucide** apropiados para cada métrica
- ✅ **Colores semánticos** para tendencias (verde/rojo/gris)
- ✅ **Skeleton loading** para estados de carga
- ✅ **Alertas informativas** para errores y notas

### **Interactividad**
- ✅ **Botón de refresh** con animación de loading
- ✅ **Hover effects** en tablas y cards
- ✅ **Toast notifications** para feedback
- ✅ **Responsive design** para móviles y tablets

### **Formateo de Datos**
- ✅ **Porcentajes** formateados correctamente
- ✅ **Moneda** en formato MXN
- ✅ **Números** con separadores de miles
- ✅ **Fechas** en formato español

## 🔧 Integración Técnica

### **Autenticación**
```typescript
// Verificación de token JWT
const verifiedDataToken = verifyToken(tokenValue)
if (!verifiedDataToken?.dealership_id) {
  router.push("/login")
  return
}
```

### **Manejo de Estados**
```typescript
// Estados principales
const [isLoading, setIsLoading] = useState<boolean>(true)
const [error, setError] = useState<string | null>(null)
const [data, setData] = useState<DataType | null>(null)
```

### **Llamadas a API**
```typescript
// Retención - Endpoint real
const response = await fetch(`/api/retention/cohort?token=${token}&months_back=24&format=dashboard`)

// Performance - Datos mock (preparado para endpoint real)
const mockData: WorkshopPerformanceData = { ... }
```

## 📈 Métricas y KPIs

### **Retención por Cohort**
- **Total de cohorts**: Número total de grupos de clientes analizados
- **Retención 0-6m**: Porcentaje de clientes que regresan en los primeros 6 meses
- **Retención 6-12m**: Porcentaje de clientes que regresan entre 6-12 meses
- **Retención 12-18m**: Porcentaje de clientes que regresan entre 12-18 meses
- **Benchmarks**: Estadísticas (promedio, min, max, mediana) por período

### **Performance del Taller**
- **Citas totales**: Número total de citas programadas
- **Ingresos**: Ingresos totales del período
- **Satisfacción**: Puntuación promedio de satisfacción del cliente
- **Eficiencia**: Métrica compuesta de productividad y calidad
- **Utilización**: Porcentaje de capacidad del taller utilizada

## 🛡️ Seguridad y Validación

### **Validación de Token**
- ✅ Verificación obligatoria de token JWT
- ✅ Extracción segura de `dealership_id`
- ✅ Redirección automática a login si token inválido
- ✅ Validación de estructura de token

### **Manejo de Errores**
- ✅ **401**: Token faltante o inválido
- ✅ **404**: No se encontraron datos
- ✅ **500**: Error interno del servidor
- ✅ **Errores de red**: Timeout y conexión

## 🔄 Flujo de Datos

### **Página de Retención**
```
1. Verificar token JWT
2. Extraer dealership_id
3. Llamar endpoint /api/retention/cohort
4. Procesar respuesta (formato dashboard)
5. Mostrar métricas y tablas
6. Manejar errores y loading states
```

### **Página de Performance**
```
1. Verificar token JWT
2. Extraer dealership_id
3. Generar datos mock (futuro: endpoint real)
4. Mostrar métricas y análisis
5. Manejar errores y loading states
```

## 🧪 Testing

### **Casos de Prueba**
1. **Navegación**: Acceso desde sidebar a ambas páginas
2. **Autenticación**: Token válido e inválido
3. **Carga de datos**: Estados de loading y error
4. **Responsive**: Visualización en diferentes tamaños
5. **Interactividad**: Botones de refresh y navegación

### **Datos de Prueba**
- **Retención**: Endpoint real con datos de cohort
- **Performance**: Datos mock realistas para demostración

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: 1 columna para métricas principales
- **Tablet**: 2 columnas para métricas principales
- **Desktop**: 4 columnas para métricas principales

### **Adaptaciones**
- ✅ **Tablas**: Scroll horizontal en móviles
- ✅ **Cards**: Stack vertical en pantallas pequeñas
- ✅ **Botones**: Tamaño apropiado para touch
- ✅ **Texto**: Tamaños legibles en todos los dispositivos

## 🔮 Próximos Pasos

### **Endpoints Pendientes**
- **Performance API**: Crear endpoint para métricas de taller
- **Cache**: Implementar cache para datos de analytics
- **Real-time**: Actualizaciones en tiempo real

### **Mejoras Futuras**
- **Gráficos**: Integrar librerías de visualización
- **Filtros**: Filtros por período y tipo de servicio
- **Export**: Exportar datos a PDF/Excel
- **Alertas**: Notificaciones de métricas críticas

## 📝 Notas Técnicas

### **Dependencias**
- **Lucide React**: Iconos para la interfaz
- **shadcn/ui**: Componentes de UI
- **Next.js 14**: Framework y routing
- **TypeScript**: Tipado estricto

### **Patrones Utilizados**
- **Container/Presentational**: Separación de lógica y UI
- **Custom Hooks**: Para lógica reutilizable
- **Error Boundaries**: Manejo robusto de errores
- **Loading States**: UX mejorada durante carga

---

**Estado**: ✅ Implementado y funcional
**Última actualización**: 2024-12-15
**Versión**: 1.0.0 