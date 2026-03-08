-- =====================================================
-- MIGRATION SCRIPT: Insert Data into Supabase
-- All tables already exist, this script only inserts data
-- =====================================================

-- Clear existing data (optional, comment out if you want to keep existing data)
TRUNCATE TABLE "Appointment" CASCADE;
TRUNCATE TABLE "Property" CASCADE;
TRUNCATE TABLE "Client" CASCADE;
TRUNCATE TABLE "Owner" CASCADE;
TRUNCATE TABLE "PropertyType" CASCADE;
TRUNCATE TABLE "Neighborhood" CASCADE;
TRUNCATE TABLE "City" CASCADE;
TRUNCATE TABLE "Province" CASCADE;
TRUNCATE TABLE "Country" CASCADE;
TRUNCATE TABLE "User" CASCADE;

-- =====================================================
-- 1. INSERT COUNTRIES
-- =====================================================
INSERT INTO "Country" ("id", "name", "code", "isActive", "createdAt", "updatedAt")
VALUES 
('clyqxm3uy0000svxl6d4vgxwz', 'Argentina', 'AR', true, '2025-01-14 21:01:19.23', '2025-01-14 21:01:19.23')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. INSERT PROVINCES
-- =====================================================
INSERT INTO "Province" ("id", "name", "countryId", "isActive", "createdAt", "updatedAt")
VALUES 
('clyqxnrdy0001svxllsqsqhim', 'Córdoba', 'clyqxm3uy0000svxl6d4vgxwz', true, '2025-01-14 21:03:03.83', '2025-01-14 21:03:03.83'),
('clyqxo67a0002svxl0qfbnomk', 'Buenos Aires', 'clyqxm3uy0000svxl6d4vgxwz', true, '2025-01-14 21:03:21.726', '2025-01-14 21:03:21.726')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. INSERT CITIES
-- =====================================================
INSERT INTO "City" ("id", "name", "provinceId", "isActive", "createdAt", "updatedAt")
VALUES 
('clyqxp7si0003svxldecrkpxe', 'Córdoba Capital', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si0004svxlsomcsomz', 'Villa María', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si0005svxlwhzukavd', 'Río Cuarto', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si0006svxlcsxmrpze', 'San Francisco', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si0007svxlptidyajz', 'Villa Carlos Paz', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si0008svxlexzzygcn', 'Alta Gracia', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si0009svxlwnvamstl', 'Jesús María', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000asvxlpkbzhvww', 'Bell Ville', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000bsvxlidhpqoah', 'Río Tercero', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000csvxlimhmgxkp', 'La Carlota', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000dsvxldqsxsitm', 'Arroyito', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000esvxlhvlmvumq', 'Cosquín', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000fsvxlxtdpnpdb', 'Cruz del Eje', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000gsvxlmgrmztzq', 'Villa Dolores', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000hsvxlgnkzsruh', 'Deán Funes', 'clyqxnrdy0001svxllsqsqhim', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000isvxlqjsvzmrv', 'La Plata', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000jsvxlagvnlqmz', 'Mar del Plata', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000ksvxlsqmtgmxo', 'Bahía Blanca', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000lsvxlhgvvdmnu', 'San Nicolás', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000msvxlkymovtkj', 'Tandil', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000nsvxllvusqnxy', 'Pergamino', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000osvxlojqnzsab', 'Zárate', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000psvxlyqlmnsmw', 'Olavarría', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000qsvxlzjwckupm', 'Junín', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000rsvxlvjqwqrrn', 'Quilmes', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000ssvxlyjwckwpm', 'Avellaneda', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000tsvxlmkrsivzq', 'Lanús', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000usvxlhagqtmnx', 'San Isidro', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000vsvxlqsvmzkrv', 'Lomas de Zamora', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483'),
('clyqxp7si000wsvxlagvzkqmz', 'Morón', 'clyqxo67a0002svxl0qfbnomk', true, '2025-01-14 21:04:34.483', '2025-01-14 21:04:34.483')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. INSERT NEIGHBORHOODS
-- =====================================================
INSERT INTO "Neighborhood" ("id", "name", "cityId", "isActive", "createdAt", "updatedAt")
VALUES 
('clyqxqkgx000xsvxlsobnqvze', 'Nueva Córdoba', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx000ysvxlhzrsitma', 'Cerro de las Rosas', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx000zsvxlmgqznuzq', 'General Paz', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx0010svxlgnrzsush', 'Alberdi', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx0011svxlqjszzmrw', 'Barrio Jardín', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx0012svxlagvnkqna', 'Güemes', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx0013svxlsqmsgmxp', 'Alto Verde', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx0014svxlhgvvemnv', 'Villa Belgrano', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx0015svxlkymovukk', 'San Vicente', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx0016svxllvusrnxy', 'Observatorio', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx0017svxlojqnzsbc', 'Parque Sarmiento', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx0018svxlyqlmnsnx', 'Urca', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx0019svxlzjwckuqn', 'San Martín', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx001asvxlvjqwqrro', 'Centro', 'clyqxp7si0003svxldecrkpxe', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx001bsvxlyjwckwqn', 'Rogelio Martínez', 'clyqxp7si0004svxlsomcsomz', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx001csvxlmkrsivzr', 'Centro (Villa María)', 'clyqxp7si0004svxlsomcsomz', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx001dsvxlhagqtmny', 'Palermo', 'clyqxp7si0005svxlwhzukavd', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx001esvxlqsvmzkrw', 'Centro (Río Cuarto)', 'clyqxp7si0005svxlwhzukavd', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx001fsvxlagvzkqn0', 'Centro (San Francisco)', 'clyqxp7si0006svxlcsxmrpze', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx001gsvxlsqmthmxp', 'Villa del Lago', 'clyqxp7si0007svxlptidyajz', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121'),
('clyqxqkgx001hsvxlhgvvdmnu', 'Centro (Villa Carlos Paz)', 'clyqxp7si0007svxlptidyajz', true, '2025-01-14 21:05:59.121', '2025-01-14 21:05:59.121')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. INSERT PROPERTY TYPES
-- =====================================================
INSERT INTO "PropertyType" ("id", "name", "description", "isActive", "createdAt", "updatedAt")
VALUES 
('clyqxs24z001isvxluztpcahb', 'Casa', 'Vivienda unifamiliar', true, '2025-01-14 21:07:25.968', '2025-01-14 21:07:25.968'),
('clyqxs24z001jsvxlmgrmzvur', 'Departamento', 'Unidad en edificio', true, '2025-01-14 21:07:25.968', '2025-01-14 21:07:25.968'),
('clyqxs24z001ksvxlgnkzsrvi', 'Terreno', 'Lote baldío', true, '2025-01-14 21:07:25.968', '2025-01-14 21:07:25.968'),
('clyqxs24z001lsvxlqjsvzmsx', 'Local Comercial', 'Espacio para comercio', true, '2025-01-14 21:07:25.968', '2025-01-14 21:07:25.968'),
('clyqxs24z001msvxlagvnlqnb', 'Oficina', 'Espacio de trabajo', true, '2025-01-14 21:07:25.968', '2025-01-14 21:07:25.968'),
('clyqxs24z001nsvxlsqmtgmxq', 'Cochera', 'Espacio para vehículo', true, '2025-01-14 21:07:25.968', '2025-01-14 21:07:25.968'),
('clyqxs24z001osvxlhgvvdmnw', 'Galpón', 'Espacio industrial', true, '2025-01-14 21:07:25.968', '2025-01-14 21:07:25.968'),
('clyqxs24z001psvxlkymovtkl', 'Quinta', 'Propiedad rural pequeña', true, '2025-01-14 21:07:25.968', '2025-01-14 21:07:25.968'),
('clyqxs24z001qsvxllvusqnxz', 'Campo', 'Propiedad rural grande', true, '2025-01-14 21:07:25.968', '2025-01-14 21:07:25.968')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. INSERT USERS
-- =====================================================
INSERT INTO "User" ("id", "email", "password", "name", "role", "isActive", "avatar", "phone", "twoFactorEnabled", "twoFactorSecret", "createdAt", "updatedAt")
VALUES 
('clyqxucv0001rsvxlgrmzvuyn', 'admin@mahler.com', '$2a$10$cXDRMQrN3lBfUgWCIv/QkevS7m/fGSM3z2zrpQRQ9wR9yPo0nQRz.', 'Diego Lucchelli', 'ADMIN', true, NULL, NULL, false, NULL, '2025-01-14 21:09:25.528', '2025-01-14 21:09:25.528')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. INSERT OWNERS
-- =====================================================
INSERT INTO "Owner" ("id", "name", "email", "phone", "secondaryPhone", "address", "countryId", "provinceId", "cityId", "taxId", "idNumber", "notes", "isActive", "createdAt", "updatedAt")
VALUES 
('clyqxx7gi001ssvxlzsruhqjt', 'Juan Pérez', 'juan.perez@email.com', '+54 351 123-4567', NULL, 'Av. Colón 123', 'clyqxm3uy0000svxl6d4vgxwz', 'clyqxnrdy0001svxllsqsqhim', 'clyqxp7si0003svxldecrkpxe', '20-12345678-9', '12345678', NULL, true, '2025-01-14 21:11:44.582', '2025-01-14 21:11:44.582'),
('clyqxxg3c001tsvxlmrwagvzk', 'María González', 'maria.gonzalez@email.com', '+54 351 234-5678', '+54 351 234-5679', 'Bv. San Juan 456', 'clyqxm3uy0000svxl6d4vgxwz', 'clyqxnrdy0001svxllsqsqhim', 'clyqxp7si0003svxldecrkpxe', '27-23456789-0', '23456789', 'Propietaria de varios inmuebles en Nueva Córdoba', true, '2025-01-14 21:11:53.96', '2025-01-14 21:11:53.96')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. INSERT CLIENTS
-- =====================================================
INSERT INTO "Client" ("id", "name", "email", "phone", "secondaryPhone", "address", "countryId", "provinceId", "cityId", "occupation", "budget", "preferredTransactionType", "preferredPropertyTypeId", "source", "notes", "isActive", "createdAt", "updatedAt")
VALUES 
('clyqxyl9g001usvxlqmxagvno', 'Roberto Silva', 'roberto.silva@email.com', '+54 351 345-6789', NULL, 'Av. Vélez Sarsfield 789', 'clyqxm3uy0000svxl6d4vgxwz', 'clyqxnrdy0001svxllsqsqhim', 'clyqxp7si0003svxldecrkpxe', 'Ingeniero', 150000, 'PURCHASE', 'clyqxs24z001isvxluztpcahb', 'Referido', 'Busca casa en zona norte', true, '2025-01-14 21:13:09.5', '2025-01-14 21:13:09.5'),
('clyqxytpf001vsvxlhgvzemny', 'Ana Martínez', 'ana.martinez@email.com', '+54 351 456-7890', '+54 351 456-7891', 'Calle 27 de Abril 321', 'clyqxm3uy0000svxl6d4vgxwz', 'clyqxnrdy0001svxllsqsqhim', 'clyqxp7si0003svxldecrkpxe', 'Arquitecta', 80000, 'RENT', 'clyqxs24z001jsvxlmgrmzvur', 'Web', 'Interesada en departamento 2 ambientes', true, '2025-01-14 21:13:18.559', '2025-01-14 21:13:18.559')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 9. INSERT PROPERTIES
-- =====================================================
INSERT INTO "Property" ("id", "title", "description", "propertyTypeId", "transactionType", "status", "price", "currency", "area", "bedrooms", "bathrooms", "parkingSpaces", "address", "countryId", "provinceId", "cityId", "neighborhoodId", "zipCode", "latitude", "longitude", "ownerId", "createdById", "published", "views", "images", "videos", "features", "amenities", "yearBuilt", "lotSize", "pricePerM2", "rentalPrice", "rentalPeriod", "virtualTour", "syncToWordPress", "wordpressId", "syncedAt", "propertyLabel", "adrema", "createdAt", "updatedAt")
VALUES 
('clyqy1c08001wsvxlsqmsgmxr', 'Casa en Nueva Córdoba', 'Hermosa casa de 3 dormitorios en el corazón de Nueva Córdoba', 'clyqxs24z001isvxluztpcahb', 'SALE', 'AVAILABLE', 180000, 'USD', 150, 3, 2, 1, 'Av. Hipólito Yrigoyen 500', 'clyqxm3uy0000svxl6d4vgxwz', 'clyqxnrdy0001svxllsqsqhim', 'clyqxp7si0003svxldecrkpxe', 'clyqxqkgx000xsvxlsobnqvze', '5000', -31.4201, -64.1888, 'clyqxx7gi001ssvxlzsruhqjt', 'clyqxucv0001rsvxlgrmzvuyn', true, 0, ARRAY[]::text[], ARRAY[]::text[], ARRAY['Patio', 'Parrilla', 'Cocina integrada']::text[], ARRAY['Calefacción', 'Aire acondicionado']::text[], 2015, 200, 1200, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, '2025-01-14 21:15:29.96', '2025-01-14 21:15:29.96'),
('clyqy1vpd001xsvxlhgvvemnx', 'Departamento en Cerro de las Rosas', 'Moderno departamento de 2 dormitorios con excelente vista', 'clyqxs24z001jsvxlmgrmzvur', 'RENT', 'AVAILABLE', 500, 'USD', 75, 2, 1, 1, 'Rafael Núñez 3500', 'clyqxm3uy0000svxl6d4vgxwz', 'clyqxnrdy0001svxllsqsqhim', 'clyqxp7si0003svxldecrkpxe', 'clyqxqkgx000ysvxlhzrsitma', '5009', -31.3813, -64.2382, 'clyqxxg3c001tsvxlmrwagvzk', 'clyqxucv0001rsvxlgrmzvuyn', true, 0, ARRAY[]::text[], ARRAY[]::text[], ARRAY['Balcón', 'Living-comedor']::text[], ARRAY['Sum', 'Pileta', 'Seguridad']::text[], 2020, NULL, NULL, 500, 'MONTHLY', NULL, false, NULL, NULL, NULL, NULL, '2025-01-14 21:15:51.741', '2025-01-14 21:15:51.741'),
('clyqy2gj5001ysvxlkymovukm', 'Terreno en General Paz', 'Terreno ideal para construcción en zona residencial', 'clyqxs24z001ksvxlgnkzsrvi', 'SALE', 'AVAILABLE', 50000, 'USD', NULL, NULL, NULL, NULL, 'Calle Pública s/n', 'clyqxm3uy0000svxl6d4vgxwz', 'clyqxnrdy0001svxllsqsqhim', 'clyqxp7si0003svxldecrkpxe', 'clyqxqkgx000zsvxlmgqznuzq', '5147', -31.3504, -64.2563, 'clyqxx7gi001ssvxlzsruhqjt', 'clyqxucv0001rsvxlgrmzvuyn', true, 0, ARRAY[]::text[], ARRAY[]::text[], ARRAY['Esquina', 'Servicios cercanos']::text[], ARRAY[]::text[], NULL, 300, 166.67, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, '2025-01-14 21:16:14.513', '2025-01-14 21:16:14.513'),
('clyqy2xod001zsvxllvusrnxz', 'Local Comercial en Centro', 'Amplio local comercial sobre avenida principal', 'clyqxs24z001lsvxlqjsvzmsx', 'RENT', 'AVAILABLE', 1500, 'USD', 120, NULL, 2, NULL, 'Av. Colón 800', 'clyqxm3uy0000svxl6d4vgxwz', 'clyqxnrdy0001svxllsqsqhim', 'clyqxp7si0003svxldecrkpxe', 'clyqxqkgx001asvxlvjqwqrro', '5000', -31.4173, -64.1839, 'clyqxxg3c001tsvxlmrwagvzk', 'clyqxucv0001rsvxlgrmzvuyn', true, 0, ARRAY[]::text[], ARRAY[]::text[], ARRAY['Vidriera', 'Baño privado', 'Depósito']::text[], ARRAY['Aire acondicionado']::text[], 2010, NULL, NULL, 1500, 'MONTHLY', NULL, false, NULL, NULL, NULL, NULL, '2025-01-14 21:16:32.673', '2025-01-14 21:16:32.673')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 10. INSERT APPOINTMENTS
-- =====================================================
INSERT INTO "Appointment" ("id", "clientId", "propertyId", "agentId", "scheduledAt", "duration", "status", "notes", "reminderSent", "createdAt", "updatedAt")
VALUES 
('clyqy4jxm0020svxlojqnzsbd', 'clyqxyl9g001usvxlqmxagvno', 'clyqy1c08001wsvxlsqmsgmxr', 'clyqxucv0001rsvxlgrmzvuyn', '2025-01-20 10:00:00', 60, 'SCHEDULED', 'Primera visita - mostrar patio y parrilla', false, '2025-01-14 21:18:28.706', '2025-01-14 21:18:28.706'),
('clyqy52xw0021svxlyqlmnsnz', 'clyqxytpf001vsvxlhgvzemny', 'clyqy1vpd001xsvxlhgvvemnx', 'clyqxucv0001rsvxlgrmzvuyn', '2025-01-21 15:30:00', 45, 'SCHEDULED', 'Interesada en alquilar', false, '2025-01-14 21:18:50.736', '2025-01-14 21:18:50.736')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'MIGRATION SUMMARY';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Countries: %', (SELECT COUNT(*) FROM "Country");
    RAISE NOTICE 'Provinces: %', (SELECT COUNT(*) FROM "Province");
    RAISE NOTICE 'Cities: %', (SELECT COUNT(*) FROM "City");
    RAISE NOTICE 'Neighborhoods: %', (SELECT COUNT(*) FROM "Neighborhood");
    RAISE NOTICE 'Property Types: %', (SELECT COUNT(*) FROM "PropertyType");
    RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM "User");
    RAISE NOTICE 'Owners: %', (SELECT COUNT(*) FROM "Owner");
    RAISE NOTICE 'Clients: %', (SELECT COUNT(*) FROM "Client");
    RAISE NOTICE 'Properties: %', (SELECT COUNT(*) FROM "Property");
    RAISE NOTICE 'Appointments: %', (SELECT COUNT(*) FROM "Appointment");
    RAISE NOTICE '==============================================';
END $$;
