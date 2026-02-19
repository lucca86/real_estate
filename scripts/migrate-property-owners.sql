-- Script to assign a default owner to properties without an owner
-- This script should be run before making ownerId required

-- First, let's check if there are properties without owners
SELECT COUNT(*) as properties_without_owner FROM "Property" WHERE "ownerId" IS NULL;

-- Create a default owner if it doesn't exist
INSERT INTO "Owner" (id, name, email, phone, country, "isActive", "createdAt", "updatedAt")
VALUES (
  'default-owner-id',
  'Propietario Por Defecto',
  'default@realestate.com',
  '000-000-0000',
  'República Dominicana',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Assign the default owner to all properties without an owner
UPDATE "Property"
SET "ownerId" = 'default-owner-id'
WHERE "ownerId" IS NULL;

-- Verify the update
SELECT COUNT(*) as properties_without_owner_after FROM "Property" WHERE "ownerId" IS NULL;
