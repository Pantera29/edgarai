# Integración NPS con WhatsApp

## 🎯 Objetivo
Implementar un endpoint API que permita actualizar encuestas NPS pendientes usando el número de teléfono del cliente, específicamente diseñado para integración con sistemas de WhatsApp.

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
- `app/api/nps/update-by-phone/route.ts` - Endpoint principal para actualización NPS por teléfono
- `docs/api-nps-update-by-phone.md` - Documentación técnica detallada del endpoint
- `README-nps-whatsapp-integration.md` - Este archivo de documentación

## 🚀 Implementación

### Endpoint Principal
```typescript
PATCH /api/nps/update-by-phone
```

### Funcionalidades Implementadas

#### 1. Validación Robusta de Números de Teléfono
- Normalización automática de números (quita caracteres no numéricos)
- Búsqueda con múltiples variaciones:
  - Número original
  - Número normalizado
  - Con prefijo +52
  - Sin prefijo +52

#### 2. Búsqueda Inteligente de Clientes
- Manejo de diferentes formatos de números mexicanos
- Logs detallados para debugging
- Respuestas informativas en caso de no encontrar cliente

#### 3. Gestión de NPS Pendientes
- Búsqueda del NPS más reciente con status 'pending'
- Ordenamiento por fecha de creación (más reciente primero)
- Validación de existencia antes de actualizar

#### 4. Clasificación Automática
- Score >= 9: 'promoter'
- Score >= 7: 'neutral'
- Score < 7: 'detractor'

### Estructura de Respuesta
```json
{
  "message": "Encuesta NPS completada exitosamente",
  "nps": {
    "id": "uuid",
    "score": 9,
    "classification": "promoter",
    "status": "completed",
    "comments": "Excelente servicio",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T14:45:00Z"
  },
  "client": {
    "id": "uuid",
    "names": "Juan Pérez",
    "phone_number": "+525512345678",
    "dealership_id": "uuid"
  }
}
```

## 🧪 Testing

### Casos de Prueba Recomendados

#### 1. Números de Teléfono Válidos
```bash
# Diferentes formatos del mismo número
curl -X PATCH http://localhost:3000/api/nps/update-by-phone \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+525512345678", "score": 9}'

curl -X PATCH http://localhost:3000/api/nps/update-by-phone \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "5512345678", "score": 9}'

curl -X PATCH http://localhost:3000/api/nps/update-by-phone \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "55-12-34-56-78", "score": 9}'
```

#### 2. Validación de Score
```bash
# Score válido
curl -X PATCH http://localhost:3000/api/nps/update-by-phone \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+525512345678", "score": 10}'

# Score inválido
curl -X PATCH http://localhost:3000/api/nps/update-by-phone \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+525512345678", "score": 11}'
```

#### 3. Casos de Error
```bash
# Cliente no encontrado
curl -X PATCH http://localhost:3000/api/nps/update-by-phone \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+529999999999", "score": 9}'

# NPS pendiente no encontrado
curl -X PATCH http://localhost:3000/api/nps/update-by-phone \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+525512345678", "score": 9}'
```

### Datos de Prueba Requeridos
1. **Cliente existente** con número de teléfono válido
2. **NPS pendiente** asociado al cliente
3. **Transacción** relacionada con el NPS

## 📈 Impacto

### Beneficios Inmediatos
- **Automatización completa** del proceso de encuestas NPS
- **Integración directa** con sistemas de WhatsApp
- **Reducción de trabajo manual** en seguimiento de encuestas
- **Respuestas más rápidas** de los clientes

### Métricas Esperadas
- **Aumento en tasa de respuesta** de encuestas NPS
- **Reducción en tiempo** de procesamiento de encuestas
- **Mejora en precisión** de datos NPS
- **Mayor satisfacción** del cliente por facilidad de respuesta

### Casos de Uso Principales
1. **Encuestas automáticas** post-servicio
2. **Seguimiento de satisfacción** del cliente
3. **Análisis de tendencias** NPS por taller
4. **Identificación de promotores** y detractores

## 🔧 Configuración para WhatsApp

### Integración con Sistemas de WhatsApp
El endpoint está diseñado para ser llamado desde:
- **Webhooks de WhatsApp Business API**
- **Sistemas de automatización** de mensajes
- **Bots de WhatsApp** personalizados

### Flujo de Integración Típico
1. Cliente completa servicio en el taller
2. Sistema crea NPS pendiente automáticamente
3. WhatsApp envía encuesta al cliente
4. Cliente responde con número del 0-10
5. Sistema de WhatsApp llama al endpoint
6. NPS se actualiza y marca como completado

### Parámetros de Configuración
```json
{
  "webhook_url": "https://tu-dominio.com/api/nps/update-by-phone",
  "method": "PATCH",
  "headers": {
    "Content-Type": "application/json"
  },
  "body_template": {
    "phone_number": "{{customer_phone}}",
    "score": "{{nps_score}}",
    "comments": "{{optional_comments}}"
  }
}
```

## 🚨 Consideraciones Importantes

### Seguridad
- **Validación robusta** de entrada para prevenir inyecciones
- **Logs detallados** para auditoría y debugging
- **Manejo de errores** sin exponer información sensible

### Performance
- **Búsqueda optimizada** con múltiples variaciones de número
- **Límite de resultados** en consultas de NPS
- **Índices recomendados** en campos phone_number y customer_id

### Mantenimiento
- **Monitoreo de logs** para identificar patrones de error
- **Métricas de uso** para optimización continua
- **Documentación actualizada** para cambios futuros

## 📞 Soporte

### Logs de Debugging
El endpoint incluye logs detallados con emojis:
- 📱 Inicio de proceso
- 🔍 Búsqueda de cliente
- ✅ Cliente encontrado
- 📊 NPS encontrado
- 💾 Actualización exitosa
- ❌ Errores específicos

### Troubleshooting Común
1. **Cliente no encontrado**: Verificar formato del número de teléfono
2. **NPS no encontrado**: Confirmar que existe NPS pendiente para el cliente
3. **Error de validación**: Verificar que score esté entre 0-10
4. **Error de base de datos**: Revisar logs para detalles específicos

## 🔄 Próximos Pasos

### Mejoras Futuras
1. **Autenticación adicional** para mayor seguridad
2. **Rate limiting** para prevenir abuso
3. **Métricas avanzadas** de uso y performance
4. **Integración con más canales** (SMS, email)

### Monitoreo Continuo
- Revisar logs regularmente
- Analizar tasas de éxito/error
- Optimizar búsquedas según patrones de uso
- Actualizar documentación según feedback 