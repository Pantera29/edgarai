# Control de Recordatorios de Confirmación por Servicio

## 📋 Resumen

Cada servicio puede ahora configurar individualmente si genera recordatorios de confirmación automáticos al agendar citas. Esto permite desactivar recordatorios para servicios rápidos, revisiones cortas o consultas que no requieren confirmación previa.

## 🎯 Objetivo

Permitir que las agencias configuren qué servicios generan recordatorios de confirmación, evitando enviar notificaciones innecesarias para servicios que no lo requieren.

## 🗄️ Cambios en Base de Datos

### Nueva Columna en `services`

```sql
ALTER TABLE services 
ADD COLUMN requires_confirmation_reminder BOOLEAN DEFAULT true;
```

- **Campo:** `requires_confirmation_reminder`
- **Tipo:** `BOOLEAN`
- **Default:** `true` (mantiene comportamiento existente)
- **Descripción:** Indica si este tipo de servicio debe generar recordatorios de confirmación automáticos al agendar citas

## 🎨 Interfaz de Usuario

### Ubicación
**Ruta:** `/backoffice/servicios`

### Formulario de Creación/Edición
Se añadió un nuevo Switch después de "Visible para clientes":

**Label:** "Crear recordatorio de confirmación"

**Descripción:** Si está activado, se enviará un recordatorio automático al cliente antes de la cita agendada.

**Default:** ✅ Activado (checked)

## 🔧 Lógica de Funcionamiento

### Flujo de Creación de Recordatorio

```
Al crear cita:
├─> Verificar si cita es futura (fecha > hoy)
│   └─> Llamar a createConfirmationReminder()
│       ├─> 1. Consultar configuración del servicio
│       │   └─> SELECT requires_confirmation_reminder FROM services
│       │
│       ├─> 2. Si requires_confirmation_reminder = false
│       │   └─> ❌ Salir sin crear recordatorio
│       │       Log: "🚫 Servicio 'X' no requiere recordatorio de confirmación"
│       │
│       └─> 3. Si requires_confirmation_reminder = true
│           ├─> Consultar dealership_reminder_settings
│           │   └─> Verificar confirmation_enabled
│           │
│           └─> Si todo está habilitado:
│               └─> ✅ Crear recordatorio en tabla reminders
```

### Capas de Control

Existen **2 capas** de control para recordatorios de confirmación:

| Nivel | Configuración | Scope | Ubicación |
|-------|--------------|-------|-----------|
| **1. Por Servicio** | `requires_confirmation_reminder` | Específico del servicio | `/backoffice/servicios` |
| **2. Por Agencia** | `confirmation_enabled` | Global de la agencia | `/backoffice/admin/recordatorios-automaticos` |

**Comportamiento:**
- ✅ Ambos deben estar en `true` para crear recordatorio
- ❌ Si alguno está en `false`, NO se crea recordatorio

## 📝 Casos de Uso

### Servicios que DEBERÍAN tener recordatorio activado
- ✅ Servicios programados (10K, 20K, 30K km, etc.)
- ✅ Mantenimientos completos
- ✅ Reparaciones con cita agendada
- ✅ Diagnósticos que requieren retener el vehículo

### Servicios que PODRÍAN desactivar recordatorio
- ❌ Revisiones express (< 30 min)
- ❌ Consultas sin compromiso
- ❌ Diagnósticos preliminares
- ❌ Servicios de cortesía

## 🔍 Logs y Debugging

### Log cuando se omite por configuración del servicio
```
🔍 [Confirmation Reminder] Verificando configuración del servicio: abc-123-def
🔍 [Confirmation Reminder] Configuración del servicio obtenida: { service_name: 'Revisión', requires_confirmation_reminder: false }
🚫 [Confirmation Reminder] Servicio "Revisión" no requiere recordatorio de confirmación
```

### Log cuando se crea exitosamente
```
🔍 [Confirmation Reminder] Configuración del servicio obtenida: { service_name: 'Servicio 20,000 km', requires_confirmation_reminder: true }
⚙️ [Confirmation Reminder] Obteniendo configuración para agencia: xyz-456-abc
✅ [Confirmation Reminder] Recordatorio de confirmación creado: reminder-id-789
```

## 📂 Archivos Modificados

| Archivo | Cambios Realizados |
|---------|-------------------|
| `services` (tabla) | Añadida columna `requires_confirmation_reminder` |
| `app/backoffice/servicios/page.tsx` | Añadido Switch en formularios de crear/editar |
| `lib/confirmation-reminder-creator.ts` | Añadida verificación del campo antes de crear |

## 🧪 Testing

### Caso 1: Crear servicio CON recordatorio
1. Ir a `/backoffice/servicios`
2. Crear servicio nuevo
3. ✅ Dejar Switch "Crear recordatorio de confirmación" activado
4. Guardar
5. Crear cita futura con ese servicio
6. **Resultado esperado:** Se crea recordatorio en tabla `reminders`

### Caso 2: Crear servicio SIN recordatorio
1. Ir a `/backoffice/servicios`
2. Crear servicio nuevo
3. ❌ Desactivar Switch "Crear recordatorio de confirmación"
4. Guardar
5. Crear cita futura con ese servicio
6. **Resultado esperado:** NO se crea recordatorio, log muestra mensaje de omisión

### Caso 3: Editar servicio existente
1. Ir a `/backoffice/servicios`
2. Editar un servicio
3. Cambiar estado del Switch
4. Guardar
5. Crear nueva cita
6. **Resultado esperado:** Comportamiento según configuración actualizada

## 🔄 Servicios Existentes

**Comportamiento automático:**
- Todos los servicios existentes tienen `requires_confirmation_reminder = true` por defecto
- Mantienen el comportamiento actual (generan recordatorios)
- Pueden ser modificados individualmente desde el backoffice

## 🚀 Despliegue

### Orden de Implementación
1. ✅ Ejecutar migración SQL (añadir columna)
2. ✅ Actualizar código frontend (formularios)
3. ✅ Actualizar código backend (lógica de recordatorios)
4. ✅ Testing en ambiente de desarrollo
5. ⏳ Desplegar a producción
6. ⏳ Configurar servicios que no requieren recordatorio

## 📞 Soporte

Para cambiar la configuración de un servicio:
1. Acceder a `/backoffice/servicios`
2. Buscar el servicio
3. Hacer clic en "Editar"
4. Activar/Desactivar Switch "Crear recordatorio de confirmación"
5. Guardar cambios

---

**Fecha de implementación:** Octubre 2025  
**Versión:** 1.0

