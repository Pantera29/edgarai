# Actualización: Cambio de Valor Por Defecto para Recordatorios de Follow Up

## 🎯 Objetivo
Cambiar el valor por defecto de meses para recordatorios de follow up automáticos de **5 meses** a **6 meses**.

## 📅 Cambio Realizado

### Archivo Modificado
- `lib/simple-reminder-creator.ts`

### Línea Cambiada
```typescript
// ANTES
const monthsAfter = rule?.months_after ?? 5;

// DESPUÉS  
const monthsAfter = rule?.months_after ?? 6;
```

## 🔄 Impacto del Cambio

### Comportamiento Anterior
- Si una agencia no tenía configuración específica en `automatic_reminder_rules`
- Los recordatorios de follow up se programaban para **5 meses** después de completar la cita

### Comportamiento Actual
- Si una agencia no tiene configuración específica en `automatic_reminder_rules`
- Los recordatorios de follow up se programarán para **6 meses** después de completar la cita

### Ejemplo Práctico
**Cita completada:** 15 de enero de 2024
- **Antes:** Recordatorio programado para 15 de junio de 2024 (5 meses)
- **Ahora:** Recordatorio programado para 15 de julio de 2024 (6 meses)

## ⚙️ Configuración por Agencia

### Reglas Específicas
Las agencias que ya tienen configuración en `automatic_reminder_rules` **NO se ven afectadas**:
- Agencia con `months_after = 5` → Sigue usando 5 meses
- Agencia con `months_after = 3` → Sigue usando 3 meses
- Agencia con `months_after = 12` → Sigue usando 12 meses

### Reglas por Defecto
Solo las agencias **sin configuración específica** usarán el nuevo valor por defecto de 6 meses.

## 📊 Estado Actual del Sistema

### Configuraciones Existentes
```sql
SELECT dealership_id, months_after FROM automatic_reminder_rules WHERE is_active = true;
```
- Todas las agencias activas actualmente tienen `months_after = 5`
- El cambio solo afectará a **nuevas agencias** que no configuren reglas específicas

### Tabla de Configuración
```sql
-- Para configurar reglas específicas por agencia
INSERT INTO automatic_reminder_rules (dealership_id, months_after, is_active)
VALUES ('uuid-de-agencia', 6, true);

-- Para usar el valor por defecto (6 meses)
-- No insertar nada en automatic_reminder_rules para esa agencia
```

## 🧪 Testing

### Casos de Prueba
1. **Agencia nueva sin configuración:**
   - Completar una cita
   - Verificar que el recordatorio se programa para 6 meses después

2. **Agencia con configuración existente:**
   - Verificar que mantiene su configuración actual (5 meses)
   - No debe verse afectada por el cambio

3. **Crear nueva regla:**
   - Insertar regla con `months_after = 8`
   - Verificar que usa 8 meses en lugar del valor por defecto

## 📈 Beneficios

### Mejor Timing
- **6 meses** es un intervalo más natural para servicios de mantenimiento
- Alinea mejor con ciclos de servicio típicos de vehículos
- Reduce la frecuencia de contactos, mejorando la experiencia del cliente

### Flexibilidad
- Las agencias pueden seguir configurando intervalos personalizados
- El valor por defecto es más apropiado para la mayoría de casos de uso
- No afecta configuraciones existentes

## 🔄 Reversión

Si fuera necesario revertir el cambio:
```typescript
// En lib/simple-reminder-creator.ts
const monthsAfter = rule?.months_after ?? 5; // Volver a 5 meses
```

## 📝 Documentación Actualizada
- `README-reminder-settings-control.md` - Actualizada para reflejar el nuevo valor por defecto
- `README-follow-up-default-months-update.md` - Este archivo de documentación del cambio
