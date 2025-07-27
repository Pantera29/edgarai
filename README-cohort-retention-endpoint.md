# Endpoint de Retención por Cohort

## 🎯 Objetivo
Implementar un endpoint GET que calcule métricas de retención por cohort mensual para talleres automotrices, proporcionando análisis detallado de la retención de clientes a lo largo del tiempo.

## 📁 Archivos Creados/Modificados

### **Nuevo Endpoint API**
- `app/api/retention/cohort/route.ts` - Endpoint completo con procesamiento de datos y validaciones

## 🚀 Implementación

### **1. Endpoint API Principal**
```typescript
// app/api/retention/cohort/route.ts
export async function GET(request: NextRequest) {
  // Validación de token JWT
  // Llamada a función RPC calculate_monthly_cohort_retention
  // Procesamiento de datos para formato dashboard
  // Respuesta estructurada con métricas y benchmarks
}
```

### **2. Funcionalidades Implementadas**

#### **Autenticación y Validación**
- ✅ **Verificación de token JWT** usando `verifyToken()`
- ✅ **Extracción de dealership_id** del token verificado
- ✅ **Validación de parámetros** (months_back: 1-60, format: dashboard/raw)
- ✅ **Manejo de errores** robusto con códigos HTTP apropiados

#### **Procesamiento de Datos**
- ✅ **Llamada a RPC** `calculate_monthly_cohort_retention`
- ✅ **Separación de cohorts** completos vs parciales
- ✅ **Cálculo de métricas** por período (0-6m, 6-12m, 12-18m)
- ✅ **Benchmarks estadísticos** (promedio, min, max, mediana)
- ✅ **Identificación de mejor/peor cohort** por retención

#### **Formatos de Respuesta**
- ✅ **Formato dashboard**: Datos procesados con métricas agregadas
- ✅ **Formato raw**: Datos directos de la función RPC
- ✅ **Logging detallado** con emojis para debugging

## 📊 Estructura de Respuesta

### **Formato Dashboard**
```typescript
{
  success: boolean;
  dealership_id: string;
  calculated_at: string;
  months_analyzed: number;
  
  summary: {
    total_cohorts: number;
    complete_cohorts: number;
    partial_cohorts: number;
    avg_retention_0_6m: number;
    avg_retention_6_12m: number;
    avg_retention_12_18m: number;
    total_new_clients: number;
    latest_complete_cohort: string | null;
    best_cohort_0_6m: string | null;
    worst_cohort_0_6m: string | null;
  };
  
  cohorts: Array<{
    cohort_label: string;
    cohort_month: string;
    cohort_size: number;
    retention_rates: Record<string, number>;
    retention_counts: Record<string, number>;
    has_complete_data: boolean;
  }>;
  
  benchmarks: {
    period_0_6m: { average: number; min: number; max: number; median: number; count: number; };
    period_6_12m: { average: number; min: number; max: number; median: number; count: number; };
    period_12_18m: { average: number; min: number; max: number; median: number; count: number; };
  };
  
  metadata: {
    total_cohorts: number;
    execution_time_ms: number;
    data_complete_cohorts: number;
    data_partial_cohorts: number;
  };
}
```

### **Formato Raw**
```typescript
{
  success: boolean;
  dealership_id: string;
  calculated_at: string;
  months_analyzed: number;
  data: CohortData[]; // Datos directos de la RPC
  metadata: {
    total_cohorts: number;
    execution_time_ms: number;
  };
}
```

## 🔧 Parámetros de Entrada

### **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `token` | string | ✅ | - | Token JWT de autenticación |
| `months_back` | number | ❌ | 24 | Meses hacia atrás a analizar (1-60) |
| `format` | string | ❌ | 'dashboard' | Formato de respuesta ('dashboard' \| 'raw') |

## 📈 Lógica de Procesamiento

### **Función processCohortDataForDashboard()**
1. **Separar cohorts** por `data_complete: true/false`
2. **Extraer métricas** por período (0-6m, 6-12m, 12-18m)
3. **Calcular estadísticas**: promedio, min, max, mediana para benchmarks
4. **Identificar mejor/peor cohort** por retención 0-6m
5. **Generar summary** con métricas agregadas

### **Cálculo de Benchmarks**
```typescript
const calculateStats = (values: number[]): BenchmarkStats => {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const median = sorted.length % 2 === 0 
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  return { average, min, max, median, count: values.length };
};
```

## 🛡️ Manejo de Errores

### **Códigos de Error**
| Código | Descripción | Causa |
|--------|-------------|-------|
| `401` | Token faltante o inválido | Token no proporcionado o expirado |
| `400` | Parámetros inválidos | months_back fuera de rango o format incorrecto |
| `404` | No se encontraron datos | No hay datos de cohorts para el dealership |
| `500` | Error interno | Error en RPC o procesamiento |

### **Logging Detallado**
```typescript
console.log('🔄 [Cohort Retention] Iniciando endpoint...');
console.log('✅ [Cohort Retention] Token verificado para dealership:', dealershipId);
console.log('📊 [Cohort Retention] Cohorts completos: 5, parciales: 2');
console.log('❌ [Cohort Retention] Error en RPC:', error);
```

## 🧪 Ejemplos de Uso

### **Consulta Básica (Dashboard)**
```bash
curl "http://localhost:3000/api/retention/cohort?token=abc123&months_back=24&format=dashboard"
```

### **Consulta con Datos Raw**
```bash
curl "http://localhost:3000/api/retention/cohort?token=abc123&months_back=12&format=raw"
```

### **Consulta con JavaScript**
```javascript
const response = await fetch('/api/retention/cohort?token=' + token + '&months_back=24');
const data = await response.json();

console.log('Total de cohorts:', data.summary.total_cohorts);
console.log('Retención promedio 0-6m:', data.summary.avg_retention_0_6m);
console.log('Mejor cohort:', data.summary.best_cohort_0_6m);
```

## 📊 Respuesta de Ejemplo

### **Formato Dashboard**
```json
{
  "success": true,
  "dealership_id": "123e4567-e89b-12d3-a456-426614174000",
  "calculated_at": "2024-12-15T10:30:00.000Z",
  "months_analyzed": 24,
  "summary": {
    "total_cohorts": 8,
    "complete_cohorts": 6,
    "partial_cohorts": 2,
    "avg_retention_0_6m": 0.75,
    "avg_retention_6_12m": 0.45,
    "avg_retention_12_18m": 0.28,
    "total_new_clients": 1250,
    "latest_complete_cohort": "2024-06",
    "best_cohort_0_6m": "2024-03",
    "worst_cohort_0_6m": "2024-01"
  },
  "cohorts": [
    {
      "cohort_label": "2024-06",
      "cohort_month": "2024-06",
      "cohort_size": 150,
      "retention_rates": {
        "0_6m": 0.80,
        "6_12m": 0.50,
        "12_18m": 0.30
      },
      "retention_counts": {
        "0_6m": 120,
        "6_12m": 75,
        "12_18m": 45
      },
      "has_complete_data": true
    }
  ],
  "benchmarks": {
    "period_0_6m": {
      "average": 0.75,
      "min": 0.60,
      "max": 0.85,
      "median": 0.76,
      "count": 6
    }
  },
  "metadata": {
    "total_cohorts": 8,
    "execution_time_ms": 245,
    "data_complete_cohorts": 6,
    "data_partial_cohorts": 2
  }
}
```

## ⚡ Optimizaciones

### **Performance**
- ✅ **Medición de tiempo de ejecución** con `Date.now()`
- ✅ **Logging estructurado** para debugging
- ✅ **Validación temprana** de parámetros
- ✅ **Manejo eficiente de errores**

### **Seguridad**
- ✅ **Validación de token JWT** obligatoria
- ✅ **Extracción segura de dealership_id** del token
- ✅ **Validación de rangos** para parámetros numéricos
- ✅ **Sanitización de entrada** de usuario

## 🔄 Dependencias

### **Funciones RPC Requeridas**
```sql
-- Función que debe existir en Supabase
calculate_monthly_cohort_retention(
  p_dealership_id UUID,
  p_months_back INTEGER
) RETURNS TABLE (
  cohort_label TEXT,
  cohort_month TEXT,
  cohort_size INTEGER,
  retention_rates JSONB,
  retention_counts JSONB,
  data_complete BOOLEAN
)
```

### **Variables de Entorno**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🧪 Testing

### **Casos de Prueba**
1. **Token válido** - Debe devolver datos correctos
2. **Token inválido** - Debe devolver 401
3. **Sin token** - Debe devolver 401
4. **months_back inválido** - Debe devolver 400
5. **format inválido** - Debe devolver 400
6. **Sin datos** - Debe devolver 404
7. **Formato raw** - Debe devolver datos sin procesar
8. **Formato dashboard** - Debe devolver datos procesados

### **Probar el Endpoint**
```bash
# Token válido
curl "http://localhost:3000/api/retention/cohort?token=valid_token&months_back=24"

# Token inválido
curl "http://localhost:3000/api/retention/cohort?token=invalid_token"

# Parámetros inválidos
curl "http://localhost:3000/api/retention/cohort?token=valid_token&months_back=100"
```

## 📈 Métricas de Performance

### **Tiempos de Respuesta Esperados**
- **Consulta básica**: < 500ms
- **24 meses de datos**: < 1000ms
- **60 meses de datos**: < 2000ms

### **Optimizaciones Futuras**
- **Cache in-memory** para consultas frecuentes
- **Paginación** para datasets grandes
- **Compresión** de respuesta para datos históricos
- **Background processing** para cálculos pesados

## 🔗 Integración

### **Uso en Frontend**
```typescript
// Hook personalizado para retención por cohort
const useCohortRetention = (dealershipId: string, monthsBack: number = 24) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/retention/cohort?token=${token}&months_back=${monthsBack}`
        );
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dealershipId, monthsBack]);

  return { data, loading, error };
};
```

## 📝 Notas Técnicas

### **Consideraciones de Diseño**
- **Separación de responsabilidades**: Validación, procesamiento y respuesta
- **Tipado fuerte**: Interfaces TypeScript para todas las estructuras
- **Manejo de errores**: Códigos HTTP apropiados y mensajes descriptivos
- **Logging**: Emojis y timestamps para facilitar debugging

### **Compatibilidad**
- **Next.js 14**: App Router compatible
- **Supabase**: Cliente con SERVICE_ROLE_KEY
- **TypeScript**: Tipado estricto
- **JWT**: Sistema de autenticación existente

---

**Estado**: ✅ Implementado y documentado
**Última actualización**: 2024-12-15
**Versión**: 1.0.0 