# Frontend - Sistema de Límite Total de Citas por Día

## Descripción

Se actualizó la interfaz de gestión de fechas bloqueadas para incluir la configuración del límite máximo de citas totales por día.

## Cambios Realizados

### **1. Tipo de Datos (`types/workshop.ts`)**

Se agregó el campo `max_total_appointments` al tipo `BlockedDate`:

```typescript
export interface BlockedDate {
  block_id: string;
  dealership_id: string;
  date: string;
  reason: string;
  full_day: boolean;
  start_time?: string | null;
  end_time?: string | null;
  max_total_appointments?: number | null;  // ← NUEVO
  created_at: string;
  updated_at: string;
}
```

### **2. Componente de Formulario (`components/workshop/block-date-dialog.tsx`)**

#### **Nuevos Estados:**
```typescript
const [maxCitas, setMaxCitas] = useState<string>('');
```

#### **Nuevo Input:**
```jsx
<div className="grid gap-2">
  <Label htmlFor="max_citas">Límite máximo de citas (opcional)</Label>
  <Input
    id="max_citas"
    type="number"
    value={maxCitas}
    onChange={(e) => setMaxCitas(e.target.value)}
    placeholder="Ej: 5 (vacío = sin límite)"
    min="0"
  />
  <p className="text-sm text-muted-foreground">
    Número máximo de citas totales permitidas este día. Dejar vacío para no limitar.
  </p>
</div>
```

#### **Lógica de Guardado:**
```typescript
// Convertir string a número o null
const maxAppointments = maxCitas.trim() ? parseInt(maxCitas.trim()) : null;

const blockData = {
  // ... otros campos
  max_total_appointments: maxAppointments,
};
```

### **3. Vista de Lista (`app/backoffice/admin/fechas-bloqueadas/page.tsx`)**

Se agregó la visualización del límite de citas en la lista de bloqueos:

```jsx
{block.max_total_appointments !== null && block.max_total_appointments !== undefined && (
  <p className="text-sm font-medium text-blue-600">
    Límite: {block.max_total_appointments} citas máximo
  </p>
)}
```

## Funcionalidad

### **Casos de Uso:**

1. **Sin límite** (por defecto):
   - Campo vacío → `max_total_appointments = null`
   - Funcionalidad normal sin restricciones

2. **Límite específico**:
   - Campo con número → `max_total_appointments = número`
   - Se aplica el límite total de citas

3. **Bloqueo completo**:
   - Campo con `0` → `max_total_appointments = 0`
   - No se permiten citas en ese día

### **Validaciones:**

- **Input tipo número**: Solo acepta valores numéricos positivos
- **Mínimo 0**: No permite valores negativos
- **Opcional**: Campo puede quedar vacío para no aplicar límite

### **Comportamiento por Valores:**

| Valor del Campo | `max_total_appointments` | Comportamiento |
|----------------|-------------------------|----------------|
| Vacío | `null` | Sin límite (normal) |
| `0` | `0` | Bloqueo completo (0 citas) |
| `5` | `5` | Máximo 5 citas permitidas |
| `10` | `10` | Máximo 10 citas permitidas |

### **Integración con Otros Bloqueos:**

El límite de citas **se combina** con otros tipos de bloqueos:

1. **Día completo + límite**: 
   - `full_day = false`, `max_total_appointments = 5`
   - Todos los horarios disponibles, pero máximo 5 citas

2. **Horario parcial + límite**:
   - `full_day = false`, `start_time/end_time` definidos, `max_total_appointments = 3`
   - Rango de horario bloqueado + máximo 3 citas en horarios disponibles

3. **Solo límite**:
   - `full_day = false`, sin horarios bloqueados, `max_total_appointments = 8`
   - Todos los horarios disponibles, pero máximo 8 citas

## Experiencia de Usuario

### **Creación de Bloqueo:**
1. Usuario selecciona fecha en calendario
2. Llena motivo del bloqueo
3. **Opcionalmente** especifica límite de citas
4. Configura tipo de bloqueo (completo/parcial)
5. Guarda configuración

### **Visualización:**
- **Lista de bloqueos**: Muestra límite en color azul si está configurado
- **Calendario**: Fechas con límites se visualizan como bloqueadas cuando se alcanza el máximo

### **Edición:**
- Todos los campos son editables
- Cambiar límite no afecta citas existentes
- Validaciones en tiempo real

## Ejemplos de Configuración

### **Ejemplo 1: Día con Personal Reducido**
```
Fecha: 2024-09-24
Motivo: "Personal reducido - solo técnico principal"
Día completo: No
Límite máximo de citas: 3
```
**Resultado**: Todos los horarios disponibles, pero máximo 3 citas

### **Ejemplo 2: Mantenimiento Parcial**
```
Fecha: 2024-10-15
Motivo: "Mantenimiento de equipos 10:00-14:00"
Día completo: No
Hora inicio: 10:00
Hora fin: 14:00
Límite máximo de citas: 5
```
**Resultado**: Horario 10:00-14:00 bloqueado, máximo 5 citas en el resto del día

### **Ejemplo 3: Día Especial**
```
Fecha: 2024-12-25
Motivo: "Día festivo - servicio limitado"
Día completo: No
Límite máximo de citas: 1
```
**Resultado**: Solo 1 cita permitida en todo el día
