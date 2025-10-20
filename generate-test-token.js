/**
 * Script para generar un token JWT de prueba
 * Uso: node generate-test-token.js
 */

const jwt = require('jsonwebtoken');

// Intenta cargar dotenv si está disponible (opcional)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv no instalado, usa variable de entorno del sistema
}

const secretKey = process.env.JWT_SECRET || 'yourFallbackSecret';

// CONFIGURACIÓN: Ajusta estos valores según tu dealership
const payload = {
  id: 'test-user-id',
  email: 'test@dealership.com',
  names: 'Usuario',
  surnames: 'de Prueba',
  dealership_id: '6b58f82d-baa6-44ce-9941-1a61975d20b5', // Ajusta este ID según tu dealership
  role: 'admin'
};

console.log('🔐 Generando token JWT de prueba...\n');

try {
  const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
  
  console.log('✅ Token generado exitosamente:\n');
  console.log('━'.repeat(80));
  console.log(token);
  console.log('━'.repeat(80));
  console.log('\n📋 Payload del token:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n⏰ Válido por: 1 hora');
  console.log('\n📝 Para usar en bash:');
  console.log(`export JWT_TOKEN="${token}"`);
  console.log('\n📝 Para usar en curl:');
  console.log(`curl -X POST http://localhost:3000/api/whatsapp/upload-image \\`);
  console.log(`  -H "Authorization: Bearer ${token}" \\`);
  console.log(`  -F "file=@test-image.jpg" \\`);
  console.log(`  -F "chat_id=56961567267"`);
  console.log('\n✅ ¡Listo para testear!\n');
  
} catch (error) {
  console.error('❌ Error al generar token:', error.message);
  process.exit(1);
}

