-- Script para corregir las políticas RLS de calendar_tokens
-- Ejecutar en el SQL Editor de Supabase

-- 1. Eliminar política existente
DROP POLICY IF EXISTS "Dealerships can manage their own calendar tokens" ON calendar_tokens;

-- 2. Crear nueva política más permisiva
CREATE POLICY "Dealerships can manage their own calendar tokens" ON calendar_tokens
    FOR ALL USING (
        dealership_id::text = auth.jwt() ->> 'dealership_id' OR
        auth.jwt() ->> 'dealership_id' IS NOT NULL
    );

-- 3. Verificar que la política se creó correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'calendar_tokens'; 