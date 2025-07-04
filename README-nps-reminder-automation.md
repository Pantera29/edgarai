# Automatización de Recordatorio NPS al Completar Cita

## 🎯 Objetivo
Crear automáticamente un recordatorio de tipo `nps` en la tabla `reminders` cuando una cita se marca como "completada", programado para el día siguiente a la fecha de la cita. Esto permite que el proceso automático de recordatorios envíe la encuesta de satisfacción NPS al cliente sin intervención manual.

## 📁 Archivos Creados/Modificados
- `app/api/appointments/update/[id]/route.ts`: Se agregó la lógica para crear el recordatorio NPS automáticamente.
- `README-nps-reminder-automation.md`: Este archivo de documentación.

## 🚀 Implementación
- Al marcar una cita como `completed`, se crea un registro en la tabla `reminders` con:
  - `client_id_uuid`, `vehicle_id`, `service_id`, `base_date` (fecha de la cita), `reminder_date` (día siguiente), `notes`, `status: 'pending'`, `reminder_type: 'nps'`, `dealership_id`.
- El template de mensaje utilizado es el que esté configurado y activo para el tipo `nps` en la base de datos.
- El proceso `/api/reminders/process` detecta y envía el recordatorio automáticamente en la fecha indicada.

## 🧪 Testing
1. Completar una cita desde el backoffice.
2. Verificar en la tabla `reminders` que se haya creado un recordatorio de tipo `nps` con la fecha correcta.
3. Confirmar que el proceso automático de recordatorios lo envía el día correspondiente.

## 📈 Impacto
- Automatización total del envío de encuestas NPS.
- Mejora en la tasa de respuesta y satisfacción del cliente.
- Reducción de tareas manuales para el equipo de postventa. 