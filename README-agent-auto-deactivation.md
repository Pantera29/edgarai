# Desactivación Automática del Agente de IA

## Descripción

Esta funcionalidad permite que el agente de IA se desactive automáticamente cuando un trabajador del concesionario envía un mensaje de WhatsApp desde la pantalla de conversaciones. Esto evita que el agente interfiera cuando un humano toma el control de la conversación.

## Funcionamiento

### Flujo de la funcionalidad

1. **Verificación previa**: Al cargar una conversación, se verifica el estado actual del agente de IA para ese número de teléfono y concesionario.

2. **Envío de WhatsApp**: Cuando se envía un mensaje WhatsApp desde la interfaz:
   - Se envía el mensaje WhatsApp
   - Si el envío es exitoso, se verifica el estado del agente
   - Si el agente está activo, se desactiva automáticamente
   - Se muestra feedback apropiado al usuario

3. **Indicador visual**: La interfaz muestra el estado actual del agente:
   - 🟢 **Agente activo**: Indicador verde
   - ⚫ **Agente desactivado**: Indicador gris
   - 🔄 **Verificando**: Indicador de carga

### Casos de uso

#### Caso A: Agente ya desactivado
- Se envía el WhatsApp normalmente
- No se hace llamada adicional al endpoint
- Mensaje: "Mensaje enviado correctamente"

#### Caso B: Agente activo
- Se envía el WhatsApp
- Se desactiva el agente automáticamente
- Mensaje: "Mensaje enviado y agente desactivado"

#### Caso C: Error en WhatsApp
- No se desactiva el agente (no tiene sentido)
- Se muestra error de envío

#### Caso D: WhatsApp exitoso pero error al desactivar agente
- Mensaje de éxito por WhatsApp
- Warning: "Mensaje enviado, pero el agente sigue activo"

## Implementación técnica

### Endpoints utilizados

- `GET /api/agent-control?phone_number=X&dealership_id=Y`: Verificar estado del agente
- `POST /api/agent-control`: Desactivar agente
- `POST /api/n8n/send`: Enviar mensaje WhatsApp

### Estados del componente

```typescript
const [agentStatus, setAgentStatus] = useState<{
  agent_active: boolean;
  loading: boolean;
}>({
  agent_active: true,
  loading: false
});
```

### Función principal

La función `enviarWhatsApp()` ahora incluye:

1. Envío del mensaje WhatsApp
2. Verificación del estado del agente
3. Desactivación automática si es necesario
4. Actualización del estado visual
5. Feedback apropiado al usuario

## Beneficios

- **Evita conflictos**: El agente no interfiere cuando un humano toma el control
- **Transparencia**: El usuario ve claramente el estado del agente
- **Automatización**: No requiere acción manual del usuario
- **Robustez**: Maneja errores graciosamente sin afectar el envío de mensajes

## Consideraciones

- Solo se desactiva el agente si el envío de WhatsApp es exitoso
- Se incluyen logs detallados para debugging
- El estado se actualiza en tiempo real en la interfaz
- Se mantiene compatibilidad con conversaciones sin cliente asociado
