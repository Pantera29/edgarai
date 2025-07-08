# EdgarAI - Automatización de Reminders Process con GitHub Actions

## 🎯 Objetivo
Automatizar la ejecución del endpoint `/api/reminders/process` cada 30 minutos usando GitHub Actions, reemplazando el cron job de Vercel para mayor confiabilidad y control.

---

## 📁 Archivos Creados/Modificados
- `.github/workflows/cron-reminders-process.yml`: Workflow de GitHub Actions para llamar al endpoint productivo cada 30 minutos.
- (Recomendado) `vercel.json`: Comentar o eliminar los crons de Vercel para evitar duplicidad.

---

## 🚀 Implementación

### 1. **Workflow de GitHub Actions**
Archivo: `.github/workflows/cron-reminders-process.yml`

```yaml
name: EdgarAI Reminders Process Cron

on:
  schedule:
    # Ejecuta cada 30 minutos (en los minutos 0 y 30 de cada hora UTC)
    - cron: '0,30 * * * *'
  workflow_dispatch:

jobs:
  call-reminders-process-endpoint:
    runs-on: ubuntu-latest
    steps:
      - name: Call reminders process endpoint
        run: |
          curl -v "https://edgarai.vercel.app/api/reminders/process?dealership_id=534e6d39-7cea-4182-b9ad-15b0f4997484&reminder_type=follow_up"
```

### 2. **Ventajas de GitHub Actions sobre Vercel Cron**
- Mayor confiabilidad y logs detallados.
- Control total sobre la frecuencia y ejecución manual.
- Independiente de la infraestructura de Vercel.
- Fácil de monitorear y auditar desde la pestaña **Actions** de GitHub.

### 3. **Monitoreo y Ejecución Manual**
- Ve a la pestaña **Actions** en tu repo de GitHub.
- El workflow se ejecutará automáticamente cada 30 minutos.
- Puedes lanzar el workflow manualmente con el botón **Run workflow**.
- Los logs de cada ejecución estarán disponibles para revisión.
- Cada ejecución debe generar logs en Vercel (busca el request correspondiente en los logs).

### 4. **Deshabilitar o Comentar los Crons de Vercel**
Para evitar ejecuciones duplicadas y posibles conflictos:
- **Comenta o elimina** la sección `"crons"` en tu archivo `vercel.json`.
- Ejemplo:

```json
{
  // "crons": [
  //   {
  //     "path": "/api/reminders/process?dealership_id=534e6d39-7cea-4182-b9ad-15b0f4997484&reminder_type=follow_up",
  //     "schedule": "0 16 * * *"
  //   }
  // ]
}
```
- Haz deploy para que el cambio surta efecto.

---

## 🧪 Testing
- Lanza el workflow manualmente y verifica logs en GitHub y Vercel.
- Espera la próxima ejecución automática y revisa que el endpoint se llame correctamente.

---

## 📈 Beneficios
- Automatización robusta y auditable.
- Evita problemas de caché, redirecciones o limitaciones de Vercel Cron.
- Fácil de mantener y modificar.

---

## 🔮 Próximos pasos
- Monitorear las primeras ejecuciones.
- Ajustar la frecuencia si es necesario.
- Documentar cualquier ajuste adicional en este archivo. 