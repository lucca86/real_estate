-- ============================================================
-- Migration: Enable RLS on all public tables
-- Strategy: Enable RLS + deny all access for anon/authenticated roles.
-- The service_role key (used by createAdminClient) always bypasses RLS,
-- so no application functionality is affected.
-- ============================================================

-- 1. Enable RLS on every public table
ALTER TABLE public."Appointment"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."City"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Client"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Country"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Neighborhood"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Owner"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Property"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PropertyType"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Province"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User"             ENABLE ROW LEVEL SECURITY;

-- 2. Drop any legacy policies that may exist from the old snake_case tables
--    (the Security Advisor found orphan policies on the old table names)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'appointments', 'clients', 'owners', 'properties',
        'system_settings', 'Appointment', 'Client', 'Owner',
        'Property', 'User', 'Session', 'City', 'Country',
        'Neighborhood', 'PropertyType', 'Province'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
  END LOOP;
END $$;

-- 3. Create a single "deny all" policy per table for anon + authenticated roles.
--    service_role bypasses RLS entirely so the app keeps working normally.

-- Appointment
CREATE POLICY "deny_direct_access" ON public."Appointment"
  AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false);

-- City
CREATE POLICY "deny_direct_access" ON public."City"
  AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false);

-- Client
CREATE POLICY "deny_direct_access" ON public."Client"
  AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false);

-- Country
CREATE POLICY "deny_direct_access" ON public."Country"
  AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false);

-- Neighborhood
CREATE POLICY "deny_direct_access" ON public."Neighborhood"
  AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false);

-- Owner
CREATE POLICY "deny_direct_access" ON public."Owner"
  AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false);

-- Property
CREATE POLICY "deny_direct_access" ON public."Property"
  AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false);

-- PropertyType
CREATE POLICY "deny_direct_access" ON public."PropertyType"
  AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false);

-- Province
CREATE POLICY "deny_direct_access" ON public."Province"
  AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false);

-- Session
CREATE POLICY "deny_direct_access" ON public."Session"
  AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false);

-- User (contains password hash and 2FA secret — must be locked down)
CREATE POLICY "deny_direct_access" ON public."User"
  AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false);

-- 4. Revoke PostgREST/API exposure of sensitive columns on Owner
--    (fixes "Sensitive Columns Exposed" warning for idNumber and taxId)
COMMENT ON COLUMN public."Owner"."idNumber" IS 'sensitive';
COMMENT ON COLUMN public."Owner"."taxId"    IS 'sensitive';
