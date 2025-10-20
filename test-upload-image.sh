#!/bin/bash

# Script de testing para el endpoint de upload de imágenes

# CONFIGURACIÓN
API_URL="http://localhost:3000/api/whatsapp/upload-image"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Script de Testing - Upload de Imágenes WhatsApp"
echo "=================================================="
echo ""

# 1. Verificar que existe una imagen de prueba
if [ ! -f "test-image.jpg" ]; then
    echo "${YELLOW}⚠️  No se encontró test-image.jpg${NC}"
    echo "📥 Descargando imagen de prueba..."
    curl -s -o test-image.jpg "https://picsum.photos/800/600.jpg"
    
    if [ $? -eq 0 ]; then
        echo "${GREEN}✅ Imagen de prueba descargada${NC}"
    else
        echo "${RED}❌ Error al descargar imagen. Usa tu propia imagen.${NC}"
        exit 1
    fi
fi

# 2. Verificar JWT Token
if [ -z "$JWT_TOKEN" ]; then
    echo "${RED}❌ Variable JWT_TOKEN no configurada${NC}"
    echo ""
    echo "Para obtener un token JWT, tienes dos opciones:"
    echo ""
    echo "1️⃣  Desde el navegador (si ya iniciaste sesión en el backoffice):"
    echo "   - Abre DevTools (F12)"
    echo "   - Ve a Application → Local Storage"
    echo "   - Busca la key que guarda el token (ej: 'token', 'jwt', 'auth')"
    echo "   - Copia el valor"
    echo ""
    echo "2️⃣  Generar uno nuevo con Node.js:"
    echo "   node generate-test-token.js"
    echo ""
    echo "Luego ejecuta:"
    echo "   export JWT_TOKEN='tu_token_aqui'"
    echo "   ./test-upload-image.sh"
    exit 1
fi

echo "${GREEN}✅ Token JWT configurado${NC}"
echo ""

# 3. Hacer el request
echo "📤 Subiendo imagen al endpoint..."
echo "URL: $API_URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@test-image.jpg" \
  -F "chat_id=56961567267")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 Respuesta del servidor:"
echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "${GREEN}✅ ¡Upload exitoso!${NC}"
    echo ""
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    
    # Extraer y mostrar la URL de la imagen
    MEDIA_URL=$(echo "$BODY" | grep -o '"media_url":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$MEDIA_URL" ]; then
        echo ""
        echo "${GREEN}🔗 URL de la imagen:${NC}"
        echo "$MEDIA_URL"
        echo ""
        echo "Puedes abrir esta URL en tu navegador para verificar que la imagen se subió correctamente."
    fi
else
    echo "${RED}❌ Error en el upload${NC}"
    echo ""
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi

echo ""
echo "=================================================="

