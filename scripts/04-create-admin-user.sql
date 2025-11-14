-- Script para crear usuario administrador en Supabase
-- IMPORTANTE: Este script crea un usuario admin con contraseña: Admin123!

-- Agregando schema explícito public para evitar errores
-- Ensure we're in the public schema
SET search_path TO public;

-- Insertar usuario administrador con contraseña hasheada usando bcrypt
INSERT INTO public."User" (
  "id",
  "email", 
  "password",
  "name",
  "role",
  "isActive",
  "phone",
  "avatar",
  "twoFactorEnabled",
  "twoFactorSecret",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'admin@realestate.com',
  '$2a$10$rZ5XqN8hF.yGxKj4vQ3LXOqKzP8xJ.Y7mLn3vT5wQzF7xBpKzE8.O', -- Contraseña: Admin123!
  'Administrador',
  'ADMIN',
  true,
  NULL,
  NULL,
  false,
  NULL,
  NOW(),
  NOW()
) ON CONFLICT ("email") DO UPDATE SET
  "password" = EXCLUDED."password",
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- Verificar que el usuario se creó correctamente
SELECT "id", "email", "name", "role", "isActive", "createdAt" 
FROM public."User" 
WHERE "email" = 'admin@realestate.com';

-- Mostrar resumen de usuarios
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE "role" = 'ADMIN') as admin_users,
  COUNT(*) FILTER (WHERE "isActive" = true) as active_users
FROM public."User";
