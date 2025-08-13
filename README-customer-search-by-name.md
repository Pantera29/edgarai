# 🔍 Búsqueda de Clientes por Nombre en Endpoint de Verificación

## 🎯 Objetivo
Extender el endpoint `/api/customers/verify` para soportar búsqueda de clientes por nombre, además de la funcionalidad existente de búsqueda por teléfono. Esto resuelve el problema de no poder encontrar clientes cuando solo se conoce el nombre pero no el teléfono.

## 📁 Archivos Modificados

### Backend
- **`app/api/customers/verify/route.ts`** - Agregado soporte para búsqueda por nombre
- **`README-customer-search-by-name.md`** - Este archivo

## 🚀 Implementación

### Problema Resuelto
- **Situación**: Cliente pregunta por cita a nombre de "FRANCO LONGHI" pero no se conoce el teléfono
- **Limitación anterior**: Solo se podía buscar por teléfono
- **Solución**: Búsqueda flexible por nombre, teléfono, o ambos

### Nuevas Funcionalidades

#### 1. Búsqueda por Nombre (Nuevo)
```typescript
GET /api/customers/verify?name=FRANCO LONGHI&dealership_id=123
```

#### 2. Búsqueda Combinada (Nuevo)
```typescript
GET /api/customers/verify?phone=5551234567&name=FRANCO&dealership_id=123
```

#### 3. Búsqueda por Teléfono (Existente)
```typescript
GET /api/customers/verify?phone=5551234567&dealership_id=123
```

### Características Técnicas

#### ✅ **Validaciones Implementadas**
- **Al menos un parámetro**: Se requiere `phone` O `name`
- **dealership_id obligatorio**: Para búsquedas por nombre (privacidad y rendimiento)
- **Validación de nombre**: No permite nombres vacíos o solo espacios

#### ✅ **Lógica de Búsqueda por Nombre**
- **División en palabras**: "FRANCO LONGHI" → ["FRANCO", "LONGHI"]
- **Búsqueda AND**: Todas las palabras deben estar presentes en el nombre
- **Case insensitive**: No distingue mayúsculas/minúsculas
- **Búsqueda parcial**: Funciona con fragmentos de palabras

#### ✅ **Manejo de Resultados**
- **Incluye phone_number**: En respuestas de búsqueda por nombre
- **Mensajes específicos**: Según el tipo de búsqueda realizada
- **Múltiples clientes**: Manejo detallado con información completa

## 📡 Uso del Endpoint

### Ejemplos de Búsqueda

#### Búsqueda por Nombre
```bash
GET /api/customers/verify?name=FRANCO LONGHI&dealership_id=6b58f82d-baa6-44ce-9941-1a61975d20b5
```

**Respuesta exitosa (200)**:
```json
{
  "exists": true,
  "multipleClients": false,
  "message": "Client found successfully.",
  "client": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "FRANCO LONGHI",
    "email": "franco@example.com",
    "phone_number": "5551234567",
    "agent_active": true,
    "dealership_id": "6b58f82d-baa6-44ce-9941-1a61975d20b5"
  },
  "phone": null,
  "name": "FRANCO LONGHI",
  "dealershipId": "6b58f82d-baa6-44ce-9941-1a61975d20b5"
}
```

#### Búsqueda Combinada
```bash
GET /api/customers/verify?phone=5551234567&name=FRANCO&dealership_id=6b58f82d-baa6-44ce-9941-1a61975d20b5
```

#### Cliente No Encontrado (404)
```json
{
  "exists": false,
  "message": "No client found with name \"FRANCO LONGHI\" in the specified dealership. You can create a new client using the /api/customers/create endpoint.",
  "phone": null,
  "name": "FRANCO LONGHI",
  "dealershipId": "6b58f82d-baa6-44ce-9941-1a61975d20b5"
}
```

#### Múltiples Clientes (409)
```json
{
  "exists": true,
  "multipleClients": true,
  "count": 2,
  "message": "Multiple clients found with this name in the specified dealership. Consider using more specific search criteria.",
  "phone": null,
  "name": "FRANCO LONGHI",
  "dealershipId": "6b58f82d-baa6-44ce-9941-1a61975d20b5",
  "clients": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "FRANCO LONGHI MARTINEZ",
      "email": "franco1@example.com",
      "phone_number": "5551234567",
      "agent_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "dealership_id": "6b58f82d-baa6-44ce-9941-1a61975d20b5"
    },
    {
      "id": "456e7890-e89b-12d3-a456-426614174000",
      "name": "FRANCO LONGHI GARCIA",
      "email": "franco2@example.com",
      "phone_number": "5559876543",
      "agent_active": true,
      "created_at": "2024-02-20T14:15:00Z",
      "dealership_id": "6b58f82d-baa6-44ce-9941-1a61975d20b5"
    }
  ]
}
```

### Errores de Validación

#### Sin parámetros (400)
```bash
GET /api/customers/verify
```
```json
{
  "message": "Either phone or name parameter is required in URL query. Usage: /api/customers/verify?phone={phone_number}[&dealership_id={dealership_id}] OR /api/customers/verify?name={name}&dealership_id={dealership_id}. The dealership_id parameter is required when searching by name."
}
```

#### Nombre sin dealership_id (400)
```bash
GET /api/customers/verify?name=FRANCO LONGHI
```
```json
{
  "message": "dealership_id parameter is required when searching by name. Usage: /api/customers/verify?name={name}&dealership_id={dealership_id}"
}
```

## 🧪 Casos de Uso

### 1. Búsqueda por Nombre Completo
```
Input: "FRANCO LONGHI"
→ Encuentra: "FRANCO LONGHI MARTINEZ", "FRANCO LONGHI GARCIA"
→ Lógica: AND (contiene FRANCO Y LONGHI)
```

### 2. Búsqueda por Nombre Parcial
```
Input: "FRANCO"
→ Encuentra: "FRANCO LONGHI", "FRANCO MARTINEZ", "FRANCO GARCIA"
→ Lógica: Contiene la palabra "FRANCO"
```

### 3. Búsqueda Combinada
```
Input: phone="5551234567" + name="FRANCO"
→ Encuentra: Solo clientes con ese teléfono Y que contengan "FRANCO"
→ Lógica: AND entre teléfono exacto y nombre parcial
```

### 4. Búsqueda por Apellidos
```
Input: "LONGHI MARTINEZ"
→ Encuentra: "FRANCO LONGHI MARTINEZ", "JUAN LONGHI MARTINEZ"
→ Lógica: AND (contiene LONGHI Y MARTINEZ)
```

## 🔒 Consideraciones de Seguridad

### Privacidad
- **dealership_id obligatorio**: Evita búsquedas globales por nombre
- **Filtrado por agencia**: Solo clientes del dealership especificado
- **Información limitada**: Solo datos necesarios en la respuesta

### Rendimiento
- **Índices SQL**: Usa índices existentes de `names` y `dealership_id`
- **Límite implícito**: Ordenamiento por `created_at` limita resultados
- **Búsqueda eficiente**: Filtros aplicados en la base de datos

## 📈 Beneficios

### Para el Usuario Final
- **Flexibilidad**: Múltiples formas de encontrar clientes
- **Eficiencia**: Reduce tiempo de búsqueda
- **Precisión**: Búsqueda combinada para resultados más exactos

### Para el Sistema
- **Consistencia**: Un solo endpoint para verificación
- **Mantenibilidad**: Lógica centralizada
- **Escalabilidad**: Fácil extensión para nuevos criterios

### Para Integraciones
- **API unificada**: Mismo endpoint para diferentes tipos de búsqueda
- **Respuestas consistentes**: Mismo formato de respuesta
- **Documentación clara**: Uso intuitivo y bien documentado

## 🔄 Compatibilidad

### Retrocompatible
- ✅ **Búsqueda por teléfono**: Funciona exactamente igual que antes
- ✅ **Parámetros opcionales**: `dealership_id` sigue siendo opcional para teléfono
- ✅ **Respuestas**: Mismo formato de respuesta para búsquedas por teléfono

### Nuevas Funcionalidades
- ✅ **Búsqueda por nombre**: Nueva funcionalidad agregada
- ✅ **Búsqueda combinada**: Combinación de teléfono y nombre
- ✅ **Validaciones mejoradas**: Mensajes de error más específicos

## 🎯 Próximos Pasos

### Mejoras Futuras Opcionales
1. **Búsqueda fuzzy**: Para nombres con errores tipográficos
2. **Búsqueda por email**: Extender para incluir email como criterio
3. **Paginación**: Para resultados con muchos clientes
4. **Filtros adicionales**: Por fecha de creación, estado, etc.
5. **Cache**: Implementar cache para búsquedas frecuentes

### Integración con Frontend
1. **Actualizar documentación**: De APIs internas
2. **Testing**: Crear tests automatizados
3. **Monitoreo**: Agregar métricas de uso del endpoint
