# 🧪 Cómo Testear el Endpoint de Upload de Imágenes

## ✅ Requisitos Previos

1. ✅ Variable `SUPABASE_SERVICE_ROLE_KEY` configurada en `.env`
2. ✅ Servidor Next.js corriendo (`npm run dev`)
3. Una imagen local en tu computadora (cualquier JPG, PNG o WEBP)
4. Un token JWT válido

---

## 📝 PASO 1: Generar Token JWT

Primero necesitas un token JWT para autenticarte. Ejecuta:

```bash
cd /Users/francolonghi/fullApp/edgarai
node generate-test-token.js
```

**Este comando mostrará:**
- ✅ El token JWT generado
- 📋 Los datos del token (dealership_id, email, etc.)
- 📝 Comando curl listo para copiar y pegar

**IMPORTANTE**: Copia el token que aparece en la pantalla. Lo necesitarás en el siguiente paso.

---

## 📸 PASO 2: Conseguir una Imagen de Prueba

Tienes 3 opciones:

### Opción A: Usar una imagen que ya tengas
- Abre Finder
- Busca cualquier foto `.jpg`, `.png` o `.webp`
- Anota la ruta completa (ej: `/Users/francolonghi/Downloads/foto.jpg`)

### Opción B: Tomar screenshot
- Presiona `Cmd + Shift + 4` para tomar screenshot
- Los screenshots se guardan en `~/Desktop/` con nombre `Screen Shot...png`

### Opción C: Descargar imagen de prueba automáticamente
```bash
cd /Users/francolonghi/fullApp/edgarai
curl -o test-image.jpg "https://picsum.photos/800/600.jpg"
```

---

## 🚀 PASO 3: Hacer el Request

### Opción A: Usando curl (línea de comandos)

```bash
curl -X POST http://localhost:3000/api/whatsapp/upload-image \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -F "file=@/ruta/a/tu/imagen.jpg" \
  -F "chat_id=56961567267"
```

**Reemplaza:**
- `TU_TOKEN_AQUI` → El token que generaste en el Paso 1
- `/ruta/a/tu/imagen.jpg` → La ruta real de tu imagen
- `56961567267` → Un número de teléfono válido (8-15 dígitos)

**Ejemplo completo:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/upload-image \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@/Users/francolonghi/Desktop/test.jpg" \
  -F "chat_id=56961567267"
```

### Opción B: Usando el script de bash (más fácil)

```bash
# 1. Exporta el token como variable de entorno
export JWT_TOKEN="tu_token_aqui"

# 2. Ejecuta el script (automáticamente descarga imagen si no existe)
./test-upload-image.sh
```

---

## ✅ Respuesta Exitosa

Si todo salió bien, verás algo como:

```json
{
  "success": true,
  "media_url": "https://kronhxyuinsrsoezbtni.supabase.co/storage/v1/object/public/whatsapp-media/6b58f82d-baa6-44ce-9941-1a61975d20b5/2025/10/1729468800000-a1b2c3d4.jpg",
  "metadata": {
    "original_size": 2048576,
    "compressed_size": 512000,
    "compression_ratio": "75%",
    "mime_type": "image/jpeg",
    "dimensions": { "width": 1920, "height": 1080 },
    "storage_path": "6b58f82d-baa6-44ce-9941-1a61975d20b5/2025/10/1729468800000-a1b2c3d4.jpg"
  }
}
```

**Copia la `media_url` y ábrela en tu navegador** para ver que la imagen se subió correctamente.

---

## ❌ Errores Comunes

### Error 401: Unauthorized
```json
{
  "success": false,
  "error": "Token de autorización requerido",
  "code": "UNAUTHORIZED"
}
```
**Solución**: Verifica que incluiste el header `Authorization: Bearer ...`

### Error 400: Invalid phone number
```json
{
  "success": false,
  "error": "Formato de chat_id inválido...",
  "code": "INVALID_PHONE_NUMBER"
}
```
**Solución**: El `chat_id` debe ser un número de 8-15 dígitos (ej: `56961567267`)

### Error 413: File too large
```json
{
  "success": false,
  "error": "El archivo es demasiado grande. Máximo: 5MB",
  "code": "FILE_TOO_LARGE"
}
```
**Solución**: Usa una imagen más pequeña (< 5MB)

### Error 400: Invalid file type
```json
{
  "success": false,
  "error": "Tipo de archivo no permitido...",
  "code": "INVALID_FILE_TYPE"
}
```
**Solución**: Solo se aceptan `.jpg`, `.jpeg`, `.png`, `.webp`

---

## 🔍 Verificar Logs en Consola

Mientras haces el test, revisa la consola donde corre `npm run dev`. Verás logs como:

```
🔄 [ImageUpload] Iniciando proceso de upload de imagen
✅ [ImageUpload] Usuario autenticado: { dealership_id: '6b58f82d-...', user_id: 'test-user-id' }
📁 [ImageUpload] Archivo recibido: { name: 'test.jpg', type: 'image/jpeg', size: 2048576 }
✅ [ImageUpload] Validación de archivo exitosa
🗜️ [ImageUpload] Comprimiendo imagen...
✅ [ImageUpload] Compresión exitosa: { original: 2048576, compressed: 512000, ratio: '75%' }
📤 [ImageUpload] Subiendo a Supabase Storage...
✅ [ImageUpload] Upload exitoso: https://...
```

---

## 🎯 Dealerships Disponibles

Tu base de datos tiene los siguientes dealerships:

1. **Agencia 1** → `6b58f82d-baa6-44ce-9941-1a61975d20b5` (default en el script)
2. **JAC/Chirey - Uruapan** → `147baceb-ff36-450d-93f8-780a0202824c`
3. **JAC - Morelia** → `6fa78291-c16a-4c78-9fe2-9e3695d24d48`

Si quieres cambiar el dealership, edita `generate-test-token.js` y cambia el valor de `dealership_id`.

---

## 🆘 ¿Necesitas Ayuda?

1. Verifica que el servidor esté corriendo: `npm run dev`
2. Verifica que la variable `SUPABASE_SERVICE_ROLE_KEY` exista en `.env`
3. Revisa los logs en la consola (tienen emojis 🔍 para facilitar debugging)
4. Si el endpoint retorna error, el JSON tendrá un campo `code` que indica el problema exacto

---

**¡Listo! Ahora puedes testear el upload de imágenes 🎉**

