# Fix NPS Feedback Page - Métricas y Paginación

## 🎯 Objetivo
Corregir la página de feedback NPS para que las métricas muestren datos globales (no solo de la página actual), mejorar estilos y cambiar paginación a 25 registros.

## 📁 Archivos Modificados
- `app/backoffice/feedback/page.tsx` - Página principal de feedback NPS
- `migrations/20241202_fix_nps_metrics_function.sql` - Función RPC corregida

## 🚀 Cambios Implementados

### 1. Función RPC `get_nps_metrics`
- **Problema**: Calculaba métricas incorrectamente, incluyendo registros pendientes
- **Solución**: Agregar filtros `AND n.status = 'completed'` y `AND n.score IS NOT NULL`
- **Resultado**: Métricas precisas basadas solo en respuestas completadas con score

### 2. Paginación
- **Cambio**: De 10 a 25 registros por página (`ITEMS_PER_PAGE = 25`)
- **Mejora**: Mejor experiencia de usuario con más datos visibles

### 3. Estilos de Cards
- **Problema**: Estilos inconsistentes con el resto del proyecto
- **Solución**: Usar `Card className="p-6"`, `h3` para títulos, y fondos de colores para iconos
- **Resultado**: Diseño consistente con otras páginas del backoffice

### 4. Cálculo de Métricas
- **Problema**: Métricas se calculaban solo sobre datos visibles en la página actual
- **Solución**: Función RPC que calcula sobre todos los datos del dealership
- **Resultado**: Métricas globales precisas independientes de filtros de tabla

## 🧪 Testing

### Datos de Prueba
- **Dealership ID**: `534e6d39-7cea-4182-b9ad-15b0f4997484`
- **Registros julio 2025**: 3 completados (3 promotores, 0 detractores)
- **NPS Score esperado**: 100%
- **Pendientes**: 51 registros

### Verificación
```sql
-- Query de verificación
SELECT 
  COUNT(*) as total_registros,
  COUNT(*) FILTER (WHERE score >= 9) as promotores,
  COUNT(*) FILTER (WHERE score <= 6) as detractores,
  ROUND(
    (COUNT(*) FILTER (WHERE score >= 9)::DECIMAL - 
     COUNT(*) FILTER (WHERE score <= 6)::DECIMAL) / 
    COUNT(*) FILTER (WHERE score IS NOT NULL)::DECIMAL * 100, 2
  ) as nps_score
FROM nps n
JOIN client c ON n.customer_id = c.id
WHERE c.dealership_id = '534e6d39-7cea-4182-b9ad-15b0f4997484'
  AND n.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND n.created_at <= CURRENT_DATE
  AND n.status = 'completed'
  AND n.score IS NOT NULL;
```

## 📈 Impacto

### Antes
- ❌ Métricas calculadas solo sobre datos visibles
- ❌ Paginación de 10 registros
- ❌ Estilos inconsistentes
- ❌ Métricas incorrectas (incluía registros pendientes)

### Después
- ✅ Métricas globales precisas
- ✅ Paginación de 25 registros
- ✅ Estilos consistentes con el proyecto
- ✅ Métricas correctas (solo registros completados)

## 🔧 Función RPC Final

```sql
CREATE OR REPLACE FUNCTION get_nps_metrics(
  p_dealership_id UUID,
  p_status_filter TEXT DEFAULT NULL,
  p_classification_filter TEXT DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL
) RETURNS JSON AS $$
-- Función completa con filtros correctos para status = 'completed' y score IS NOT NULL
$$ LANGUAGE plpgsql;
```

## 📝 Notas Técnicas

- **Filtros críticos**: `AND n.status = 'completed'` y `AND n.score IS NOT NULL`
- **Cálculo NPS**: `(promoters - detractors) / total_responses * 100`
- **Paginación**: 25 registros por página para mejor UX
- **Estilos**: Consistente con shadcn/ui y patrones del proyecto

## ✅ Estado Final
- **Funcionando**: ✅
- **Métricas precisas**: ✅
- **Estilos consistentes**: ✅
- **Paginación mejorada**: ✅
- **Documentado**: ✅ 