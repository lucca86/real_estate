-- Enable RLS on tables that have it disabled
-- The app uses service_role (createAdminClient) which bypasses RLS entirely,
-- so enabling RLS here does NOT affect application functionality.
-- These policies block direct anon/authenticated access via the PostgREST API.

-- ============================================================
-- 1. Enable RLS on all affected tables
-- ============================================================
ALTER TABLE public.appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Drop any existing policies on these tables (idempotent)
-- ============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('appointments','clients','owners','properties','system_settings')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END$$;

-- ============================================================
-- 3. Create deny-all policies for anon and authenticated roles
--    service_role bypasses RLS and is used by the app backend.
-- ============================================================

-- appointments
CREATE POLICY "deny_anon_appointments"
  ON public.appointments FOR ALL TO anon USING (false);
CREATE POLICY "deny_authenticated_appointments"
  ON public.appointments FOR ALL TO authenticated USING (false);

-- clients
CREATE POLICY "deny_anon_clients"
  ON public.clients FOR ALL TO anon USING (false);
CREATE POLICY "deny_authenticated_clients"
  ON public.clients FOR ALL TO authenticated USING (false);

-- owners
CREATE POLICY "deny_anon_owners"
  ON public.owners FOR ALL TO anon USING (false);
CREATE POLICY "deny_authenticated_owners"
  ON public.owners FOR ALL TO authenticated USING (false);

-- properties
CREATE POLICY "deny_anon_properties"
  ON public.properties FOR ALL TO anon USING (false);
CREATE POLICY "deny_authenticated_properties"
  ON public.properties FOR ALL TO authenticated USING (false);

-- system_settings
CREATE POLICY "deny_anon_system_settings"
  ON public.system_settings FOR ALL TO anon USING (false);
CREATE POLICY "deny_authenticated_system_settings"
  ON public.system_settings FOR ALL TO authenticated USING (false);

-- ============================================================
-- 4. Verify result
-- ============================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('appointments','clients','owners','properties','system_settings')
ORDER BY tablename;
