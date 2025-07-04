# Endpoint N8N para Envío de Recordatorios

## 🎯 Objetivo
Crear un nuevo endpoint `/api/n8n/send` que tenga exactamente la misma interfaz que `/api/whatsapp/send` pero que envíe mensajes a través de N8N en lugar de Whapi. Esto permite cambiar fácilmente entre proveedores de WhatsApp sin modificar el código cliente.

## 📁 Archivos Creados/Modificados

### Archivos Creados
- `app/api/n8n/send/route.ts` - Nuevo endpoint N8N con interfaz idéntica a WhatsApp

### Archivos Modificados
- `app/api/reminders/process/route.ts` - Cambio de una línea para usar N8N en lugar de WhatsApp

## 🚀 Implementación

### Interfaz del Endpoint
```typescript
// POST /api/n8n/send
{
  reminder_id: string,
  template_type: string, 
  dealership_id: string
}

// Respuesta exitosa
{
  success: true,
  messageId: string,
  status: "sent"
}

// Respuesta de error
{
  success: false,
  error: string,
  details?: any
}
```

### Diferencias Clave con WhatsApp
1. **Endpoint N8N**: `https://n8n.edgarai.com.mx/webhook/outbound`
2. **Payload N8N**: `{ message, whapi_id, to }`
3. **Autenticación**: No requiere token, usa `whapi_id` del mapping
4. **Formato de teléfono**: Mantiene formato `521XXXXXXXXXX`

### Flujo de Procesamiento
1. ✅ Validar datos de entrada (`reminder_id`, `template_type`, `dealership_id`)
2. ✅ Obtener recordatorio completo con datos del cliente, vehículo y servicio
3. ✅ Validar que pertenece al dealership correcto
4. ✅ Obtener template de mensaje activo
5. ✅ Obtener `whapi_id` de `dealership_mapping`
6. ✅ Procesar variables del template con datos reales
7. ✅ Formatear número de teléfono al formato N8N
8. ✅ Enviar mensaje a N8N webhook
9. ✅ Guardar en `historial_chat`
10. ✅ Actualizar estado del recordatorio a "sent"

## 🧪 Testing

### Prueba del Endpoint Directo
```bash
curl -X POST http://localhost:3000/api/n8n/send \
  -H "Content-Type: application/json" \
  -d '{
    "reminder_id": "test-reminder-id",
    "template_type": "confirmation",
    "dealership_id": "test-dealership-id"
  }'
```

### Prueba del Procesamiento Automático
```bash
curl -X POST http://localhost:3000/api/reminders/process
```

### Validaciones Incluidas
- ✅ Campos requeridos presentes
- ✅ Recordatorio existe y pertenece al dealership
- ✅ Template activo disponible
- ✅ Mapping de WhatsApp configurado
- ✅ Número de teléfono válido (formato 521XXXXXXXXXX)
- ✅ Respuesta exitosa de N8N

## 📈 Impacto

### Beneficios
- ✅ **Cambio mínimo**: Solo una línea modificada en reminders/process
- ✅ **Misma interfaz**: Compatible con código existente
- ✅ **Separación limpia**: Lógica N8N aislada del resto del sistema
- ✅ **Fácil alternar**: Cambiar entre proveedores sin modificar clientes
- ✅ **Testing independiente**: Probar cada endpoint por separado
- ✅ **Logging detallado**: Trazabilidad completa con prefijo `[N8N Send]`

### Compatibilidad
- ✅ **Interfaz idéntica**: Mismos parámetros y respuestas que WhatsApp
- ✅ **Manejo de errores**: Mismos códigos de error y formatos
- ✅ **Historial de chat**: Guarda mensajes en la misma tabla
- ✅ **Estados de recordatorio**: Actualiza a "sent" igual que WhatsApp

### Configuración Requerida
- ✅ Tabla `dealership_mapping` con `whapi_id` configurado
- ✅ Templates activos en `whatsapp_message_templates`
- ✅ N8N webhook disponible en `https://n8n.edgarai.com.mx/webhook/outbound`

## 🔄 Rollback

Para volver a usar WhatsApp, cambiar en `app/api/reminders/process/route.ts`:
```typescript
// Cambiar de:
const response = await fetch(`${new URL(request.url).origin}/api/n8n/send`, {

// A:
const response = await fetch(`${new URL(request.url).origin}/api/whatsapp/send`, {
```

## 📊 Métricas

### Logs Incluidos
- 🚀 Inicio del proceso
- 📋 Datos recibidos
- 🔍 Obtención de recordatorio
- 📝 Obtención de template
- 🔑 Obtención de whapi_id
- 🔄 Procesamiento de template
- 📞 Formateo de teléfono
- 📤 Envío a N8N
- ✅ Respuesta de N8N
- 📝 Guardado en historial
- 📝 Actualización de estado

### Manejo de Errores
- ❌ Campos faltantes (400)
- ❌ Recordatorio no encontrado (404)
- ❌ Sin acceso al recordatorio (403)
- ❌ Template no encontrado (404)
- ❌ Mapping no configurado (400)
- ❌ Teléfono inválido (400)
- ❌ Error de N8N (status del response)
- 💥 Error inesperado (500) 