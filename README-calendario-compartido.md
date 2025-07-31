# 📅 Sistema de Calendario Compartido

## 🎯 Objetivo
Permitir que la operadora de citas comparta el calendario del taller con el equipo técnico, proporcionando acceso de solo lectura sin comprometer la seguridad de los datos.

## 📁 Archivos Creados/Modificados

### **Nuevos Archivos**
- `/app/api/calendar/token/route.ts` - API para gestión de tokens
- `/app/calendar/[dealership_id]/page.tsx` - Página pública del calendario
- `/components/calendar-share-widget.tsx` - Widget para compartir calendario
- `/migrations/20241203_create_calendar_tokens.sql` - Migración de base de datos
- `/README-calendario-compartido.md` - Esta documentación

### **Archivos Modificados**
- `/app/backoffice/citas/calendario/page.tsx` - Agregado widget de compartir
- `/types/database.types.ts` - Agregados tipos para calendar_tokens

## 🚀 Implementación

### **Base de Datos**
```sql
-- Tabla principal para tokens
calendar_tokens (
  id UUID PRIMARY KEY,
  dealership_id UUID REFERENCES dealerships(id),
  token_hash TEXT UNIQUE,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN,
  created_by UUID,
  last_accessed_at TIMESTAMP,
  access_count INTEGER
)

-- Funciones principales
create_calendar_token(dealership_id, expires_in_days, created_by)
validate_calendar_token(token_hash)
```

### **API Endpoints**
```
POST /api/calendar/token - Generar nuevo token
GET /api/calendar/token?token=xxx - Validar token
DELETE /api/calendar/token - Revocar token
```

### **Página Pública**
```
/calendar/[dealership_id]?token=xxx
```

## 🧪 Testing

### **Flujo de Prueba**
1. **Operadora genera token**:
   - Ir a Calendario de Citas
   - Hacer clic en "Compartir Calendario"
   - Configurar expiración (30 días por defecto)
   - Generar enlace

2. **Compartir con equipo**:
   - Copiar URL generada
   - Compartir por WhatsApp/Email
   - El equipo accede sin registro

3. **Verificar acceso**:
   - El equipo ve calendario en modo solo lectura
   - No pueden modificar citas
   - Información completa de clientes, vehículos y servicios

### **Casos de Prueba**
- ✅ Token válido → Acceso permitido
- ✅ Token expirado → Acceso denegado
- ✅ Token revocado → Acceso denegado
- ✅ Sin token → Acceso denegado
- ✅ Múltiples accesos → Contador incrementa
- ✅ Renovar token → Token anterior se desactiva

## 📈 Impacto

### **Para la Operadora**
- ✅ Compartir calendario con un clic
- ✅ Control total sobre el acceso
- ✅ Revocar acceso cuando sea necesario
- ✅ Ver estadísticas de uso

### **Para el Equipo del Taller**
- ✅ Acceso inmediato sin registro
- ✅ Vista clara de citas programadas
- ✅ Información completa de clientes y vehículos
- ✅ Funciona en cualquier dispositivo

### **Para el Sistema**
- ✅ Seguridad mediante tokens únicos
- ✅ Auditoría de accesos
- ✅ Expiración automática
- ✅ Escalable para futuras necesidades

## 🔧 Configuración

### **Expiración de Tokens**
- **Por defecto**: 30 días
- **Configurable**: 1-365 días
- **Renovación**: Genera nuevo token automáticamente

### **Información Mostrada**
- ✅ Cliente (nombre, teléfono)
- ✅ Vehículo (marca, modelo, placa)
- ✅ Servicio y duración
- ✅ Hora y estado de la cita
- ✅ Notas/observaciones

### **Información Ocultada**
- ❌ Botones de edición/eliminación
- ❌ Formularios de creación
- ❌ Información financiera
- ❌ Historial completo del cliente

## 🛡️ Seguridad

### **Medidas Implementadas**
- **Tokens únicos**: Generados con `gen_random_bytes(24)`
- **Expiración automática**: Tokens caducan según configuración
- **RLS habilitado**: Filtrado por dealership_id
- **Un token activo**: Por dealership (previene duplicados)
- **Validación completa**: Verificación en cada acceso

### **Auditoría**
- **Contador de accesos**: Registra cada visita
- **Último acceso**: Timestamp del último uso
- **Creador del token**: Para trazabilidad
- **Logs de consola**: Para debugging

## 🎨 UI/UX

### **Widget de Compartir**
- **Ubicación**: Header del calendario
- **Estados**: Sin token / Con token activo
- **Acciones**: Generar, copiar, compartir, renovar, revocar

### **Página Pública**
- **Diseño responsive**: Web y móvil
- **Información clara**: Resumen y lista de citas
- **Estados visuales**: Colores por estado de cita
- **Loading states**: Feedback visual durante carga

## 🔄 Flujo de Uso

### **Primera vez**
1. Operadora va a Calendario de Citas
2. Hace clic en "Compartir Calendario"
3. Configura expiración (opcional)
4. Genera enlace público
5. Copia y comparte URL con el equipo

### **Uso diario**
1. Equipo accede a URL compartida
2. Ve calendario en tiempo real
3. Consulta información de citas
4. No puede modificar datos

### **Gestión**
1. Operadora puede renovar token
2. Puede revocar acceso cuando quiera
3. Ve estadísticas de uso
4. Genera nuevos enlaces según necesidad

## 📱 Compatibilidad

### **Dispositivos**
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Móvil (iOS Safari, Chrome Mobile)
- ✅ Tablet (iPad, Android)

### **Navegadores**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🚀 Próximas Mejoras

### **Funcionalidades Futuras**
- [ ] Filtros por fecha en página pública
- [ ] Notificaciones de acceso
- [ ] Múltiples tokens por dealership
- [ ] Integración con calendarios externos
- [ ] Estadísticas avanzadas de uso

### **Optimizaciones**
- [ ] Cache de datos del calendario
- [ ] Lazy loading de citas
- [ ] Compresión de tokens
- [ ] Rate limiting avanzado

## 📞 Soporte

### **Problemas Comunes**
1. **Token no funciona**: Verificar expiración y estado activo
2. **Acceso denegado**: Contactar operadora para nuevo enlace
3. **Citas no aparecen**: Verificar dealership_id en URL

### **Contacto**
Para soporte técnico, contactar al equipo de desarrollo con:
- URL de la página pública
- Token utilizado
- Error específico
- Navegador y dispositivo 