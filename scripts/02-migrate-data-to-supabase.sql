-- ============================================
-- MIGRACIÓN DE DATOS DE NEON A SUPABASE
-- ============================================
-- Este script migra todos los datos existentes de Neon a Supabase
-- Puede ejecutarse de forma segura múltiples veces (usa ON CONFLICT DO NOTHING)

-- ============================================
-- 1. CREAR TIPOS ENUM
-- ============================================

DO $$ BEGIN
    CREATE TYPE "AppointmentStatus" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PropertyLabel" AS ENUM ('NUEVA', 'DESTACADA', 'REBAJADA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVO', 'ALQUILADO', 'VENDIDO', 'ELIMINADO', 'RESERVADO', 'EN_REVISION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RentalPeriod" AS ENUM ('MENSUAL', 'SEMANAL', 'DIARIO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TransactionType" AS ENUM ('VENTA', 'ALQUILER', 'VENTA_ALQUILER', 'ALQUILER_OPCION_COMPRA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERVISOR', 'VENDEDOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. INSERTAR PAÍSES (País raíz, sin dependencias)
-- ============================================

INSERT INTO "Country" ("id", "name", "code", "isActive", "createdAt", "updatedAt")
VALUES ('country_argentina', 'Argentina', 'AR', true, '2025-10-31 07:14:06.34', '2025-10-31 07:14:06.34')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- 3. INSERTAR PROVINCIAS (Dependen de Country)
-- ============================================

INSERT INTO "Province" ("id", "name", "countryId", "isActive", "createdAt", "updatedAt")
VALUES 
('province_corrientes', 'Corrientes', 'country_argentina', true, '2025-10-31 07:14:06.343', '2025-10-31 07:14:06.343'),
('province_chaco', 'Chaco', 'country_argentina', true, '2025-10-31 07:14:06.343', '2025-10-31 07:14:06.343')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- 4. INSERTAR CIUDADES (Dependen de Province)
-- ============================================

INSERT INTO "City" ("id", "name", "provinceId", "isActive", "createdAt", "updatedAt")
VALUES 
-- Ciudades de Corrientes
('city_corrientes_capital', 'Corrientes', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_goya', 'Goya', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_paso_libres', 'Paso de los Libres', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_curuzu_cuatia', 'Curuzú Cuatiá', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_bella_vista', 'Bella Vista', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_esquina', 'Esquina', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_mercedes', 'Mercedes', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_monte_caseros', 'Monte Caseros', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_santo_tome', 'Santo Tomé', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_ituzaingo', 'Ituzaingó', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_alvear', 'Alvear', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_empedrado', 'Empedrado', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_saladas', 'Saladas', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_mburucuya', 'Mburucuyá', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
('city_san_roque', 'San Roque', 'province_corrientes', true, '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347'),
-- Ciudades del Chaco
('city_resistencia', 'Resistencia', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_saenz_pena', 'Presidencia Roque Sáenz Peña', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_villa_angela', 'Villa Ángela', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_charata', 'Charata', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_general_pinedo', 'General José de San Martín', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_quitilipi', 'Quitilipi', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_barranqueras', 'Barranqueras', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_fontana', 'Fontana', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_las_brenas', 'Las Breñas', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_machagai', 'Machagai', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_castelli', 'Juan José Castelli', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_villa_berthet', 'Villa Berthet', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_hermoso_campo', 'Hermoso Campo', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_corzuela', 'Corzuela', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_tres_isletas', 'Tres Isletas', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_pampa_del_infierno', 'Pampa del Infierno', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_presidencia_plaza', 'Presidencia de la Plaza', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_puerto_vilelas', 'Puerto Vilelas', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_la_leonesa', 'La Leonesa', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('city_general_pinedo_2', 'General Pinedo', 'province_chaco', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- 5. INSERTAR BARRIOS (Dependen de City)
-- ============================================

INSERT INTO "Neighborhood" ("id", "name", "cityId", "isActive", "createdAt", "updatedAt")
VALUES 
-- Barrios de Corrientes Capital
('neighborhood_centro_ctes', 'Centro', 'city_corrientes_capital', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('neighborhood_san_benito', 'San Benito', 'city_corrientes_capital', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('neighborhood_500_viviendas', '500 Viviendas', 'city_corrientes_capital', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('neighborhood_laguna_brava', 'Laguna Brava', 'city_corrientes_capital', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('neighborhood_san_martin', 'San Martín', 'city_corrientes_capital', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('neighborhood_belgrano', 'Belgrano', 'city_corrientes_capital', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('neighborhood_molina_punta', 'Molina Punta', 'city_corrientes_capital', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('neighborhood_santa_catalina', 'Santa Catalina', 'city_corrientes_capital', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('neighborhood_yapeyú', 'Yapeyú', 'city_corrientes_capital', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('neighborhood_arazaty', 'Arazaty', 'city_corrientes_capital', true, '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35'),
('cmhjg2mvd0003p4fwqvfnn17c', 'Luz y Fuerza', 'city_corrientes_capital', true, '2025-11-03 17:59:23.977', '2025-11-03 17:59:23.977'),
-- Barrios de Resistencia
('neighborhood_centro_res', 'Centro', 'city_resistencia', true, '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352'),
('neighborhood_villa_don_alberto', 'Villa Don Alberto', 'city_resistencia', true, '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352'),
('neighborhood_villa_rio_negro', 'Villa Río Negro', 'city_resistencia', true, '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352'),
('neighborhood_villa_libertad', 'Villa Libertad', 'city_resistencia', true, '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352'),
('neighborhood_villa_prosperidad', 'Villa Prosperidad', 'city_resistencia', true, '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352'),
('neighborhood_barrio_frances', 'Barrio Francés', 'city_resistencia', true, '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352'),
('neighborhood_villa_italia', 'Villa Italia', 'city_resistencia', true, '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352'),
('neighborhood_villa_centenario', 'Villa Centenario', 'city_resistencia', true, '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352'),
('neighborhood_toba', 'Toba', 'city_resistencia', true, '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352'),
('neighborhood_san_cayetano', 'San Cayetano', 'city_resistencia', true, '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- 6. INSERTAR TIPOS DE PROPIEDAD (Sin dependencias)
-- ============================================

INSERT INTO "PropertyType" ("id", "name", "description", "isActive", "createdAt", "updatedAt")
VALUES 
('cmh83rnmw0000p4xclfja57is', 'Casa', 'Casa unifamiliar', true, '2025-10-26 19:29:28.424', '2025-10-27 18:36:05.029'),
('cmh83rnnf0001p4xcinah5tvh', 'Departamento', 'Apartamento o departamento', true, '2025-10-26 19:29:28.444', '2025-10-27 18:36:15.353'),
('cmh83rnnk0002p4xcfrluu4dl', 'Terreno', 'Terreno o lote', true, '2025-10-26 19:29:28.448', '2025-10-27 18:37:07.046'),
('cmh83rnnq0003p4xcakdy65vh', 'Local Comercial', 'Local comercial', true, '2025-10-26 19:29:28.454', '2025-10-27 18:36:39.448'),
('cmh83rnnt0004p4xchqjc3ih6', 'Oficina', 'Oficina', true, '2025-10-26 19:29:28.457', '2025-10-27 18:36:56.476'),
('cmh83rnnv0005p4xc2f5598qy', 'Galpón', 'Galpón', true, '2025-10-26 19:29:28.459', '2025-10-27 18:36:27.094'),
('cmh84otj80000p46w89h6yqxz', 'Campo', '', true, '2025-10-26 19:55:15.716', '2025-10-27 18:35:56.275'),
('cmh84ozz70001p46wqbeg6he4', 'Loteo', '', true, '2025-10-26 19:55:24.067', '2025-10-27 18:36:48.285'),
('cmh84pfp60002p46wc4dp8q79', 'Barrio Privado', '', true, '2025-10-26 19:55:44.442', '2025-10-27 18:35:45.753')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- 7. INSERTAR USUARIOS (Sin dependencias)
-- ============================================

INSERT INTO "User" ("id", "email", "name", "password", "role", "avatar", "phone", "twoFactorEnabled", "twoFactorSecret", "isActive", "createdAt", "updatedAt")
VALUES 
('cmh2bi85u0000p46w9z4w0g6i', 'admin@realestate.com', 'Administrador', '$2a$12$I4QFQxmyWU/buMSlDmX0F.OzbZU7YyhK0Pk1js7JaKZ/gAzwHqzza', 'ADMIN', NULL, '+1 (809) 555-0100', false, NULL, true, '2025-10-22 18:19:28.334', '2025-10-22 18:19:28.334')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- 8. INSERTAR PROPIETARIOS (Dependen de City, Province, Country)
-- ============================================

INSERT INTO "Owner" ("id", "name", "email", "phone", "secondaryPhone", "address", "idNumber", "taxId", "notes", "isActive", "createdAt", "updatedAt", "cityId", "countryId", "provinceId")
VALUES 
('cmh5epngu0000p42gwzcrk5b2', 'José propietario', 'jose@propietario.com', '379-124856313', '', 'Calle de su casa 875', '12.125.658', '', '', true, '2025-10-24 22:12:32.107', '2025-10-24 22:12:32.107', NULL, NULL, NULL),
('cmhan82he0000p4q8rmcjmbtv', 'Julio Rodriguez', 'julio@rodriguez.com', '123456798', NULL, NULL, NULL, NULL, NULL, false, '2025-10-28 14:09:39.218', '2025-10-28 14:09:39.218', NULL, NULL, NULL)
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- 9. INSERTAR CLIENTES (Dependen de City, Province, Country, PropertyType)
-- ============================================

INSERT INTO "Client" ("id", "name", "email", "phone", "secondaryPhone", "address", "occupation", "budget", "preferredTransactionType", "notes", "source", "isActive", "createdAt", "updatedAt", "preferredPropertyTypeId", "cityId", "countryId", "provinceId")
VALUES 
('cmh5ez7sa0001p42g8qwdi598', 'Pedro Cliente', 'pedro@cliente.com', '379-985141321', '', 'Calle del cliente 549', 'Licenciado en Informática', 900, 'ALQUILER', 'No se que poner en las notas', 'Web', true, '2025-10-24 22:19:58.378', '2025-10-24 22:19:58.378', NULL, NULL, NULL, NULL),
('cmh649ggq0000p4ssnwlyu67q', 'Lucca Lens', 'lucc86@gmail.com', '379121212', '', 'Calle nueva 2114', 'Estudiante', 800, 'ALQUILER', 'Nuevas notas', 'Web', true, '2025-10-25 10:07:46.586', '2025-10-25 10:07:46.586', NULL, NULL, NULL, NULL)
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- 10. INSERTAR PROPIEDADES (Dependen de User, Owner, PropertyType, City, etc.)
-- ============================================

INSERT INTO "Property" ("id", "title", "description", "transactionType", "status", "address", "zipCode", "latitude", "longitude", "bedrooms", "bathrooms", "parkingSpaces", "area", "lotSize", "yearBuilt", "price", "pricePerM2", "rentalPrice", "currency", "features", "amenities", "images", "videos", "virtualTour", "wordpressId", "syncedAt", "views", "published", "createdById", "createdAt", "updatedAt", "ownerId", "propertyTypeId", "adrema", "cityId", "countryId", "neighborhoodId", "provinceId", "rentalPeriod", "propertyLabel", "syncToWordPress")
VALUES 
('cmh3hny9r0001p4jckmljv237', 'Casa de prueba', 'Con descripción', 'VENTA', 'ACTIVO', 'AV RIO CHICO 3525', '3400', -27.4610486, -58.787524, 4, 2, NULL, 140, 200, 2020, 150230, 1073.071428571429, 1100, 'USD', '{Jardin}', '{Gimnasio}', '{https://nuevo.mahlerpropiedades.com.ar/wp-content/uploads/2025/10/1-3.jpg,https://nuevo.mahlerpropiedades.com.ar/wp-content/uploads/2025/10/2-3.jpg}', '{}', NULL, 2256, '2025-11-08 11:08:57.935', 3, true, 'cmh2bi85u0000p46w9z4w0g6i', '2025-10-23 13:59:39.327', '2025-11-08 14:29:03.219', 'cmh5epngu0000p42gwzcrk5b2', 'cmh83rnmw0000p4xclfja57is', NULL, 'city_corrientes_capital', 'country_argentina', 'neighborhood_belgrano', 'province_corrientes', NULL, NULL, true),
('cmh2c6uk90003p4rg9l9m7ihy', 'Amplia casa en barrio centrico', 'Descripción de la casa', 'VENTA', 'ACTIVO', 'Tte. Cnel. Cundom 1460', 'w3400', -27.48628, -58.83465, 4, 3, 2, 180, 246, 1969, 150000, 833.3333333333334, NULL, 'USD', '{Piscina,Jardín,Quincho}', '{Gimnasio,"Cancha de tenis","Mesa de Pool",Cine}', '{https://i.pinimg.com/1200x/9d/b4/56/9db456f6fc588802ee6ae3f53a7d2f1b.jpg}', '{}', NULL, 2260, '2025-11-08 11:09:09.573', 6, true, 'cmh2bi85u0000p46w9z4w0g6i', '2025-10-22 18:38:37.114', '2025-11-08 11:09:09.577', 'cmh5epngu0000p42gwzcrk5b2', 'cmh83rnmw0000p4xclfja57is', NULL, 'city_corrientes_capital', 'country_argentina', 'neighborhood_centro_ctes', 'province_corrientes', NULL, 'DESTACADA', true),
('cmh2csgpq0001p4h0klw2nc4t', 'Hermosa casa en barrio privado', 'Descripción de la casa', 'ALQUILER', 'ACTIVO', 'Paraguay 860', 'w3400', -27.4679809, -58.8266259, 4, 2, 1, 160, 300, 2020, 220000, 1375, 1200, 'USD', '{Piscina,Jardín}', '{Gimnasio,"Cancha de tenis","Mesa de Pool"}', '{https://major.estatik.net/wp-content/uploads/2022/11/pexels-photo-3958954-min-1-300x200.jpeg,https://major.estatik.net/wp-content/uploads/2022/11/pexels-photo-5071144-min-300x200.jpeg,https://major.estatik.net/wp-content/uploads/2022/11/pexels-photo-7546721-2-min-300x200.jpeg}', '{}', NULL, 2264, '2025-11-08 11:09:07.012', 14, false, 'cmh2bi85u0000p46w9z4w0g6i', '2025-10-22 18:55:25.598', '2025-11-08 14:30:06.462', 'cmh5epngu0000p42gwzcrk5b2', 'cmh83rnmw0000p4xclfja57is', 'A1-2356', 'city_corrientes_capital', 'country_argentina', 'neighborhood_belgrano', 'province_corrientes', NULL, 'NUEVA', true),
('cmhajo5dd0000p4fg97p2509h', 'Casa Impecable en Corrientes, Corrientes - 3 Hab.', 'Aquí se debe colocar la descripción', 'VENTA', 'ACTIVO', 'Rivadavia 1970', '3400', -27.4754409, -58.8265158, NULL, NULL, NULL, 78, 110, NULL, 120000, 1538.461538461539, NULL, 'USD', '{Parrilla,Quincho}', '{"Mesa de Ping Pong",Pileta}', '{https://imgix.cosentino.com/es/wp-content/uploads/2023/07/Lumire-70-Facade-MtWaverley-vic-1.jpg?auto=format%2Ccompress&ixlib=php-3.3.0&w=1800}', '{}', NULL, 2258, '2025-11-08 11:09:02.844', 0, true, 'cmh2bi85u0000p46w9z4w0g6i', '2025-10-28 12:30:10.989', '2025-11-08 11:09:02.848', 'cmh5epngu0000p42gwzcrk5b2', 'cmh83rnmw0000p4xclfja57is', 'A112545', 'city_corrientes_capital', 'country_argentina', 'neighborhood_centro_ctes', 'province_corrientes', NULL, 'NUEVA', true)
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- 11. INSERTAR CITAS (Dependen de Property, Client, User)
-- ============================================

INSERT INTO "Appointment" ("id", "propertyId", "clientId", "agentId", "scheduledAt", "duration", "status", "notes", "reminderSent", "createdAt", "updatedAt")
VALUES 
('cmh6cs3pt0001p41ox6cz967p', 'cmh2csgpq0001p4h0klw2nc4t', 'cmh649ggq0000p4ssnwlyu67q', 'cmh2bi85u0000p46w9z4w0g6i', '2025-10-28 12:00:00', 60, 'PENDIENTE', 'Esta es otra prueba', false, '2025-10-25 14:06:13.457', '2025-10-25 14:06:13.457'),
('cmh64ohmd0002p4ssw1plx2bk', 'cmh3hny9r0001p4jckmljv237', 'cmh649ggq0000p4ssnwlyu67q', 'cmh2bi85u0000p46w9z4w0g6i', '2025-10-25 13:30:00', 45, 'COMPLETADA', 'Prefiere ver otras propiedades', false, '2025-10-25 10:19:27.922', '2025-10-27 19:00:05.292')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================

-- Mostrar resumen
DO $$
DECLARE
    count_countries INTEGER;
    count_provinces INTEGER;
    count_cities INTEGER;
    count_neighborhoods INTEGER;
    count_property_types INTEGER;
    count_users INTEGER;
    count_owners INTEGER;
    count_clients INTEGER;
    count_properties INTEGER;
    count_appointments INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_countries FROM "Country";
    SELECT COUNT(*) INTO count_provinces FROM "Province";
    SELECT COUNT(*) INTO count_cities FROM "City";
    SELECT COUNT(*) INTO count_neighborhoods FROM "Neighborhood";
    SELECT COUNT(*) INTO count_property_types FROM "PropertyType";
    SELECT COUNT(*) INTO count_users FROM "User";
    SELECT COUNT(*) INTO count_owners FROM "Owner";
    SELECT COUNT(*) INTO count_clients FROM "Client";
    SELECT COUNT(*) INTO count_properties FROM "Property";
    SELECT COUNT(*) INTO count_appointments FROM "Appointment";
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MIGRACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Países: %', count_countries;
    RAISE NOTICE 'Provincias: %', count_provinces;
    RAISE NOTICE 'Ciudades: %', count_cities;
    RAISE NOTICE 'Barrios: %', count_neighborhoods;
    RAISE NOTICE 'Tipos de Propiedad: %', count_property_types;
    RAISE NOTICE 'Usuarios: %', count_users;
    RAISE NOTICE 'Propietarios: %', count_owners;
    RAISE NOTICE 'Clientes: %', count_clients;
    RAISE NOTICE 'Propiedades: %', count_properties;
    RAISE NOTICE 'Citas: %', count_appointments;
    RAISE NOTICE '============================================';
END $$;
