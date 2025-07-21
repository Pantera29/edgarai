# Guardado de specific_service_id en appointments

## 🎯 Objetivo
Permitir que el endpoint de creación de citas (`/api/appointments/create/route.ts`) guarde el campo opcional `specific_service_id` en la tabla `appointment` para trazabilidad completa de servicios específicos.

## 📁 Archivos Creados/Modificados
- `app/api/appointments/create/route.ts`: Se agregó el campo `specific_service_id` al objeto insertado en la creación de la cita.
- `README-appointments-specific-service-id.md`: Documentación de este cambio.

## 🚀 Implementación
- Si se recibe el parámetro `specific_service_id` en la creación de la cita, se guarda en la tabla `appointment`.
- Si no se recibe, se guarda como `null` para compatibilidad hacia atrás.
- No se modificó ninguna otra lógica ni campo.

## 🧪 Testing
- Crear una cita enviando ambos campos: `service_id` y `specific_service_id`. Verificar que ambos se guarden correctamente.
- Crear una cita solo con `service_id`. Verificar que `specific_service_id` quede en `null`.
- Crear una cita solo con `specific_service_id` (sin `service_id`). El endpoint resuelve el `service_id` y guarda ambos.
- Verificar que el resto de la lógica y validaciones no se vean afectadas.

## 📈 Impacto
- Permite trazabilidad completa de servicios específicos en las citas.
- Mantiene compatibilidad con integraciones y flujos existentes.
- No afecta la creación de citas previas ni la lógica de negocio principal. 