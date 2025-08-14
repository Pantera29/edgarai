# GitHub Actions para Crons de Agentes AI

## 📋 Descripción

Se han creado dos GitHub Actions workflows separados para automatizar la activación y desactivación de agentes AI basándose en las citas de los clientes.

## 🗂️ Archivos Creados

- **`.github/workflows/reactivate-agents.yml`** - Workflow para reactivar agentes AI
- **`.github/workflows/deactivate-agents.yml`** - Workflow para desactivar agentes AI

## ⏰ Horarios de Ejecución

### Reactivar Agentes
- **Hora:** 7:55 AM (Ciudad de México)
- **Cron:** `55 13 * * *` (UTC-6)
- **Propósito:** Reactivar agentes para clientes que tuvieron citas ayer

### Desactivar Agentes
- **Hora:** 8:00 AM (Ciudad de México)
- **Cron:** `0 14 * * *` (UTC-6)
- **Propósito:** Desactivar agentes para clientes que tienen citas hoy

## 🏢 Dealership Configurado

**ID:** `b8ecf479-16ed-4f38-a726-cc1617a1fcbf`

## 🔧 Configuración

### Variables de Entorno

Los workflows usan las siguientes variables:

- **`DEALERSHIP_ID`**: ID del dealership (configurado por defecto)

### URL de la Aplicación

Los workflows usan la URL hardcodeada `https://edgarai.vercel.app`, siguiendo el mismo criterio que los otros crons del proyecto.

## 🚀 Uso Manual

### Ejecutar Reactivación Manualmente

1. Ve a la pestaña **Actions** en tu repositorio
2. Selecciona **"Reactivar Agentes AI"**
3. Haz clic en **"Run workflow"**
4. Opcionalmente, proporciona un `dealership_id` diferente
5. Haz clic en **"Run workflow"**

### Ejecutar Desactivación Manualmente

1. Ve a la pestaña **Actions** en tu repositorio
2. Selecciona **"Desactivar Agentes AI"**
3. Haz clic en **"Run workflow"**
4. Opcionalmente, proporciona un `dealership_id` diferente
5. Haz clic en **"Run workflow"**

## 📊 Monitoreo

### Logs Detallados

Cada workflow genera logs detallados que incluyen:

- **Información de ejecución:** Fecha, hora, zona horaria
- **Dealership procesado:** ID del dealership
- **Respuesta del endpoint:** Status code y body completo
- **Estadísticas:** Clientes procesados, exitosos, errores
- **Duración:** Tiempo de ejecución
- **Detalles:** Lista de clientes procesados

### Ejemplo de Logs

```
🚀 [CRON-REACTIVATE] Iniciando reactivación de agentes AI
🏢 Dealership ID: b8ecf479-16ed-4f38-a726-cc1617a1fcbf
📅 Fecha: Wed Aug 14 13:55:00 UTC 2024
⏰ Hora: 13:55:00
🌍 Zona horaria: UTC
🎯 Usando dealership_id: b8ecf479-16ed-4f38-a726-cc1617a1fcbf
📊 Status Code: 200
✅ Reactivación completada exitosamente
📈 Estadísticas:
   - Procesados: 11
   - Exitosos: 11
   - Errores: 0
   - Duración: 2150ms
👥 Clientes reactivados:
   ✅ uuid1 - b8ecf479-16ed-4f38-a726-cc1617a1fcbf
   ✅ uuid2 - b8ecf479-16ed-4f38-a726-cc1617a1fcbf
```

## 🔍 Troubleshooting

### Problemas Comunes

1. **Error 404**: Verifica que la `BASE_URL` sea correcta
2. **Error de autenticación**: Verifica que el endpoint no requiera autenticación
3. **Timeout**: Los workflows tienen un timeout de 5 minutos por defecto
4. **Zona horaria**: Los workflows usan UTC, pero los endpoints manejan la zona horaria de México

### Verificar Configuración

1. **Verificar cron**: Los crons usan UTC, no hora local
2. **Probar manualmente**: Ejecuta el workflow manualmente para verificar
3. **Verificar URL**: Los endpoints usan `https://edgarai.vercel.app`

## 📝 Personalización

### Cambiar Dealership

Para usar un dealership diferente:

1. **Modificar el archivo YAML:**
   ```yaml
   env:
     DEALERSHIP_ID: tu-nuevo-dealership-id
   ```

2. **O usar ejecución manual:**
   - Proporciona el `dealership_id` en el input del workflow

### Cambiar Horarios

Para modificar los horarios de ejecución:

```yaml
schedule:
  - cron: '55 13 * * *'  # Cambiar según necesidad
```

**Formato cron:** `minuto hora día mes día-semana`

### Agregar Notificaciones

Puedes agregar notificaciones adicionales (Slack, Discord, etc.) en los pasos de notificación:

```yaml
- name: Notificar a Slack
  if: success()
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"✅ Agentes AI reactivados exitosamente"}' \
      ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 🔒 Seguridad

- Los workflows no requieren autenticación para los endpoints
- Considera agregar autenticación si es necesario
- Los logs pueden contener información sensible (IDs de clientes)
- Revisa los logs antes de compartirlos

## 📞 Soporte

Si tienes problemas con los workflows:

1. Revisa los logs en la pestaña Actions
2. Verifica la configuración de secrets
3. Prueba ejecutar manualmente
4. Revisa que los endpoints funcionen correctamente

## 🎯 Próximos Pasos

1. **Probar manualmente** ambos workflows
2. **Verificar logs** de la primera ejecución automática
3. **Monitorear** ejecuciones diarias
4. **Configurar alertas** si es necesario
