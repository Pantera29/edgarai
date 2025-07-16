# WhatsApp Send Direct - Endpoint para Envío Directo

## 🎯 Objetivo
Crear un endpoint específico para envío directo de mensajes WhatsApp desde la sección de "Acción Humana", permitiendo a los agentes intervenir en conversaciones donde el cliente tiene `agent_active = false`.

## 📁 Archivos Creados/Modificados

### Nuevo Endpoint
- **`app/api/whatsapp/send-direct/route.ts`** - Endpoint para envío directo de mensajes WhatsApp

## 🚀 Implementación

### Endpoint: `/api/whatsapp/send-direct`

#### **Método:** POST

#### **Payload:**
```json
{
  "phone_number": "5512345678",
  "message": "Hola, necesitamos contactarte sobre tu cita...",
  "dealership_id": "uuid-del-dealership"
}
```

#### **Respuesta Exitosa:**
```json
{
  "success": true,
  "messageId": "msg_123456789",
  "status": "sent"
}
```

#### **Respuesta de Error:**
```json
{
  "success": false,
  "error": "Descripción del error"
}
```

### **Características del Endpoint**

#### ✅ **Funcionalidades Implementadas:**
- **Validación de datos:** Verifica que todos los campos requeridos estén presentes
- **Formateo de teléfono:** Convierte números mexicanos al formato 521XXXXXXXXXX
- **Obtención de token:** Busca el token de WhatsApp del taller principal
- **Envío a Whapi:** Utiliza la API de Whapi para enviar mensajes
- **Guardado en historial:** Registra el mensaje en `historial_chat` con `agente: true`
- **Logging detallado:** Usa emojis siguiendo el patrón del proyecto
- **Manejo de errores:** Respuestas descriptivas y logging de errores

#### ❌ **Funcionalidades NO Incluidas:**
- Templates de mensajes (no necesario para envío directo)
- Procesamiento de variables (mensaje directo del usuario)
- Lógica de recordatorios (endpoint específico para acción humana)

### **Flujo de Validación**

1. **Campos requeridos:** `phone_number`, `message`, `dealership_id`
2. **Mensaje no vacío:** Verifica que el mensaje tenga contenido
3. **Formato de teléfono:** Valida que sea un número mexicano válido
4. **Token de WhatsApp:** Verifica que esté configurado para el dealership

### **Integración con Base de Datos**

#### **Tablas Utilizadas:**
- `workshops` - Para obtener el taller principal
- `dealership_configuration` - Para obtener el token de WhatsApp
- `historial_chat` - Para guardar el mensaje enviado

#### **Campos Guardados en historial_chat:**
```sql
{
  chat_id: parseInt(phone_number_10_digits),
  message_id: whapi_message_id,
  message: mensaje_original,
  processed: true,
  status: 'active',
  agente: true,  -- Indica que fue enviado por agente humano
  dealership_id: dealership_id
}
```

## 🧪 Testing

### **Casos de Prueba:**

#### ✅ **Envío Exitoso:**
```bash
curl -X POST /api/whatsapp/send-direct \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "5512345678",
    "message": "Hola, necesitamos contactarte sobre tu cita",
    "dealership_id": "uuid-del-dealership"
  }'
```

#### ❌ **Casos de Error:**
- **Campos faltantes:** Retorna error 400
- **Mensaje vacío:** Retorna error 400
- **Teléfono inválido:** Retorna error 400
- **Token no configurado:** Retorna error 400
- **Error de Whapi:** Retorna error del proveedor

### **Datos de Prueba:**
- **Números válidos:** `5512345678`, `15512345678`, `5215512345678`
- **Dealership ID:** Usar un dealership con WhatsApp configurado
- **Mensajes:** Texto simple sin variables

## 📈 Impacto

### **Beneficios:**
- **Intervención directa:** Los agentes pueden contactar clientes inmediatamente
- **Sin dependencias:** No requiere templates ni recordatorios
- **Historial completo:** Mantiene registro de mensajes enviados
- **Validación robusta:** Previene errores de envío

### **Uso Previsto:**
- Sección "Acción Humana" en conversaciones
- Solo para conversaciones con `agent_active = false`
- Intervención manual de agentes en casos críticos

## 🔒 Seguridad

### **Validaciones Implementadas:**
- **Dealership ID:** Verifica que el token pertenezca al dealership correcto
- **Formato de teléfono:** Valida números mexicanos
- **Logging seguro:** No expone tokens completos en logs
- **Manejo de errores:** No expone información sensible

### **Consideraciones:**
- El endpoint requiere autenticación JWT (manejada por el frontend)
- Los tokens de WhatsApp se obtienen de la configuración del dealership
- Los mensajes se guardan con `agente: true` para diferenciarlos de mensajes automáticos

## 🚀 Próximos Pasos

1. **Integración en UI:** Agregar formulario en detalle de conversación
2. **Filtro por agent_active:** Mostrar solo en conversaciones que lo requieran
3. **Feedback visual:** Indicadores de envío exitoso/fallido
4. **Historial de mensajes:** Mostrar mensajes enviados por agentes

---

**Nota:** Este endpoint está diseñado específicamente para la funcionalidad de "Acción Humana" y no reemplaza el endpoint de recordatorios automáticos. 