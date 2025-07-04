# 🔧 Corrección de Normalización de Números de Teléfono

## 🎯 Problema Resuelto

**Problema**: El endpoint `/api/dealerships/find-by-phone` no encontraba agencias porque la normalización de teléfonos era inconsistente.

**Causa**: 
- La tabla `dealership_mapping` almacena teléfonos en formato internacional completo (`525596617239`)
- El endpoint recibía teléfonos en múltiples formatos (`5596617239`, `+525596617239`, etc.)
- La normalización era básica y no manejaba todos los casos
- **Bug crítico**: Se normalizaba el teléfono pero se usaba el original en la consulta
- **Problema adicional**: Fallback automático a agencia por defecto enmascaraba errores

## ✅ Solución Implementada

### 1. Función de Normalización Robusta

**Archivo**: `lib/utils.ts`

```typescript
export function normalizePhoneNumber(phone: string): string {
  // 1. Remover todos los caracteres no numéricos
  let normalized = phone.replace(/[^0-9]/g, '');
  
  // 2. Si empieza con 52 y tiene 12 dígitos, está bien
  if (normalized.startsWith('52') && normalized.length === 12) {
    return normalized;
  }
  
  // 3. Si empieza con 52 y tiene más de 12 dígitos, tomar los últimos 12
  if (normalized.startsWith('52') && normalized.length > 12) {
    return normalized.slice(-12);
  }
  
  // 4. Si no empieza con 52 pero tiene 10 dígitos, agregar 52
  if (!normalized.startsWith('52') && normalized.length === 10) {
    return '52' + normalized;
  }
  
  // 5. Si no empieza con 52 pero tiene 11 dígitos, verificar si empieza con 1
  if (!normalized.startsWith('52') && normalized.length === 11 && normalized.startsWith('1')) {
    return '52' + normalized.slice(1);
  }
  
  // 6. Para cualquier otro caso, intentar extraer los últimos 10 dígitos y agregar 52
  if (normalized.length >= 10) {
    const last10 = normalized.slice(-10);
    return '52' + last10;
  }
  
  // 7. Si no se puede normalizar, devolver el original limpio
  return normalized;
}
```

### 2. Corrección del Endpoint Principal

**Archivo**: `app/api/dealerships/find-by-phone/route.ts`

**Cambios**:
- ✅ Importa la función de normalización
- ✅ Usa el número normalizado en la consulta (no el original)
- ✅ Mejora el logging para debugging
- ✅ Corrige el bug crítico de usar `phoneNumber` en lugar de `normalizedPhone`

### 3. Eliminación del Fallback Automático

**Archivo**: `lib/config.ts`

**Cambios**:
- ✅ Agrega parámetro `useFallback` (por defecto `false`)
- ✅ Retorna `null` cuando no encuentra la agencia (sin fallback automático)
- ✅ Solo usa fallback cuando se solicita explícitamente
- ✅ Mejora el logging para debugging

### 4. Actualización de Todos los Endpoints

**Endpoints actualizados**:
- ✅ `/api/dealerships/info` - No usa fallback, retorna 404 si no encuentra agencia
- ✅ `/api/dealerships/usage` - No usa fallback, retorna 404 si no encuentra agencia  
- ✅ `/api/appointments/create` - No usa fallback, retorna 404 si no encuentra agencia
- ✅ `/api/customers/create` - No usa fallback, retorna 404 si no encuentra agencia

## 🚨 Cambio de Comportamiento Importante

### Antes (Problemático)
```typescript
// Si no encontraba la agencia, usaba fallback automático
const dealershipId = await getDealershipId({
  dealershipPhone: "5596617239",
  supabase
});
// Resultado: Siempre retornaba DEFAULT_DEALERSHIP_ID (agencia incorrecta)
```

### Ahora (Correcto)
```typescript
// Si no encuentra la agencia, retorna null
const dealershipId = await getDealershipId({
  dealershipPhone: "5596617239",
  supabase,
  useFallback: false // ← Por defecto NO usar fallback
});
// Resultado: Retorna null si no encuentra la agencia
```

## 📱 Casos de Prueba Soportados

Con el teléfono `525596617239` almacenado en la tabla:

| Input | Normalizado | Resultado |
|-------|-------------|-----------|
| `5596617239` | `525596617239` | ✅ Match |
| `+525596617239` | `525596617239` | ✅ Match |
| `52 55 9661 7239` | `525596617239` | ✅ Match |
| `(52) 55-9661-7239` | `525596617239` | ✅ Match |
| `+52 55 9661 7239` | `525596617239` | ✅ Match |
| `15596617239` | `525596617239` | ✅ Match |
| `525596617239` | `525596617239` | ✅ Match |

## 🔍 Logging Mejorado

### Antes
```
📱 Teléfono normalizado: 525596617239
```

### Después
```
📱 Normalización de teléfono: {
  original: "5596617239",
  normalized: "525596617239"
}
```

## 🚀 Beneficios

1. **Consistencia**: Misma normalización en todos los endpoints
2. **Robustez**: Maneja múltiples formatos de entrada
3. **Debugging**: Logging detallado para troubleshooting
4. **Seguridad**: No más fallback automático a agencias incorrectas
5. **Claridad**: Errores claros cuando no se encuentra la agencia
6. **Mantenibilidad**: Función centralizada en `lib/utils.ts`

## 🧪 Testing

### Probar el Endpoint (Ahora con Error Correcto)
```bash
# Formato local - Ahora debería encontrar la agencia correcta
curl "https://www.edgarai.com.mx/api/dealerships/find-by-phone?phone=5596617239"

# Formato internacional
curl "https://www.edgarai.com.mx/api/dealerships/find-by-phone?phone=+525596617239"

# Formato con espacios
curl "https://www.edgarai.com.mx/api/dealerships/find-by-phone?phone=52%2055%209661%207239"

# Teléfono inexistente - Ahora retorna 404 (no fallback)
curl "https://www.edgarai.com.mx/api/dealerships/find-by-phone?phone=1234567890"
```

### Probar la Función de Utilidad
```typescript
import { normalizePhoneNumber } from "@/lib/utils";

console.log(normalizePhoneNumber("5596617239")); // "525596617239"
console.log(normalizePhoneNumber("+525596617239")); // "525596617239"
console.log(normalizePhoneNumber("52 55 9661 7239")); // "525596617239"
```

## 📊 Impacto

- **Endpoints afectados**: `/api/dealerships/find-by-phone`, `/api/dealerships/info`, `/api/dealerships/usage`, `/api/appointments/create`, `/api/customers/create`
- **Funciones afectadas**: `getDealershipId()`
- **Compatibilidad**: ⚠️ **Breaking change** - Ahora retorna error en lugar de fallback
- **Performance**: ⚡ Sin impacto (normalización es O(1))

## 🔒 Consideraciones de Seguridad

- ✅ Validación de entrada mantenida
- ✅ Manejo de errores mejorado
- ✅ Logging sin información sensible
- ✅ No expone lógica interna en respuestas
- ✅ **Nuevo**: No más datos de agencias incorrectas por fallback

## ⚠️ Breaking Changes

### Para Clientes Existentes
- **Antes**: Endpoints siempre retornaban datos (aunque de agencia incorrecta)
- **Ahora**: Endpoints retornan 404 si no encuentran la agencia por teléfono

### Migración Recomendada
1. **Verificar**: Que todos los teléfonos estén en `dealership_mapping`
2. **Actualizar**: Clientes para manejar errores 404
3. **Probar**: Con teléfonos reales de cada agencia

---

**Estado**: ✅ Implementado y listo para producción
**Fecha**: $(date)
**Autor**: Sistema de Citas para Talleres Automotrices 