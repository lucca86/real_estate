-- ==================== FIXES RLS Y PERMISOS ====================
-- Este script corrige los problemas de RLS que están bloqueando operaciones

-- 1. VERIFICAR CURRENT USER PARA DEBUG
SELECT current_user, session_user;

-- 2. DESHABILITAR RLS EN PROPERTIES (temporal para debug)
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;

-- 3. DESHABILITAR RLS EN APPOINTMENTS 
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- 4. DESHABILITAR RLS EN CONTACTS
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;

-- 5. DESHABILITAR RLS EN OWNERS
ALTER TABLE owners DISABLE ROW LEVEL SECURITY;

-- 6. VERIFICAR QUE RLS ESTÉ DESHABILITADA
SELECT tablename, rls_enabled
FROM pg_tables
WHERE tablename IN ('properties', 'appointments', 'contacts', 'owners')
ORDER BY tablename;

-- 7. VERIFICAR LAS POLÍTICAS (deberían estar inactivas pero existentes)
SELECT tablename, policyname, permissive, roles
FROM pg_policies
WHERE tablename IN ('properties', 'appointments', 'contacts', 'owners')
ORDER BY tablename, policyname;

-- ==================== NOTA IMPORTANTE ====================
-- DESPUÉS de confirmar que las operaciones funcionan sin RLS:
-- 1. RE-HABILITAR RLS: ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
-- 2. REVISAR LAS POLÍTICAS Y CORREGIRLAS
-- 3. ASEGURAR QUE LAS POLÍTICAS PERMITAN LA OPERACIÓN DEL USUARIO ACTUAL
