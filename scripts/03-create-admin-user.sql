-- Script para crear un usuario administrador
-- Contraseña: Admin123! (hasheada con bcrypt)

-- Insertar usuario administrador
INSERT INTO "User" (
  id,
  email,
  name,
  password,
  role,
  phone,
  "twoFactorEnabled",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'admin_' || substr(md5(random()::text), 1, 20),
  'admin@mahler.com',
  'Administrador',
  '$2a$10$YourHashedPasswordHere', -- Placeholder, será reemplazado por script
  'ADMIN',
  '+54 9 11 1234-5678',
  false,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  "isActive" = true,
  "updatedAt" = NOW();
