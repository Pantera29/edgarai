# Endpoint: Upload de Imágenes para WhatsApp

## 📋 Resumen

Endpoint que permite subir imágenes con compresión automática a Supabase Storage para ser utilizadas en conversaciones de WhatsApp via la API.

## 🔧 Implementación Completada

### Archivos Creados

1. **`lib/validators.ts`** - Funciones de validación
   - `validateImageFile()`: Valida tipo MIME y tamaño máximo (5MB)
   - `validatePhoneNumber()`: Valida formato de número telefónico
   - `isValidMimeType()`: Verifica tipos de imagen permitidos

2. **`lib/image-processing.ts`** - Procesamiento con Sharp
   - `compressImage()`: Comprime a JPEG 85%, max-width 1920px, elimina metadata
   - `getImageDimensions()`: Obtiene dimensiones de la imagen
   - Retorna metadata completa de compresión

3. **`lib/storage-utils.ts`** - Integración con Supabase Storage
   - `getServiceRoleClient()`: Cliente Supabase con service role key
   - `generateStoragePath()`: Genera paths estructurados `{dealership}/{year}/{month}/{timestamp}-{uuid}.jpg`
   - `uploadToStorage()`: Sube archivos al bucket `whatsapp-media`
   - `deleteFromStorage()`: Elimina archivos (útil para limpieza)

4. **`app/api/whatsapp/upload-image/route.ts`** - Endpoint principal
   - Autenticación JWT completa
   - Validaciones robustas
   - Logs detallados con emojis
   - Manejo de errores comprensivo

## 🔐 Variables de Entorno Requeridas

Asegúrate de que tu archivo `.env` o `.env.local` contenga:

```bash
# Supabase (ya configuradas)
NEXT_PUBLIC_SUPABASE_URL=https://kronhxyuinsrsoezbtni.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Service Role Key (CRÍTICO - agregar si no existe)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# JWT (ya configurado)
JWT_SECRET=tu_jwt_secret_aqui
```

### 🔑 Cómo obtener SUPABASE_SERVICE_ROLE_KEY:

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Settings → API
3. Project API keys → `service_role` key (secret)
4. Copia la key y agrégala a tu `.env`

**⚠️ IMPORTANTE**: Nunca expongas esta key en el frontend. Solo úsala en el backend (API routes).

## 📡 API Endpoint

### `POST /api/whatsapp/upload-image`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data
```

**Body (FormData):**
- `file`: File (imagen JPEG/PNG/WEBP, max 5MB) - **requerido**
- `chat_id`: string (número de teléfono del usuario, ej: "56961567267") - **requerido**
- `dealership_id`: string (opcional, se valida contra el JWT)
- `caption`: string (opcional, para uso futuro)

**Response Exitoso (200):**
```json
{
  "success": true,
  "media_url": "https://kronhxyuinsrsoezbtni.supabase.co/storage/v1/object/public/whatsapp-media/abc-123/2025/10/1729468800000-uuid.jpg",
  "metadata": {
    "original_size": 2048576,
    "compressed_size": 512000,
    "compression_ratio": "75%",
    "mime_type": "image/jpeg",
    "dimensions": { "width": 1920, "height": 1080 },
    "storage_path": "abc-123/2025/10/1729468800000-uuid.jpg"
  }
}
```

**Códigos de Error:**
- `400` - Bad Request (validación falló)
- `401` - Unauthorized (token inválido o missing)
- `403` - Forbidden (dealership_id no coincide)
- `413` - Payload Too Large (archivo > 5MB)
- `500` - Internal Server Error

**Códigos de Error Detallados:**
- `UNAUTHORIZED` - Token inválido o faltante
- `FORBIDDEN` - Sin permiso para este dealership
- `MISSING_FILE` - Archivo no proporcionado
- `INVALID_FILE_TYPE` - Tipo de archivo no permitido
- `FILE_TOO_LARGE` - Archivo excede 5MB
- `MISSING_CHAT_ID` - chat_id no proporcionado
- `INVALID_PHONE_NUMBER` - Formato de teléfono inválido
- `COMPRESSION_FAILED` - Error al comprimir imagen
- `UPLOAD_FAILED` - Error al subir a Storage
- `INTERNAL_ERROR` - Error inesperado

## 🧪 Testing

### Con curl:

```bash
# Test básico
curl -X POST http://localhost:3000/api/whatsapp/upload-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "chat_id=56961567267"

# Con caption
curl -X POST http://localhost:3000/api/whatsapp/upload-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "chat_id=56961567267" \
  -F "caption=Imagen de prueba"
```

### Con JavaScript (Frontend):

```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('chat_id', '56961567267');

const response = await fetch('/api/whatsapp/upload-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  },
  body: formData
});

const result = await response.json();
console.log(result.media_url);
```

## ✅ Validaciones Implementadas

1. ✅ Autenticación JWT obligatoria
2. ✅ Token debe contener `dealership_id`
3. ✅ Archivo debe existir y no estar vacío
4. ✅ Tipo MIME: solo `image/jpeg`, `image/png`, `image/webp`
5. ✅ Tamaño máximo: 5MB (límite de WhatsApp)
6. ✅ `chat_id` debe tener formato válido: `/^\+?\d{8,15}$/`
7. ✅ `dealership_id` del body (si existe) debe coincidir con el del JWT

## 📦 Características de Compresión

- **Formato**: Convierte todo a JPEG
- **Calidad**: 85% (balance óptimo calidad/tamaño)
- **Ancho máximo**: 1920px (mantiene aspect ratio)
- **Metadata**: Elimina EXIF para privacidad
- **Auto-rotación**: Respeta orientación EXIF antes de remover

## 🗂️ Estructura de Storage

Las imágenes se guardan en el bucket `whatsapp-media` con la siguiente estructura:

```
whatsapp-media/
├── dealership-id-1/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── 1704067200000-uuid-1.jpg
│   │   │   └── 1704153600000-uuid-2.jpg
│   │   ├── 02/
│   │   └── 10/
│   └── 2024/
└── dealership-id-2/
    └── 2025/
```

Formato del nombre: `{timestamp}-{uuid}.jpg`
- `timestamp`: Date.now() (milisegundos desde epoch)
- `uuid`: crypto.randomUUID() (identificador único)

## 🔄 Próximos Pasos (No Implementados Aún)

1. **Guardar en `historial_chat`**
   - Agregar insert en tabla después de upload exitoso
   - Campos: `message_type: 'image'`, `media_url`, `media_metadata`

2. **Integración con Kapso/N8N**
   - Endpoint para enviar imagen vía WhatsApp
   - Usar `media_url` retornada por este endpoint

3. **Frontend UI**
   - Componente de upload de imágenes
   - Preview antes de enviar
   - Barra de progreso

4. **Optimizaciones Futuras**
   - Limpieza de imágenes antiguas (cronjob)
   - Soporte para múltiples imágenes en un solo request
   - Watermark opcional

## 📊 Logs y Debugging

El endpoint genera logs detallados con emojis para facilitar el debugging:

- 🔄 Inicio de proceso
- 📋 Datos recibidos
- 📁 Información de archivo
- ✅ Validaciones exitosas
- 🗜️ Compresión en proceso
- 📂 Path generado
- 📤 Upload a Storage
- ✅ Éxito
- ❌ Errores

## 🛡️ Seguridad

- ✅ Autenticación JWT obligatoria
- ✅ Validación de dealership_id contra el token
- ✅ Validación estricta de tipos de archivo
- ✅ Límite de tamaño para prevenir DoS
- ✅ Service role key solo en backend
- ✅ Eliminación de metadata EXIF para privacidad
- ✅ Paths únicos para prevenir colisiones

## 📞 Soporte

Si encuentras errores, revisa:
1. Logs en consola (tienen emojis para identificar pasos)
2. Códigos de error en response JSON
3. Variables de entorno configuradas correctamente
4. Bucket `whatsapp-media` existe y es público

---

**Implementado por:** Cursor AI Agent  
**Fecha:** Octubre 2025  
**Versión:** 1.0.0

