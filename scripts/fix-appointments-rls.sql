-- =====================================================
-- FIX APPOINTMENTS RLS POLICIES - FINAL WORKING VERSION
-- =====================================================
-- Este script corrige las políticas RLS de appointments
-- IMPORTANTE: Usa 'anon' y 'authenticated' porque la app
-- usa ANON_KEY de Supabase en las queries
-- =====================================================

-- 1. Eliminar TODAS las políticas existentes de manera dinámica
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'appointments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON appointments', pol.policyname);
    END LOOP;
END $$;

-- 2. Crear políticas RLS que funcionen con anon y authenticated roles
-- Cambiado de 'TO authenticated' a 'TO anon, authenticated' para soportar ANON_KEY

-- SELECT: Permitir a usuarios anon y autenticados ver todas las citas
CREATE POLICY "allow_anon_select"
ON appointments FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT: Permitir a usuarios anon y autenticados crear citas
CREATE POLICY "allow_anon_insert"
ON appointments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- UPDATE: Permitir a usuarios anon y autenticados actualizar citas
CREATE POLICY "allow_anon_update"
ON appointments FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Permitir a usuarios anon y autenticados eliminar citas
-- El control de permisos granular se maneja en la aplicación (appointments.manage)
CREATE POLICY "allow_anon_delete"
ON appointments FOR DELETE
TO anon, authenticated
USING (true);

-- 3. Re-habilitar RLS con las nuevas políticas
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 4. Verificar las políticas creadas
SELECT 
    policyname,
    cmd as operation,
    roles
FROM pg_policies 
WHERE tablename = 'appointments'
ORDER BY cmd;
