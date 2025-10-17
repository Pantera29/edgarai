# Gestión de Templates de WhatsApp

## 🎯 Objetivo
Permitir a los gerentes de servicio crear, editar y gestionar templates de WhatsApp desde la plataforma, enviándolos a Kapso para aprobación y utilizándolos en comunicaciones con clientes.

## 📁 Archivos Creados

### Frontend
- **`app/backoffice/admin/templates-whatsapp/page.tsx`** - Página principal de gestión de templates
- **`app/backoffice/admin/templates-whatsapp/components/template-form-dialog.tsx`** - Componente de formulario para crear/editar templates

### Backend (API Routes)
- **`app/api/whatsapp/templates/route.ts`** - POST para crear templates
- **`app/api/whatsapp/templates/[id]/route.ts`** - PUT para editar templates
- **`app/api/whatsapp/templates/[id]/submit/route.ts`** - POST para enviar a aprobar

### Archivos Modificados
- **`components/sidebar.tsx`** - Agregada opción "Templates WhatsApp" en sección Administración

### Documentación
- **`README-whatsapp-templates-management.md`** - Este archivo

## 🚀 Implementación

### Funcionalidades Principales

#### 1. Vista Principal de Templates
**Ubicación**: `/backoffice/admin/templates-whatsapp`

**Características**:
- Lista de todos los templates del dealership
- Tabla con información clave:
  - Nombre del template
  - Categoría (Marketing, Utilidad, Autenticación)
  - Idioma
  - Estado (Draft, Submitted, Approved, Rejected, Disabled)
  - Fecha de creación
  - Acciones disponibles según estado

**Estados de Templates**:
- 🟤 **Draft** (Borrador): Recién creado, editable, puede enviarse a aprobar
- 🟡 **Submitted** (En Revisión): Enviado a WhatsApp, esperando aprobación
- 🟢 **Approved** (Aprobado): Listo para usar en mensajes
- 🔴 **Rejected** (Rechazado): No aprobado por WhatsApp
- ⏸️ **Disabled** (Deshabilitado): Desactivado manualmente

**Acciones por Estado**:
```typescript
Draft → Editar, Enviar a Aprobar, Eliminar
Submitted → Solo Ver (en espera)
Approved → Solo Ver (no editable)
Rejected → Ver, Duplicar (próximamente)
Disabled → Ver
```

#### 2. Formulario de Creación/Edición

**Características**:
- **Información Básica**:
  - Nombre (solo minúsculas, números y guiones bajos)
  - Idioma (es_MX, es_ES, en_US)
  - Categoría (UTILITY, MARKETING, AUTHENTICATION)
  - Formato de parámetros (NAMED vs POSITIONAL)

- **Componentes del Mensaje**:
  - **Header** (Opcional): Encabezado destacado
  - **Body** (Requerido): Cuerpo principal del mensaje
  - **Footer** (Opcional): Texto adicional en letra pequeña

- **Parámetros Dinámicos**:
  - **NAMED**: `{{nombre_cliente}}`, `{{fecha_cita}}`
  - **POSITIONAL**: `{{1}}`, `{{2}}`, `{{3}}`

- **Vista Previa en Tiempo Real**:
  - Simulador visual del mensaje en formato WhatsApp
  - Actualización automática al escribir

**Validaciones**:
- Nombre único por idioma
- Formato de nombre válido (regex: `^[a-z0-9_]+$`)
- Cuerpo del mensaje obligatorio
- Detección automática de parámetros

#### 3. Integración con Kapso

**Flujo de Creación y Envío**:
```
1. Usuario crea template → Guarda como "draft" en Supabase
2. Usuario envía a aprobar → Llama a API de Kapso
3. Kapso crea el template → Retorna kapso_template_id
4. Kapso envía a WhatsApp → Template en revisión
5. Estado actualizado a "submitted"
6. WhatsApp aprueba/rechaza → (Webhook futuro actualiza estado)
```

**Endpoints de Kapso Utilizados**:
- `POST /whatsapp_templates` - Crear template en Kapso
- `POST /whatsapp_templates/{id}/submit` - Enviar a WhatsApp para aprobación

**Autenticación**:
- Header: `X-API-Key: {kapso_api_key}`
- API Key obtenida de `dealerships.kapso_api_key`

## 📊 Estructura de Datos

### Tabla: `whatsapp_templates`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | ID único del template |
| `kapso_template_id` | varchar | ID del template en Kapso |
| `name` | varchar | Nombre del template (único por idioma) |
| `language_code` | varchar | Código de idioma (es_MX, en_US, etc.) |
| `category` | varchar | MARKETING, UTILITY, AUTHENTICATION |
| `status` | varchar | draft, submitted, approved, rejected, disabled |
| `body_text` | text | Cuerpo principal del mensaje |
| `header_text` | text | Encabezado (opcional) |
| `footer_text` | text | Pie de página (opcional) |
| `components` | jsonb | Estructura completa de componentes |
| `parameter_format` | varchar | NAMED o POSITIONAL |
| `parameter_count` | int | Cantidad de parámetros detectados |
| `dealership_id` | uuid | ID del dealership propietario |
| `whatsapp_config_id` | varchar | ID de configuración de WhatsApp en Kapso |
| `metadata` | jsonb | Metadata adicional (created_by, submitted_at, etc.) |
| `created_at` | timestamp | Fecha de creación |
| `updated_at` | timestamp | Fecha de última actualización |

### Configuración Requerida en `dealerships`

Para que funcione la integración con Kapso:
- `kapso_api_key` → API Key de Kapso (nivel agencia)
- `whatsapp_config_id` → ID de configuración de WhatsApp en Kapso
- `kapso_customer_id` → ID del customer en Kapso (opcional)

## 🔄 Flujo de Trabajo del Usuario

### Escenario 1: Crear Nuevo Template
```
1. Usuario accede a "Administración" → "Templates WhatsApp"
2. Click en "Crear Template"
3. Completa el formulario:
   - Nombre: recordatorio_mantenimiento
   - Idioma: Español (México)
   - Categoría: Utilidad
   - Cuerpo: "Hola {{nombre_cliente}}, tu cita de mantenimiento..."
4. Vista previa en tiempo real
5. Click en "Crear Template"
6. Template guardado como "Draft"
7. Puede editarlo o enviarlo a aprobar
```

### Escenario 2: Enviar a Aprobar
```
1. Usuario ve template en estado "Draft"
2. Click en icono de enviar (✉️)
3. Sistema llama a Kapso:
   - Crea el template en Kapso
   - Envía a WhatsApp para aprobación
4. Estado cambia a "Submitted"
5. Usuario espera aprobación de WhatsApp
6. Una vez aprobado → Puede usarlo en recordatorios
```

### Escenario 3: Editar Template Draft
```
1. Usuario ve template en estado "Draft"
2. Click en icono de editar (✏️)
3. Modifica el contenido
4. Guarda cambios
5. Puede enviarlo a aprobar cuando esté listo
```

## 🎨 UI/UX

### Badges de Estado
```typescript
Draft → Badge gris secundario con 📝
Submitted → Badge amarillo con 🔄
Approved → Badge verde con ✅
Rejected → Badge rojo con ❌
Disabled → Badge outline con ⏸️
```

### Acciones Contextuales
- **Ver** (Eye): Siempre disponible
- **Editar** (Edit): Solo en Draft
- **Enviar** (Send): Solo en Draft
- **Eliminar** (Trash): Solo en Draft

### Vista Previa WhatsApp
- Fondo degradado verde
- Simulador de mensaje WhatsApp
- Actualización en tiempo real
- Formato visual auténtico

## 🔐 Seguridad y Validaciones

### Autenticación
- Requiere JWT válido con `dealership_id`
- Verificación de permisos por dealership
- API Key de Kapso protegida (no se expone al frontend)

### Validaciones Backend
- Nombre único por idioma y dealership
- Formato de nombre válido (lowercase, números, guiones bajos)
- Solo templates en "draft" pueden editarse/eliminarse
- Verificación de existencia de `kapso_api_key` y `whatsapp_config_id`

### Validaciones Frontend
- Campos obligatorios marcados con *
- Contador de caracteres (límite 1024)
- Detector automático de variables
- Preview en tiempo real para validar formato

## 📝 Ejemplos de Templates

### Ejemplo 1: Recordatorio de Mantenimiento (NAMED)
```
Nombre: recordatorio_mantenimiento
Idioma: es_MX
Categoría: UTILITY
Formato: NAMED

Header: ¡Hola {{nombre_cliente}}! 👋

Body: 
Tu vehículo {{modelo_vehiculo}} requiere mantenimiento.
Te recordamos que tu última visita fue hace {{meses_desde_ultima_cita}} meses.

¿Quieres agendar una cita?

Footer: Taller Oficial - Estamos para servirte
```

### Ejemplo 2: Confirmación de Cita (POSITIONAL)
```
Nombre: confirmacion_cita
Idioma: es_MX
Categoría: UTILITY
Formato: POSITIONAL

Body:
Hola {{1}}, tu cita está confirmada para el {{2}} a las {{3}}.
Servicio: {{4}}

Por favor llega 15 minutos antes.
```

## 🚧 Limitaciones Actuales (MVP)

### No Incluido en MVP:
- ❌ Filtros y búsqueda avanzada
- ❌ Templates pre-configurados / galería
- ❌ Duplicar templates
- ❌ Botones interactivos (QUICK_REPLY, URL, PHONE)
- ❌ Headers con imágenes/videos
- ❌ Test de envío
- ❌ Analytics de uso
- ❌ Webhooks para actualizar estado desde Kapso
- ❌ Sincronización automática de templates aprobados

### Posibles Mejoras Futuras:
1. **Webhooks de Kapso**: Actualizar automáticamente el estado cuando WhatsApp aprueba/rechaza
2. **Sync de Templates**: Sincronizar templates ya aprobados desde Kapso
3. **Botones Interactivos**: Agregar soporte para botones en templates
4. **Media en Headers**: Permitir imágenes/videos en encabezados
5. **Biblioteca de Templates**: Templates pre-configurados para casos comunes
6. **Analytics**: Métricas de uso, tasa de entrega, tasa de apertura
7. **Test de Envío**: Enviar template de prueba a un número
8. **Duplicar Templates**: Crear variaciones rápidamente
9. **Historial de Versiones**: Ver cambios anteriores
10. **Búsqueda y Filtros**: Filtrar por categoría, idioma, estado

## 🔗 Integración con Otros Módulos

### Módulo de Recordatorios
Los templates aprobados pueden usarse en:
- Recordatorios de mantenimiento
- Confirmación de citas
- NPS post-servicio
- Notificaciones personalizadas

### Flujo de Integración:
```
1. Gerente crea template → Envía a aprobar → WhatsApp aprueba
2. Template disponible en lista de templates aprobados
3. Sistema de recordatorios puede seleccionar template
4. Al enviar recordatorio → Usa template + parámetros dinámicos
5. Mensaje enviado vía Kapso con template aprobado
```

## 📞 Troubleshooting

### Error: "API Key de Kapso no está configurada"
**Solución**: Configurar `kapso_api_key` en tabla `dealerships` para la agencia.

### Error: "WhatsApp Config ID no está configurado"
**Solución**: Configurar `whatsapp_config_id` en tabla `dealerships` para la agencia.

### Error: "Ya existe un template con ese nombre e idioma"
**Solución**: Cambiar el nombre del template o elegir otro idioma.

### Error: "Solo se pueden editar templates en estado borrador"
**Solución**: Los templates enviados a aprobar no pueden editarse. Crear uno nuevo o duplicar.

### Error: "Error al crear template en Kapso"
**Solución**: 
- Verificar que la API Key sea válida
- Verificar que el whatsapp_config_id exista en Kapso
- Revisar logs del servidor para más detalles

## 🎓 Capacitación de Usuario

### Para Gerentes de Servicio:
1. **Acceso**: Menú "Administración" → "Templates WhatsApp"
2. **Crear**: Click en "Crear Template" → Completar formulario
3. **Vista Previa**: Revisar cómo se verá el mensaje
4. **Enviar a Aprobar**: Click en icono de enviar cuando esté listo
5. **Esperar Aprobación**: WhatsApp revisará el template (24-48 hrs típicamente)
6. **Usar**: Una vez aprobado, estará disponible para recordatorios

### Tips para Buenos Templates:
- ✅ Usar nombres descriptivos: `recordatorio_mantenimiento_6_meses`
- ✅ Preferir parámetros NAMED sobre POSITIONAL (más legibles)
- ✅ Mantener mensajes concisos y claros
- ✅ Usar categoría UTILITY para mensajes transaccionales
- ✅ Evitar lenguaje promocional excesivo en UTILITY
- ✅ Revisar siempre la vista previa antes de enviar

### Requisitos de WhatsApp:
- Nombre único por idioma
- No spam ni contenido engañoso
- Categoría correcta según el uso
- Templates MARKETING requieren opt-in del usuario
- Templates UTILITY son para notificaciones transaccionales

## 📊 Métricas de Éxito

### KPIs a Monitorear:
- Cantidad de templates creados por dealership
- Tasa de aprobación de templates (aprobados / enviados)
- Tiempo promedio de aprobación
- Templates más utilizados
- Tasa de conversión por template

### Próximas Mejoras Basadas en Uso:
- Identificar templates más exitosos
- Crear biblioteca de "mejores prácticas"
- Optimizar flujo según feedback de usuarios
- Automatizar casos de uso comunes

## 🔄 Mantenimiento

### Logs Importantes:
- `🚀 [Templates]` - Inicio de operaciones
- `✅ [Templates]` - Operaciones exitosas
- `❌ [Templates]` - Errores a investigar
- `📤 [Templates Submit]` - Envíos a Kapso

### Monitoreo Recomendado:
- Templates en estado "submitted" por más de 72 hrs
- Errores recurrentes en integración con Kapso
- Templates rechazados (analizar motivo)
- Performance de endpoints de API

---

**Fecha de Implementación**: 2025-01-17
**Versión**: 1.0.0 (MVP)
**Estado**: ✅ Completado

