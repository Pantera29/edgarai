# Fix del Endpoint de Precios - Campo dealership_id Faltante

## 🎯 Objetivo
Resolver el error `"JSON object requested, multiple (or no) rows returned"` en el endpoint `/api/services/price` que estaba causado por la falta del campo `dealership_id` en los tipos TypeScript de la tabla `specific_services`.

## 📁 Archivos Modificados
- **`types/database.types.ts`**: Agregado el campo `dealership_id` a la tabla `specific_services` en Row, Insert y Update
- **`README-price-api-dealership-id-fix.md`**: Este archivo de documentación

## 🚀 Implementación

### Problema Identificado
El endpoint `/api/services/price` estaba fallando con el error:
```
❌ [Price API] Error al buscar servicio: {
  error: 'JSON object requested, multiple (or no) rows returned',
  modelId: '8c0da18d-3756-45ee-ae8e-99a550901b35',
  dealership_id: '6fa78291-c16a-4c78-9fe2-9e3695d24d48',
  parameters: { kilometers: '60000', months: null }
}
```

### Causa Raíz
1. **El código del endpoint** intentaba filtrar por `dealership_id` en la tabla `specific_services`
2. **Los tipos TypeScript** no incluían el campo `dealership_id` en la definición de `specific_services`
3. **Esto causaba** que la consulta no filtrara correctamente y devolviera múltiples filas
4. **El uso de `.single()`** fallaba al recibir múltiples resultados

### Solución Aplicada
Agregado el campo `dealership_id` a la tabla `specific_services` en los tipos TypeScript:

```typescript
specific_services: {
  Row: {
    // ... campos existentes ...
    dealership_id: string  // ← NUEVO CAMPO
  }
  Insert: {
    // ... campos existentes ...
    dealership_id?: string  // ← NUEVO CAMPO
  }
  Update: {
    // ... campos existentes ...
    dealership_id?: string  // ← NUEVO CAMPO
  }
}
```

## 🧪 Testing
- **Antes**: El endpoint fallaba con múltiples filas retornadas
- **Después**: El endpoint debería filtrar correctamente por `dealership_id` y retornar una sola fila

### Casos de Prueba
1. **Con dealership_id**: Debería filtrar servicios específicos del concesionario
2. **Sin dealership_id**: Debería buscar servicios globales (sin filtro de concesionario)
3. **Múltiples servicios**: Debería retornar el más apropiado según kilometers/months

## 📈 Impacto
- **Resuelve el error** del endpoint de precios
- **Mantiene la funcionalidad** de filtrado por concesionario
- **Mejora la precisión** de búsqueda de servicios específicos
- **No afecta** otros endpoints que ya usaban este campo

## 🔍 Evidencia del Problema
El campo `dealership_id` ya se estaba usando en otros archivos del proyecto:
- `app/api/transactions/create/route.ts` (línea 147)
- `app/api/transactions/update/[id]/route.ts` (línea 107)
- `components/workshop/transaction-form.tsx` (línea 125)

Esto confirmaba que el campo existe en la base de datos pero faltaba en los tipos TypeScript.

## 📝 Notas Técnicas
- **Tipo**: `string` (UUID del concesionario)
- **Opcional**: En Insert y Update (puede ser `undefined`)
- **Requerido**: En Row (siempre presente en la base de datos)
- **Compatibilidad**: No rompe código existente que ya usaba este campo 