# Documentación de Endpoints - EdgarAI

Esta documentación proporciona una vista completa de todos los endpoints disponibles en la API de EdgarAI, su funcionalidad, parámetros requeridos y dónde están siendo consumidos actualmente.

## Tabla de Contenidos

1. [Gestión de Citas (Appointments)](#gestión-de-citas-appointments)
2. [Gestión de Clientes (Customers)](#gestión-de-clientes-customers)
3. [Gestión de Vehículos (Vehicles)](#gestión-de-vehículos-vehicles)
4. [Servicios (Services)](#servicios-services)
5. [Comunicaciones (SMS y WhatsApp)](#comunicaciones-sms-y-whatsapp)
6. [Transacciones](#transacciones)
7. [Recordatorios (Reminders)](#recordatorios-reminders)
8. [NPS (Net Promoter Score)](#nps-net-promoter-score)
9. [Concesionarios (Dealerships)](#concesionarios-dealerships)
10. [Integración VAPI](#integración-vapi)

---

## Gestión de Citas (Appointments)

### 📅 GET `/api/appointments/availability`

**Función:** Obtiene los horarios disponibles para agendar citas en una fecha específica.

**Parámetros:**
- `date` (required): Fecha en formato YYYY-MM-DD
- `service_id` (required): UUID del servicio
- `dealership_id` (required): UUID del concesionario

**Funcionalidades:**
- Validación de fechas pasadas (solo para requests que no son del backoffice)
- Considera horarios de operación del concesionario
- Verifica fechas bloqueadas
- Calcula disponibilidad basada en citas existentes
- Considera límites diarios por servicio
- Maneja slots custom y horarios de recepción

**Consumido en:**
- Componentes de calendario para mostrar disponibilidad
- Proceso de agendado de citas
- Validación de reprogramación de citas

### 📝 POST `/api/appointments/create`

**Función:** Crea una nueva cita de servicio.

**Parámetros requeridos:**
- `client_id`: ID del cliente
- `vehicle_id`: UUID del vehículo
- `service_id`: UUID del servicio
- `appointment_date`: Fecha de la cita (YYYY-MM-DD)
- `appointment_time`: Hora de la cita (HH:MM:SS)

**Parámetros opcionales:**
- `notes`: Notas adicionales
- `channel`: Canal de origen ('whatsapp', 'twilio', 'manual', 'web', 'agenteai')
- `dealership_id`: UUID del concesionario (si no se proporciona, se infiere)
- `dealership_phone`: Teléfono del concesionario para inferir ID

**Funcionalidades:**
- Validación de existencia de cliente, vehículo y servicio
- Verificación de disponibilidad del horario
- Envío automático de SMS de confirmación (si está habilitado)
- Asociación automática con concesionario

**Consumido en:**
- `app/backoffice/citas/nueva/page.tsx` - Formulario de nueva cita
- Agentes de IA para agendado automático
- Proceso de confirmación de citas vía WhatsApp

### ✏️ PATCH `/api/appointments/update/[id]`

**Función:** Actualiza una cita existente.

**Parámetros permitidos:**
- `status`: Estado de la cita ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')
- `appointment_date`: Nueva fecha
- `appointment_time`: Nueva hora
- `notes`: Notas actualizadas
- `service_id`: Cambio de servicio

**Funcionalidades:**
- Validación de disponibilidad para reprogramaciones
- Verificación de límites diarios para cambios de servicio
- Creación automática de recordatorios y transacciones al completar
- Generación automática de registros NPS al completar

**Consumido en:**
- `app/backoffice/citas/page.tsx` - Gestión de citas
- `app/backoffice/citas/calendario/page.tsx` - Vista de calendario
- Proceso de actualización de estado de citas

---

## Gestión de Clientes (Customers)

### 👤 POST `/api/customers/create`

**Función:** Crea un nuevo cliente en el sistema.

**Parámetros requeridos:**
- `names`: Nombre completo del cliente
- `phone_number`: Número de teléfono (10 dígitos)

**Parámetros opcionales:**
- `email`: Correo electrónico (validado si se proporciona)
- `dealership_id`: UUID del concesionario
- `dealership_phone`: Teléfono del concesionario para inferir ID
- `external_id`: ID externo del cliente

**Funcionalidades:**
- Normalización automática del número de teléfono
- Validación de formato de email
- Verificación de duplicados por teléfono o email
- Asignación automática a concesionario

**Consumido en:**
- `app/backoffice/clientes/nuevo/page.tsx` - Formulario de nuevo cliente
- `app/backoffice/clientes/page.tsx` - Gestión rápida de clientes
- Agentes de IA para creación automática de clientes

### 🔍 GET `/api/customers/verify`

**Función:** Verifica si un cliente existe por número de teléfono.

**Parámetros:**
- `phone` (required): Número de teléfono a buscar
- `dealership_id` (optional): UUID del concesionario para filtrar

**Funcionalidades:**
- Normalización automática del teléfono
- Detección de clientes duplicados
- Filtrado por concesionario
- Información detallada del cliente encontrado

**Consumido en:**
- Procesos de validación antes de crear clientes
- Búsqueda rápida de clientes existentes
- Integración con agentes de IA

### ✏️ PATCH `/api/customers/update/[id]`

**Función:** Actualiza información de un cliente existente.

**Consumido en:**
- `app/backoffice/clientes/[id]/editar/page.tsx` - Formulario de edición

### 📋 GET `/api/customers/[id]/appointments`

**Función:** Obtiene todas las citas de un cliente específico.

### 🚗 GET `/api/customers/[id]/vehicles`

**Función:** Obtiene todos los vehículos de un cliente específico.

### 📅 GET `/api/customers/[id]/active-appointments`

**Función:** Obtiene las citas activas de un cliente específico.

---

## Gestión de Vehículos (Vehicles)

### 🚗 POST `/api/vehicles/create`

**Función:** Crea un nuevo vehículo en el sistema.

**Parámetros requeridos:**
- `client_id`: ID del cliente propietario
- `model`: Modelo del vehículo
- `year`: Año del vehículo

**Parámetros opcionales:**
- `make`: Marca del vehículo (se puede inferir del modelo)
- `license_plate`: Placa del vehículo
- `vin`: Número de identificación del vehículo
- `last_km`: Último kilometraje registrado

**Funcionalidades:**
- Inferencia automática de marca a partir del modelo
- Búsqueda inteligente en base de datos de modelos
- Validación de duplicados por placa y VIN
- Asociación automática con concesionario del cliente

**Consumido en:**
- `app/backoffice/vehiculos/nuevo/page.tsx` - Formulario de nuevo vehículo
- `app/backoffice/vehiculos/page.tsx` - Creación rápida
- Proceso de registro automático vía agentes de IA

### 🔍 GET `/api/vehicles/find-by-plate`

**Función:** Busca un vehículo por número de placa.

**Parámetros:**
- `plate`: Número de placa a buscar

### 📄 GET `/api/vehicles/[id]`

**Función:** Obtiene información detallada de un vehículo específico.

### ✏️ PATCH `/api/vehicles/update/[id]`

**Función:** Actualiza información de un vehículo.

**Consumido en:**
- `app/backoffice/vehiculos/[id]/page.tsx` - Actualización de vehículos

---

## Servicios (Services)

### 📋 GET `/api/services/list`

**Función:** Obtiene la lista de servicios disponibles para un concesionario.

**Parámetros:**
- `dealership_id` (required): UUID del concesionario
- `category` (optional): Categoría de servicios a filtrar

**Funcionalidades:**
- Filtrado por concesionario
- Filtrado opcional por categoría
- Solo servicios visibles al cliente
- Ordenamiento por nombre

**Consumido en:**
- Formularios de creación de citas
- Listados de servicios disponibles
- Procesos de selección de servicios

### 💰 GET `/api/services/price`

**Función:** Obtiene información de precios de servicios.

---

## Comunicaciones (SMS y WhatsApp)

### 📱 POST `/api/sms/send`

**Función:** Envía mensajes SMS a clientes.

**Parámetros requeridos:**
- `client_phone`: Número de teléfono del cliente
- `vehicle_make`: Marca del vehículo
- `vehicle_model`: Modelo del vehículo
- `service_name`: Nombre del servicio
- `appointment_date`: Fecha de la cita
- `appointment_time`: Hora de la cita

**Funcionalidades:**
- Formateo automático de números telefónicos para México
- Formateo de fechas en español
- Construcción automática de mensajes
- Integración con Twilio
- Control de habilitación/deshabilitación via variables de entorno

**Consumido en:**
- `app/backoffice/citas/nueva/page.tsx` - Envío manual de confirmaciones
- `lib/sms.ts` - Funciones utilitarias
- Proceso automático de confirmación de citas

### 💬 POST `/api/whatsapp/send`

**Función:** Envía mensajes de WhatsApp a clientes.

**Parámetros requeridos:**
- `reminder_id`: ID del recordatorio
- `template_type`: Tipo de plantilla de mensaje
- `dealership_id`: UUID del concesionario

**Funcionalidades:**
- Procesamiento de plantillas con variables dinámicas
- Formateo de números para WhatsApp
- Integración con Whapi Cloud
- Guardado automático en historial de chat
- Actualización de estado de recordatorios

**Consumido en:**
- `app/backoffice/recordatorios/page.tsx` - Envío de recordatorios
- Proceso automático de recordatorios programados

### 📊 POST `/api/whatsapp/analyze-conversations`

**Función:** Analiza conversaciones de WhatsApp para extraer insights.

---

## Transacciones

### 💳 POST `/api/transactions/create`

**Función:** Crea una transacción de servicio para una cita completada.

**Parámetros requeridos:**
- `appointment_id`: ID de la cita
- `dealership_id`: UUID del concesionario

**Parámetros opcionales:**
- `transaction_date`: Fecha de la transacción (por defecto: hoy)
- `notes`: Notas adicionales
- `specific_service_id`: ID de servicio específico

**Funcionalidades:**
- Validación de que la cita esté completada
- Verificación de no duplicación
- Validación de servicios específicos por modelo
- Creación automática al completar citas

**Consumido en:**
- Proceso automático al marcar citas como completadas
- Gestión manual de transacciones en backoffice

### ✏️ PATCH `/api/transactions/update/[id]`

**Función:** Actualiza una transacción existente.

---

## Recordatorios (Reminders)

### 🔔 POST `/api/reminders`

**Función:** Crea recordatorios de mantenimiento para clientes.

**Parámetros requeridos:**
- `client_id_uuid`: UUID del cliente
- `vehicle_id`: UUID del vehículo
- `service_id`: UUID del servicio
- `base_date`: Fecha base para el recordatorio
- `reminder_date`: Fecha del recordatorio

**Parámetros opcionales:**
- `notes`: Notas adicionales
- `dealership_id`: UUID del concesionario (se infiere del cliente si no se proporciona)

**Funcionalidades:**
- Conversión automática de fechas a UTC
- Validación de pertenencia cliente-concesionario
- Extracción automática de dealership_id del cliente
- Información completa del recordatorio creado

**Consumido en:**
- Proceso automático de creación de recordatorios
- Gestión manual de recordatorios en backoffice

---

## NPS (Net Promoter Score)

### ⭐ POST `/api/nps/create`

**Función:** Crea un registro NPS para una transacción.

**Parámetros requeridos:**
- `transaction_id`: ID de la transacción
- `customer_id`: ID del cliente

**Funcionalidades:**
- Validación de existencia de transacción y cliente
- Creación de registro NPS pendiente
- Integración con proceso de completado de citas

**Consumido en:**
- Proceso automático al completar citas (via `api/appointments/update`)
- Gestión de feedback de clientes

### ✏️ PATCH `/api/nps/update/[id]`

**Función:** Actualiza un registro NPS con la calificación del cliente.

---

## Concesionarios (Dealerships)

### 📊 GET `/api/dealerships/usage`

**Función:** Obtiene estadísticas de uso mensual de conversaciones por concesionario.

**Parámetros:**
- `dealership_id` (opcional): UUID del concesionario
- `dealership_phone` (opcional): Teléfono del concesionario
- `months` (opcional): Número de meses a consultar (default: 12)
- `start_date` (opcional): Fecha de inicio personalizada

**Funcionalidades:**
- Combinación de datos de llamadas y WhatsApp
- Conteo de usuarios únicos por mes
- Uso de función RPC optimizada
- Inferencia de dealership_id por teléfono

**Consumido en:**
- `components/usage-dashboard.tsx` - Dashboard principal de uso
- `components/usage-summary-card.tsx` - Resumen de uso
- Reportes de actividad del concesionario

### 🔍 GET `/api/dealerships/find-by-phone`

**Función:** Encuentra un concesionario por número de teléfono.

### ℹ️ GET `/api/dealerships/info`

**Función:** Obtiene información general de un concesionario.

---

## Integración VAPI

### 📞 POST `/api/vapi/end-of-call`

**Función:** Procesa reportes de finalización de llamadas desde VAPI.

**Funcionalidades:**
- Traducción automática de resúmenes de inglés a español
- Análisis de intención del cliente
- Determinación del éxito de la llamada
- Análisis completo del resultado de la conversación
- Extracción de información del agente y modelo de IA
- Guardado completo de metadatos de la llamada

**Parámetros procesados:**
- Información completa de la llamada
- Transcripción y resumen
- Metadatos del cliente y agente
- URLs de grabación

**Consumido en:**
- Webhooks automáticos de VAPI
- Análisis de conversaciones telefónicas
- Generación de insights de llamadas

---

## Patrones Comunes

### Autenticación
La mayoría de endpoints utilizan `createServerComponentClient` con cookies para autenticación, excepto algunos endpoints públicos como los webhooks de VAPI.

### Validación de Datos
- Validación de UUIDs para IDs de recursos
- Normalización automática de números de teléfono
- Validación de formatos de email
- Verificación de existencia de recursos relacionados

### Manejo de Errores
- Logging detallado de errores con contexto
- Mensajes de error informativos para el cliente
- Códigos de estado HTTP apropiados
- Fallbacks y manejo graceful de errores

### Inferencia Automática
- Inferencia de `dealership_id` por teléfono o cliente
- Inferencia de marca de vehículo por modelo
- Asociación automática de recursos relacionados

### Procesos Automáticos
- Envío automático de SMS al crear citas
- Creación automática de transacciones al completar citas
- Generación automática de registros NPS
- Creación automática de recordatorios

Esta documentación proporciona una vista completa del sistema de APIs de EdgarAI, facilitando el mantenimiento, desarrollo de nuevas funcionalidades y resolución de problemas.