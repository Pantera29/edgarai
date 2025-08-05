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
3. **La lógica de filtrado** tenía problemas con parámetros `null` (como `months: null`)
4. **El uso de `.single()`** fallaba al recibir múltiples resultados o ninguno
5. **Código duplicado** en el manejo de errores causaba confusión

### Solución Aplicada

#### 1. Actualización de Tipos TypeScript
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

#### 2. Mejora de la Lógica de Filtrado
- **Eliminado `.single()`** y reemplazado por `.limit(10)` para debugging
- **Agregado logging detallado** de servicios encontrados
- **Eliminado código duplicado** en manejo de errores
- **Mejorado el manejo** de parámetros `null` (como `months: null`)
- **Simplificada la lógica** de selección del servicio más apropiado

#### 3. Lógica Inteligente de Búsqueda Cruzada
- **Búsqueda en agencia específica** primero
- **Búsqueda automática en otras agencias** si no se encuentra en la específica
- **Retorno de precio de otra agencia** con indicador de origen
- **Derivación a humano** solo si no se encuentra en ninguna agencia
- **Mensajes de error en inglés** para mejor integración con MCP y agentes de AI

## 🧪 Testing
- **Antes**: El endpoint fallaba con múltiples filas retornadas o parámetros `null`
- **Después**: El endpoint debería manejar correctamente todos los casos y retornar el servicio más apropiado

### Casos de Prueba
1. **Con dealership_id**: Debería filtrar servicios específicos del concesionario
2. **Sin dealership_id**: Debería buscar servicios globales (sin filtro de concesionario)
3. **Con kilometers pero sin months**: Debería funcionar correctamente con `months: null`
4. **Con months pero sin kilometers**: Debería funcionar correctamente con `kilometers: null`
5. **Múltiples servicios**: Debería retornar el más apropiado según el ordenamiento
6. **Modelo sin servicios en agencia específica**: Debería buscar en otras agencias y retornar precio
7. **Modelo sin servicios en ninguna agencia**: Debería retornar error descriptivo en inglés

## 📈 Impacto
- **Resuelve el error** del endpoint de precios
- **Mantiene la funcionalidad** de filtrado por concesionario
- **Mejora la precisión** de búsqueda de servicios específicos
- **Implementa búsqueda inteligente** cruzada entre agencias
- **Optimiza la experiencia del usuario** al encontrar precios de modelos similares
- **Facilita la integración con MCP y agentes de AI** con mensajes en inglés
- **Reduce la necesidad de intervención humana** en casos comunes
- **No afecta** otros endpoints que ya usaban este campo

## 🔍 Evidencia del Problema
El campo `dealership_id` ya se estaba usando en otros archivos del proyecto, lo que confirmaba que el campo existe en la base de datos pero faltaba en los tipos TypeScript.

**Nota**: Los archivos de transacciones mencionados anteriormente han sido eliminados como parte de la migración de NPS para usar `appointment_id` directamente.

## 📝 Notas Técnicas
- **Tipo**: `string` (UUID del concesionario)
- **Opcional**: En Insert y Update (puede ser `undefined`)
- **Requerido**: En Row (siempre presente en la base de datos)
- **Compatibilidad**: No rompe código existente que ya usaba este campo 