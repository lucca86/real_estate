-- Enable RLS and create security policies for all tables
-- This fixes the security advisories from Supabase

-- ============================================
-- HELPER FUNCTION: Get current user role
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- TABLE: role_permissions
-- Only ADMIN can view and manage
-- ============================================
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view role permissions"
  ON public.role_permissions
  FOR SELECT
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "Admin can insert role permissions"
  ON public.role_permissions
  FOR INSERT
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "Admin can update role permissions"
  ON public.role_permissions
  FOR UPDATE
  USING (get_user_role() = 'ADMIN')
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "Admin can delete role permissions"
  ON public.role_permissions
  FOR DELETE
  USING (get_user_role() = 'ADMIN');

-- ============================================
-- TABLE: permissions_audit
-- Only ADMIN can view, system can insert
-- ============================================
ALTER TABLE public.permissions_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view permissions audit"
  ON public.permissions_audit
  FOR SELECT
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "System can insert permissions audit"
  ON public.permissions_audit
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TABLE: audit_logs
-- Only ADMIN can view, system can insert
-- ============================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TABLE: Contact (Contacts)
-- All authenticated users can view and manage
-- ============================================
ALTER TABLE public."Contact" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contacts"
  ON public."Contact"
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert contacts"
  ON public."Contact"
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contacts"
  ON public."Contact"
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and Supervisor can delete contacts"
  ON public."Contact"
  FOR DELETE
  USING (get_user_role() IN ('ADMIN', 'SUPERVISOR'));

-- ============================================
-- TABLE: Service
-- Admin and Supervisor can manage, others can view
-- ============================================
ALTER TABLE public."Service" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view services"
  ON public."Service"
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and Supervisor can insert services"
  ON public."Service"
  FOR INSERT
  WITH CHECK (get_user_role() IN ('ADMIN', 'SUPERVISOR'));

CREATE POLICY "Admin and Supervisor can update services"
  ON public."Service"
  FOR UPDATE
  USING (get_user_role() IN ('ADMIN', 'SUPERVISOR'))
  WITH CHECK (get_user_role() IN ('ADMIN', 'SUPERVISOR'));

CREATE POLICY "Admin and Supervisor can delete services"
  ON public."Service"
  FOR DELETE
  USING (get_user_role() IN ('ADMIN', 'SUPERVISOR'));

-- ============================================
-- TABLE: ContactService (Junction table)
-- All authenticated users can manage
-- ============================================
ALTER TABLE public."ContactService" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contact services"
  ON public."ContactService"
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert contact services"
  ON public."ContactService"
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contact services"
  ON public."ContactService"
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete contact services"
  ON public."ContactService"
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
