# 🔍 Mejora en Búsqueda de Clientes: Búsqueda por Palabras Individuales

## 🎯 Objetivo
Mejorar la búsqueda de clientes para que funcione con palabras individuales, permitiendo encontrar clientes como "LUIS ADRIAN SANCHEZ ALCARAZ" cuando se busca "LUIS SANCHEZ".

## 📁 Archivos Modificados

### Backend
- **`hooks/useClientSearch.ts`** - Implementada búsqueda por palabras individuales con lógica AND

### Documentación
- **`README-client-search-words-improvement.md`** - Este archivo

## 🚀 Implementación

### Problema Resuelto
- **Limitación anterior**: La búsqueda solo funcionaba con cadenas exactas
- **Ejemplo del problema**: Buscar "LUIS SANCHEZ" no encontraba "LUIS ADRIAN SANCHEZ ALCARAZ"
- **Causa**: Query SQL buscaba la cadena completa `%LUIS SANCHEZ%` en lugar de palabras individuales
- **Solución**: Dividir la consulta en palabras y buscar cada una por separado con lógica AND

### Cambios Técnicos

#### 1. Lógica de Búsqueda Mejorada
```typescript
// ANTES: Búsqueda por cadena completa
.or(`names.ilike.%${query}%,phone_number.ilike.%${query}%`)

// DESPUÉS: Búsqueda por palabras individuales con AND
const words = query.trim().split(/\s+/).filter(word => word.length > 0);

if (words.length > 0) {
  // Aplicar filtros para cada palabra del nombre (AND)
  words.forEach(word => {
    supabaseQuery = supabaseQuery.filter('names', 'ilike', `%${word}%`);
  });
  
  // Agregar búsqueda por teléfono completo (OR)
  const phoneQuery = supabase
    .from('client')
    .select('id, names, phone_number, dealership_id')
    .eq('dealership_id', dealershipId)
    .ilike('phone_number', `%${query}%`);
  
  // Ejecutar ambas consultas y combinar resultados únicos
  const [nameResults, phoneResults] = await Promise.all([
    supabaseQuery.limit(10).order('names'),
    phoneQuery.limit(10).order('names')
  ]);
}
```

#### 2. Funcionamiento Detallado
1. **División de palabras**: `"LUIS SANCHEZ"` → `["LUIS", "SANCHEZ"]`
2. **Aplicación de filtros AND**: 
   - `names ILIKE '%LUIS%' AND names ILIKE '%SANCHEZ%'`
3. **Búsqueda por teléfono**: `phone_number ILIKE '%LUIS SANCHEZ%'`
4. **Combinación de resultados**: (Resultados de nombre) OR (Resultados de teléfono)

## 📡 Funcionalidad

### Búsqueda Inteligente por Palabras (AND)
- **Por nombre completo**: "Juan Pérez" → Solo encuentra clientes que contengan AMBAS palabras
- **Por palabras sueltas**: "LUIS SANCHEZ" → Solo encuentra "LUIS ADRIAN SANCHEZ ALCARAZ" (contiene ambas)
- **Por apellidos**: "García López" → Solo encuentra clientes con ambos apellidos
- **Por teléfono**: "5551234567" → Funciona igual que antes

### Ejemplos de Uso
```
Input: "LUIS SANCHEZ" 
→ ✅ Encuentra: "LUIS ADRIAN SANCHEZ ALCARAZ" (contiene LUIS Y SANCHEZ)
→ ✅ Encuentra: "LUIS SANCHEZ MARTINEZ" (contiene LUIS Y SANCHEZ)
→ ❌ NO encuentra: "MARIA LUIS GARCIA" (solo contiene LUIS)
→ ❌ NO encuentra: "JUAN SANCHEZ PEREZ" (solo contiene SANCHEZ)

Input: "ADRIAN ALCARAZ"
→ ✅ Encuentra: "LUIS ADRIAN SANCHEZ ALCARAZ" (contiene ADRIAN Y ALCARAZ)
→ ✅ Encuentra: "ADRIAN ALCARAZ GONZALEZ" (contiene ADRIAN Y ALCARAZ)
→ ❌ NO encuentra: "ADRIAN GARCIA" (solo contiene ADRIAN)

Input: "5551234567"
→ ✅ Encuentra: Cliente con teléfono "5551234567"
```

### Límites y Filtros
- **Límite de resultados**: 10 clientes máximo por consulta
- **Filtro por dealership**: Solo clientes del dealership actual
- **Ordenamiento**: Por nombre alfabético
- **Debouncing**: 300ms para evitar queries excesivas
- **Palabras mínimas**: Solo palabras con 1+ caracteres
- **Lógica de búsqueda**: AND para palabras del nombre, OR para teléfono

## 🧪 Testing

### Casos de Prueba
1. **Búsqueda por nombre completo**: "Juan Pérez" → Solo clientes con ambos nombres
2. **Búsqueda por palabras separadas**: "LUIS SANCHEZ" → Solo clientes con ambas palabras
3. **Búsqueda por una palabra**: "ADRIAN" → Encuentra todos los clientes con "ADRIAN"
4. **Búsqueda por apellidos**: "García López" → Solo clientes con ambos apellidos
5. **Búsqueda por teléfono**: "5551234567" → Funciona igual que antes
6. **Búsqueda con espacios extra**: "  LUIS  SANCHEZ  " → Funciona correctamente
7. **Búsqueda vacía**: Debe mostrar clientes seleccionados previamente

### Validación
- ✅ Búsqueda funciona en página de nueva cita
- ✅ Búsqueda funciona en página de recordatorios
- ✅ Búsqueda funciona en página de vehículos
- ✅ Resultados filtrados por dealership_id
- ✅ Mantiene clientes seleccionados previamente
- ✅ Manejo de errores mejorado
- ✅ Logging detallado para debugging
- ✅ Lógica AND correcta para palabras del nombre

## 📈 Impacto

### Beneficios
- **Mejora UX**: Los usuarios pueden encontrar clientes más fácilmente
- **Precisión**: Solo encuentra clientes que contengan TODAS las palabras buscadas
- **Eficiencia**: Reduce resultados irrelevantes
- **Intuitividad**: Comportamiento más natural para los usuarios

### Compatibilidad
- **Retrocompatible**: No afecta funcionalidad existente
- **Misma API**: El hook mantiene la misma interfaz
- **Mismo componente**: ClienteComboBox funciona igual
- **Mismos límites**: 10 resultados, filtrado por dealership

## 🔄 Patrón Establecido

Esta implementación mejora el patrón existente sin romper la compatibilidad:

### Páginas que Usan el Hook
- **Página de Citas**: `app/backoffice/citas/nueva/page.tsx`
- **Página de Recordatorios**: `app/backoffice/recordatorios/page.tsx`
- **Página de Vehículos**: `app/backoffice/vehiculos/nuevo/page.tsx`

### Hook useClientSearch
```typescript
// hooks/useClientSearch.ts
const words = query.trim().split(/\s+/).filter(word => word.length > 0);
words.forEach(word => {
  supabaseQuery = supabaseQuery.filter('names', 'ilike', `%${word}%`);
});
```

## 🎯 Próximos Pasos
- Monitorear performance en producción
- Considerar agregar búsqueda por email si es necesario
- Evaluar si otros modales necesitan la misma actualización
- Considerar implementar búsqueda con trigram para casos más complejos

## 📊 Métricas de Performance

### Antes vs Después
| Métrica | Antes | Después |
|---------|-------|---------|
| **Búsqueda "LUIS SANCHEZ"** | ❌ No encuentra "LUIS ADRIAN SANCHEZ ALCARAZ" | ✅ Encuentra el cliente |
| **Búsqueda por palabras** | ❌ Solo cadena exacta | ✅ Palabras individuales con AND |
| **Precisión** | ❌ Baja (muchos falsos positivos) | ✅ Alta (solo resultados relevantes) |
| **UX** | ❌ Confusa | ✅ Intuitiva |

### Ejemplo Real
```
Cliente en BD: "LUIS ADRIAN SANCHEZ ALCARAZ"

ANTES:
- Buscar "LUIS SANCHEZ" → ❌ No encuentra
- Buscar "LUIS ADRIAN SANCHEZ ALCARAZ" → ✅ Encuentra

DESPUÉS:
- Buscar "LUIS SANCHEZ" → ✅ Encuentra (contiene ambas palabras)
- Buscar "ADRIAN ALCARAZ" → ✅ Encuentra (contiene ambas palabras)
- Buscar "SANCHEZ" → ✅ Encuentra (una palabra)
- Buscar "LUIS GARCIA" → ❌ NO encuentra (solo contiene LUIS)
- Buscar "LUIS ADRIAN SANCHEZ ALCARAZ" → ✅ Encuentra
```

## 🔧 Lógica de Búsqueda

### Consultas SQL Generadas
```sql
-- Para búsqueda "LUIS SANCHEZ":
-- Consulta 1 (nombre): 
SELECT * FROM client 
WHERE dealership_id = 'xxx' 
AND names ILIKE '%LUIS%' 
AND names ILIKE '%SANCHEZ%'
ORDER BY names LIMIT 10;

-- Consulta 2 (teléfono):
SELECT * FROM client 
WHERE dealership_id = 'xxx' 
AND phone_number ILIKE '%LUIS SANCHEZ%'
ORDER BY names LIMIT 10;

-- Resultado final: UNION de ambas consultas
```

---

**Nota**: Esta mejora resuelve el problema específico reportado por el usuario donde "LUIS SANCHEZ" no encontraba a "LUIS ADRIAN SANCHEZ ALCARAZ", mejorando significativamente la experiencia de búsqueda de clientes en todo el sistema. Ahora la búsqueda es más precisa, encontrando solo clientes que contengan TODAS las palabras buscadas.
