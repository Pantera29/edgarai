# Endpoints de Mecánicos - Documentación Completa

## 🎯 Objetivo
Crear endpoints completos para la gestión de mecánicos en el sistema, incluyendo operaciones CRUD (Create, Read, Update, Delete) con validaciones y relaciones apropiadas.

## 📁 Archivos Creados

### 1. Tipos TypeScript
- **`types/database.types.ts`** - Tipos actualizados para la tabla `mechanics` ✅

### 2. Endpoints API
- **`app/api/mechanics/route.ts`** - Endpoints principales (GET, POST) ✅
- **`app/api/mechanics/[id]/route.ts`** - Endpoints específicos (GET, PUT, DELETE) ✅

### 3. Documentación
- **`README-mechanics-endpoints.md`** - Este archivo ✅

## 🚀 Endpoints Implementados

### 1. **GET /api/mechanics** - Listar Mecánicos

**Descripción:** Obtiene una lista de mecánicos con filtros opcionales.

**Parámetros de consulta:**
- `dealership_id` (opcional): Filtrar por concesionario
- `workshop_id` (opcional): Filtrar por taller
- `is_active` (opcional): Filtrar por estado activo (true/false)
- `limit` (opcional): Límite de resultados
- `offset` (opcional): Desplazamiento para paginación

**Ejemplos de uso:**
```bash
# Obtener todos los mecánicos
GET /api/mechanics

# Filtrar por concesionario
GET /api/mechanics?dealership_id=uuid-del-dealership

# Filtrar por taller y estado activo
GET /api/mechanics?workshop_id=uuid-del-workshop&is_active=true

# Con paginación
GET /api/mechanics?limit=10&offset=0
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-del-mecanico",
      "name": "Juan Pérez",
      "email": "juan.perez@taller.com",
      "phone": "5551234567",
      "specialties": ["Motor", "Transmisión"],
      "is_active": true,
      "dealership_id": "uuid-del-dealership",
      "workshop_id": "uuid-del-workshop",
      "created_at": "2024-12-15T10:30:00Z",
      "dealerships": {
        "id": "uuid-del-dealership",
        "name": "Taller Principal"
      },
      "workshops": {
        "id": "uuid-del-workshop",
        "name": "Taller Norte"
      }
    }
  ],
  "count": 1,
  "filters": {
    "dealership_id": "uuid-del-dealership",
    "workshop_id": null,
    "is_active": null,
    "limit": null,
    "offset": null
  }
}
```

### 2. **POST /api/mechanics** - Crear Mecánico

**Descripción:** Crea un nuevo mecánico en el sistema.

**Payload requerido:**
```json
{
  "name": "Juan Pérez",
  "email": "juan.perez@taller.com",
  "phone": "5551234567",
  "specialties": ["Motor", "Transmisión"],
  "is_active": true,
  "dealership_id": "uuid-del-dealership",
  "workshop_id": "uuid-del-workshop"
}
```

**Campos:**
- `name` (requerido): Nombre del mecánico
- `email` (opcional): Email único del mecánico
- `phone` (opcional): Teléfono del mecánico
- `specialties` (opcional): Array de especialidades
- `is_active` (opcional): Estado activo (default: true)
- `dealership_id` (requerido): ID del concesionario
- `workshop_id` (opcional): ID del taller

**Validaciones:**
- ✅ Nombre requerido y no vacío
- ✅ Dealership debe existir
- ✅ Workshop debe existir y pertenecer al dealership
- ✅ Email único en el sistema
- ✅ Especialidades como array de strings

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-del-mecanico",
    "name": "Juan Pérez",
    "email": "juan.perez@taller.com",
    "phone": "5551234567",
    "specialties": ["Motor", "Transmisión"],
    "is_active": true,
    "dealership_id": "uuid-del-dealership",
    "workshop_id": "uuid-del-workshop",
    "created_at": "2024-12-15T10:30:00Z",
    "dealerships": {
      "id": "uuid-del-dealership",
      "name": "Taller Principal"
    },
    "workshops": {
      "id": "uuid-del-workshop",
      "name": "Taller Norte"
    }
  },
  "message": "Mecánico Juan Pérez creado exitosamente"
}
```

### 3. **GET /api/mechanics/[id]** - Obtener Mecánico Específico

**Descripción:** Obtiene los detalles de un mecánico específico.

**Parámetros:**
- `id`: UUID del mecánico

**Ejemplo:**
```bash
GET /api/mechanics/uuid-del-mecanico
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-del-mecanico",
    "name": "Juan Pérez",
    "email": "juan.perez@taller.com",
    "phone": "5551234567",
    "specialties": ["Motor", "Transmisión"],
    "is_active": true,
    "dealership_id": "uuid-del-dealership",
    "workshop_id": "uuid-del-workshop",
    "created_at": "2024-12-15T10:30:00Z",
    "dealerships": {
      "id": "uuid-del-dealership",
      "name": "Taller Principal"
    },
    "workshops": {
      "id": "uuid-del-workshop",
      "name": "Taller Norte"
    }
  }
}
```

### 4. **PUT /api/mechanics/[id]** - Actualizar Mecánico

**Descripción:** Actualiza los datos de un mecánico existente.

**Parámetros:**
- `id`: UUID del mecánico

**Payload (todos los campos son opcionales):**
```json
{
  "name": "Juan Carlos Pérez",
  "email": "juan.carlos@taller.com",
  "phone": "5551234568",
  "specialties": ["Motor", "Transmisión", "Frenos"],
  "is_active": true,
  "dealership_id": "uuid-del-dealership",
  "workshop_id": "uuid-del-workshop"
}
```

**Validaciones:**
- ✅ Mecánico debe existir
- ✅ Nombre no puede estar vacío si se proporciona
- ✅ Dealership debe existir si se proporciona
- ✅ Workshop debe existir y pertenecer al dealership
- ✅ Email único (diferente al actual) si se proporciona

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-del-mecanico",
    "name": "Juan Carlos Pérez",
    "email": "juan.carlos@taller.com",
    "phone": "5551234568",
    "specialties": ["Motor", "Transmisión", "Frenos"],
    "is_active": true,
    "dealership_id": "uuid-del-dealership",
    "workshop_id": "uuid-del-workshop",
    "created_at": "2024-12-15T10:30:00Z",
    "dealerships": {
      "id": "uuid-del-dealership",
      "name": "Taller Principal"
    },
    "workshops": {
      "id": "uuid-del-workshop",
      "name": "Taller Norte"
    }
  },
  "message": "Mecánico Juan Carlos Pérez actualizado exitosamente"
}
```

### 5. **DELETE /api/mechanics/[id]** - Eliminar Mecánico

**Descripción:** Realiza un soft delete del mecánico (marca como inactivo).

**Parámetros:**
- `id`: UUID del mecánico

**Ejemplo:**
```bash
DELETE /api/mechanics/uuid-del-mecanico
```

**Validaciones:**
- ✅ Mecánico debe existir
- ✅ No puede tener citas futuras asignadas

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-del-mecanico",
    "name": "Juan Pérez",
    "email": "juan.perez@taller.com",
    "phone": "5551234567",
    "specialties": ["Motor", "Transmisión"],
    "is_active": false,
    "dealership_id": "uuid-del-dealership",
    "workshop_id": "uuid-del-workshop",
    "created_at": "2024-12-15T10:30:00Z"
  },
  "message": "Mecánico Juan Pérez eliminado exitosamente"
}
```

## 🔧 Características Técnicas

### **Validaciones Implementadas:**
- ✅ Validación de campos requeridos
- ✅ Validación de unicidad de email
- ✅ Validación de existencia de dealership y workshop
- ✅ Validación de relaciones (workshop pertenece a dealership)
- ✅ Validación de citas futuras antes de eliminar
- ✅ Validación de formato de datos

### **Relaciones Incluidas:**
- ✅ Información del dealership asociado
- ✅ Información del workshop asociado
- ✅ Validación de integridad referencial

### **Logging y Monitoreo:**
- ✅ Logging detallado con emojis siguiendo el patrón del proyecto
- ✅ Logging de operaciones exitosas y errores
- ✅ Información contextual en los logs

### **Manejo de Errores:**
- ✅ Respuestas de error descriptivas
- ✅ Códigos de estado HTTP apropiados
- ✅ Detalles de error para debugging
- ✅ Validación de datos de entrada

## 🧪 Casos de Uso Comunes

### **1. Crear Mecánico Nuevo**
```bash
curl -X POST /api/mechanics \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María González",
    "email": "maria.gonzalez@taller.com",
    "phone": "5559876543",
    "specialties": ["Suspensión", "Dirección"],
    "dealership_id": "uuid-del-dealership",
    "workshop_id": "uuid-del-workshop"
  }'
```

### **2. Listar Mecánicos Activos de un Taller**
```bash
curl "/api/mechanics?workshop_id=uuid-del-workshop&is_active=true"
```

### **3. Actualizar Especialidades de un Mecánico**
```bash
curl -X PUT /api/mechanics/uuid-del-mecanico \
  -H "Content-Type: application/json" \
  -d '{
    "specialties": ["Motor", "Transmisión", "Frenos", "Suspensión"]
  }'
```

### **4. Desactivar Mecánico**
```bash
curl -X DELETE /api/mechanics/uuid-del-mecanico
```

## 🔗 Integración con Otros Sistemas

### **Relación con Citas:**
- Los mecánicos pueden ser asignados a citas a través del campo `assigned_mechanic_id`
- El sistema valida que no se puedan eliminar mecánicos con citas futuras

### **Relación con Talleres:**
- Los mecánicos están asociados a talleres específicos
- Se valida que el taller pertenezca al concesionario correcto

### **Relación con Concesionarios:**
- Todos los mecánicos deben pertenecer a un concesionario
- Se incluye información del concesionario en las respuestas

## 📊 Códigos de Estado HTTP

- **200 OK**: Operación exitosa
- **201 Created**: Mecánico creado exitosamente
- **400 Bad Request**: Datos de entrada inválidos
- **404 Not Found**: Mecánico, dealership o workshop no encontrado
- **409 Conflict**: Email duplicado o mecánico con citas futuras
- **500 Internal Server Error**: Error interno del servidor

## 🚀 Próximos Pasos

1. **Integración con Frontend**: Crear componentes React para gestionar mecánicos
2. **Asignación Automática**: Implementar lógica para asignar mecánicos automáticamente a citas
3. **Reportes**: Crear endpoints para reportes de productividad de mecánicos
4. **Notificaciones**: Integrar notificaciones cuando se asignen citas a mecánicos
5. **Calendario**: Mostrar disponibilidad de mecánicos en el calendario
