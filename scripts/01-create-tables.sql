-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERVISOR', 'VENDEDOR');
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVO', 'ALQUILADO', 'VENDIDO', 'ELIMINADO', 'RESERVADO', 'EN_REVISION');
CREATE TYPE "TransactionType" AS ENUM ('VENTA', 'ALQUILER', 'VENTA_ALQUILER', 'ALQUILER_OPCION_COMPRA');
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA');
CREATE TYPE "RentalPeriod" AS ENUM ('MENSUAL', 'SEMANAL', 'DIARIO');
CREATE TYPE "PropertyLabel" AS ENUM ('NUEVA', 'DESTACADA', 'REBAJADA');

-- Create Users table
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VENDEDOR',
    "avatar" TEXT,
    "phone" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Sessions table
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Country table
CREATE TABLE "Country" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL UNIQUE,
    "code" TEXT NOT NULL UNIQUE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Province table
CREATE TABLE "Province" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Province_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Province_name_countryId_key" UNIQUE ("name", "countryId")
);

-- Create City table
CREATE TABLE "City" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "City_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "City_name_provinceId_key" UNIQUE ("name", "provinceId")
);

-- Create Neighborhood table
CREATE TABLE "Neighborhood" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Neighborhood_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Neighborhood_name_cityId_key" UNIQUE ("name", "cityId")
);

-- Create PropertyType table
CREATE TABLE "PropertyType" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Owner table
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT NOT NULL,
    "secondaryPhone" TEXT,
    "address" TEXT,
    "cityId" TEXT,
    "provinceId" TEXT,
    "countryId" TEXT,
    "idNumber" TEXT,
    "taxId" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Owner_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Owner_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Owner_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create Client table
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT NOT NULL,
    "secondaryPhone" TEXT,
    "address" TEXT,
    "cityId" TEXT,
    "provinceId" TEXT,
    "countryId" TEXT,
    "occupation" TEXT,
    "budget" DOUBLE PRECISION,
    "preferredPropertyTypeId" TEXT,
    "preferredTransactionType" "TransactionType",
    "notes" TEXT,
    "source" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Client_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Client_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Client_preferredPropertyTypeId_fkey" FOREIGN KEY ("preferredPropertyTypeId") REFERENCES "PropertyType"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create Property table
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "adrema" TEXT,
    "propertyTypeId" TEXT,
    "transactionType" "TransactionType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVO',
    "rentalPeriod" "RentalPeriod",
    "address" TEXT NOT NULL,
    "neighborhoodId" TEXT,
    "cityId" TEXT,
    "provinceId" TEXT,
    "countryId" TEXT,
    "zipCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "parkingSpaces" INTEGER,
    "area" DOUBLE PRECISION NOT NULL,
    "lotSize" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "price" DOUBLE PRECISION NOT NULL,
    "pricePerM2" DOUBLE PRECISION,
    "rentalPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "virtualTour" TEXT,
    "wordpressId" INTEGER UNIQUE,
    "syncedAt" TIMESTAMP(3),
    "ownerId" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "propertyLabel" "PropertyLabel",
    "syncToWordPress" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Property_propertyTypeId_fkey" FOREIGN KEY ("propertyTypeId") REFERENCES "PropertyType"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Appointment table
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "propertyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "notes" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_token_idx" ON "Session"("token");
CREATE INDEX "Country_code_idx" ON "Country"("code");
CREATE INDEX "Province_countryId_idx" ON "Province"("countryId");
CREATE INDEX "City_provinceId_idx" ON "City"("provinceId");
CREATE INDEX "Neighborhood_cityId_idx" ON "Neighborhood"("cityId");
CREATE INDEX "PropertyType_name_idx" ON "PropertyType"("name");
CREATE INDEX "Owner_email_idx" ON "Owner"("email");
CREATE INDEX "Owner_phone_idx" ON "Owner"("phone");
CREATE INDEX "Owner_cityId_idx" ON "Owner"("cityId");
CREATE INDEX "Owner_provinceId_idx" ON "Owner"("provinceId");
CREATE INDEX "Owner_countryId_idx" ON "Owner"("countryId");
CREATE INDEX "Client_email_idx" ON "Client"("email");
CREATE INDEX "Client_phone_idx" ON "Client"("phone");
CREATE INDEX "Client_preferredPropertyTypeId_idx" ON "Client"("preferredPropertyTypeId");
CREATE INDEX "Client_cityId_idx" ON "Client"("cityId");
CREATE INDEX "Client_provinceId_idx" ON "Client"("provinceId");
CREATE INDEX "Client_countryId_idx" ON "Client"("countryId");
CREATE INDEX "Property_status_idx" ON "Property"("status");
CREATE INDEX "Property_propertyTypeId_idx" ON "Property"("propertyTypeId");
CREATE INDEX "Property_transactionType_idx" ON "Property"("transactionType");
CREATE INDEX "Property_neighborhoodId_idx" ON "Property"("neighborhoodId");
CREATE INDEX "Property_cityId_idx" ON "Property"("cityId");
CREATE INDEX "Property_provinceId_idx" ON "Property"("provinceId");
CREATE INDEX "Property_countryId_idx" ON "Property"("countryId");
CREATE INDEX "Property_wordpressId_idx" ON "Property"("wordpressId");
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");
CREATE INDEX "Property_propertyLabel_idx" ON "Property"("propertyLabel");
CREATE INDEX "Appointment_propertyId_idx" ON "Appointment"("propertyId");
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");
CREATE INDEX "Appointment_agentId_idx" ON "Appointment"("agentId");
CREATE INDEX "Appointment_scheduledAt_idx" ON "Appointment"("scheduledAt");
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");
