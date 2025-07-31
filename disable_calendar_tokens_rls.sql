-- Script para deshabilitar RLS en calendar_tokens
-- Ejecutar en el SQL Editor de Supabase

-- Deshabilitar RLS en calendar_tokens
ALTER TABLE calendar_tokens DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'calendar_tokens'; 