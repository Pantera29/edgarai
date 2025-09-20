# Sistema de Límite Total de Citas por Día

## Descripción

Se implementó un sistema de límites totales de citas por día para agencias específicas, permitiendo bloquear un máximo de citas totales (de cualquier tipo de servicio) para un día particular.

## Funcionalidad

### Validación de Límite Total Diario

- **Ubicación**: Tabla `blocked_dates` con nueva columna `max_total_appointments`
- **Aplicación**: Se ejecuta en ambos endpoints:
  - `/api/appointments/create` - Valida antes de crear la cita
  - `/api/appointments/availability` - Excluye fechas que han alcanzado el límite

### Lógica de Validación

1. **Buscar límite configurado**: Se consulta `blocked_dates` para la fecha, agencia y taller específicos
2. **Contar citas existentes**: Se cuentan TODAS las citas para:
   - La misma fecha (`appointment_date`)
   - La misma agencia (`dealership_id`)
   - El mismo taller (`workshop_id`)
   - Excluyendo citas canceladas (`status != 'cancelled'`)
3. **Validar límite**: Si `citas_existentes >= max_total_appointments`, se rechaza la creación
4. **Comportamiento por valores**:
   - `NULL` = Sin límite (funcionalidad normal)
   - `0` = Bloqueo completo (no se permiten citas)
   - `> 0` = Límite específico de citas permitidas

### Base de Datos

#### Nueva Columna en `blocked_dates`

```sql
ALTER TABLE blocked_dates 
ADD COLUMN max_total_appointments INTEGER NULL;

COMMENT ON COLUMN blocked_dates.max_total_appointments IS 
'Límite máximo de citas totales (de cualquier servicio) permitidas en este día para la agencia. NULL = sin límite de citas';
```

### Casos de Uso

#### **1. Límite de 5 citas para el 24 de septiembre**
```sql
INSERT INTO blocked_dates (
  dealership_id, 
  workshop_id,
  date, 
  reason, 
  full_day, 
  max_total_appointments
) VALUES (
  'tu-dealership-id', 
  'tu-workshop-id',
  '2024-09-24', 
  'Día especial - máximo 5 citas por disponibilidad de personal', 
  false,  -- No es bloqueo completo
  5       -- Máximo 5 citas totales
);
```

#### **2. Diferentes escenarios de configuración**

| Escenario | `full_day` | `max_total_appointments` | `start_time/end_time` | Resultado |
|-----------|------------|-------------------------|----------------------|-----------|
| Límite sin bloqueo | `false` | `5` | `NULL` | Máximo 5 citas, todos los horarios disponibles |
| Bloqueo completo | `true` | `NULL` | `NULL` | Día completamente bloqueado |
| Bloqueo parcial + límite | `false` | `3` | `09:00/12:00` | Horario 09:00-12:00 bloqueado, máximo 3 citas en el resto del día |
| Solo bloqueo de horario | `false` | `NULL` | `13:00/15:00` | Solo el rango 13:00-15:00 está bloqueado |

### Mensajes de Error

#### **Caso de límite total excedido en creación:**
```json
{
  "message": "No se pueden agendar más citas para el 2024-09-24. Se alcanzó el límite máximo de 5 citas para este día.",
  "error_type": "DAILY_TOTAL_LIMIT_EXCEEDED",
  "details": {
    "date": "2024-09-24",
    "currentAppointments": 5,
    "maxAllowed": 5,
    "reason": "Día especial - máximo 5 citas por disponibilidad de personal",
    "solution": "Por favor selecciona otra fecha disponible"
  }
}
```

**Código de estado**: `409 Conflict`

#### **Caso de límite total excedido en disponibilidad:**
- El endpoint `/api/appointments/availability` retornará `availableSlots: []` para fechas que han alcanzado el límite
- Automáticamente sugerirá fechas alternativas disponibles

### Logs de Auditoría

La implementación incluye logs detallados:

- **Validación iniciada**: `🔍 Verificando límite total de citas por día para la agencia`
- **Límite configurado**: `📊 Límite total configurado para este día`
- **Conteo de citas**: `📈 Conteo total de citas para límite diario`
- **Límite excedido**: `❌ Límite total diario excedido`
- **Validación exitosa**: `✅ Límite total diario válido`
- **Sin límite configurado**: `ℹ️ No hay límite total configurado para este día`

### Compatibilidad

- **Compatible con límites por servicio**: El sistema coexiste con los límites `daily_limit` por servicio individual
- **Compatible con bloqueos existentes**: Funciona junto con bloqueos completos (`full_day=true`) y bloqueos por horario
- **Granular por taller**: Cada taller puede tener límites independientes
- **Flexible**: Permite diferentes configuraciones según las necesidades

### Ejemplos de Consultas

#### **Ver límites configurados**
```sql
SELECT 
  bd.date,
  bd.reason,
  bd.max_total_appointments,
  bd.full_day,
  d.name as dealership_name,
  w.name as workshop_name
FROM blocked_dates bd
JOIN dealerships d ON bd.dealership_id = d.id
JOIN workshops w ON bd.workshop_id = w.id
WHERE bd.max_total_appointments IS NOT NULL
ORDER BY bd.date;
```

#### **Verificar citas del día vs límite**
```sql
SELECT 
  bd.date,
  bd.max_total_appointments,
  COUNT(a.id) as current_appointments,
  (bd.max_total_appointments - COUNT(a.id)) as remaining_slots
FROM blocked_dates bd
LEFT JOIN appointment a ON (
  a.appointment_date = bd.date 
  AND a.dealership_id = bd.dealership_id 
  AND a.workshop_id = bd.workshop_id
  AND a.status != 'cancelled'
)
WHERE bd.max_total_appointments IS NOT NULL
  AND bd.date >= CURRENT_DATE
GROUP BY bd.date, bd.max_total_appointments, bd.reason
ORDER BY bd.date;
```

## Beneficios

1. **Control granular**: Por agencia, taller y fecha específica
2. **Flexibilidad**: Combina diferentes tipos de bloqueos y límites
3. **Transparencia**: Logs detallados para auditoría
4. **Compatibilidad**: No afecta funcionalidad existente
5. **Escalabilidad**: Fácil de extender para futuras necesidades
