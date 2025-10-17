#!/usr/bin/env node

/**
 * Script para generar un JWT de prueba para testing de endpoints
 * Uso: node scripts/generate-test-token.js
 */

const jwt = require('jsonwebtoken');

// Mismo secret que usa la app
const secretKey = process.env.JWT_SECRET || 'yourFallbackSecret';

// Payload para Nissan - Autopolis
const payload = {
  id: 1,
  email: 'test@nissan-autopolis.com',
  dealership_id: '803b2961-b9d5-47f3-be4a-c8c114c85b5e',
  names: 'Test',
  surnames: 'User'
};

// Generar token (expira en 1 hora)
const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });

console.log('\n🔑 JWT Token Generado para Testing\n');
console.log('Dealership:', 'Nissan - Autopolis');
console.log('Dealership ID:', payload.dealership_id);
console.log('\nToken:\n');
console.log(token);
console.log('\n');
console.log('Usa este token en el header Authorization:');
console.log(`Authorization: Bearer ${token}`);
console.log('\n');

