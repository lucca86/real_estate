/*
 Navicat Premium Dump SQL

 Source Server         : localhost
 Source Server Type    : PostgreSQL
 Source Server Version : 140005 (140005)
 Source Host           : localhost:5432
 Source Catalog        : real_state_db
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 140005 (140005)
 File Encoding         : 65001

 Date: 14/11/2025 16:24:25
*/


-- ----------------------------
-- Type structure for AppointmentStatus
-- ----------------------------
DROP TYPE IF EXISTS "public"."AppointmentStatus";
CREATE TYPE "public"."AppointmentStatus" AS ENUM (
  'PENDIENTE',
  'CONFIRMADA',
  'COMPLETADA',
  'CANCELADA'
);

-- ----------------------------
-- Type structure for PropertyLabel
-- ----------------------------
DROP TYPE IF EXISTS "public"."PropertyLabel";
CREATE TYPE "public"."PropertyLabel" AS ENUM (
  'NUEVA',
  'DESTACADA',
  'REBAJADA'
);

-- ----------------------------
-- Type structure for PropertyStatus
-- ----------------------------
DROP TYPE IF EXISTS "public"."PropertyStatus";
CREATE TYPE "public"."PropertyStatus" AS ENUM (
  'ACTIVO',
  'ALQUILADO',
  'VENDIDO',
  'ELIMINADO',
  'RESERVADO',
  'EN_REVISION'
);

-- ----------------------------
-- Type structure for RentalPeriod
-- ----------------------------
DROP TYPE IF EXISTS "public"."RentalPeriod";
CREATE TYPE "public"."RentalPeriod" AS ENUM (
  'MENSUAL',
  'SEMANAL',
  'DIARIO'
);

-- ----------------------------
-- Type structure for TransactionType
-- ----------------------------
DROP TYPE IF EXISTS "public"."TransactionType";
CREATE TYPE "public"."TransactionType" AS ENUM (
  'VENTA',
  'ALQUILER',
  'VENTA_ALQUILER',
  'ALQUILER_OPCION_COMPRA'
);

-- ----------------------------
-- Type structure for UserRole
-- ----------------------------
DROP TYPE IF EXISTS "public"."UserRole";
CREATE TYPE "public"."UserRole" AS ENUM (
  'ADMIN',
  'SUPERVISOR',
  'VENDEDOR'
);

-- ----------------------------
-- Table structure for Appointment
-- ----------------------------
DROP TABLE IF EXISTS "public"."Appointment";
CREATE TABLE "public"."Appointment" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "propertyId" text COLLATE "pg_catalog"."default" NOT NULL,
  "clientId" text COLLATE "pg_catalog"."default" NOT NULL,
  "agentId" text COLLATE "pg_catalog"."default" NOT NULL,
  "scheduledAt" timestamp(3) NOT NULL,
  "duration" int4 NOT NULL DEFAULT 60,
  "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'PENDIENTE'::"AppointmentStatus",
  "notes" text COLLATE "pg_catalog"."default",
  "reminderSent" bool NOT NULL DEFAULT false,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of Appointment
-- ----------------------------
INSERT INTO "public"."Appointment" VALUES ('cmh6cs3pt0001p41ox6cz967p', 'cmh2csgpq0001p4h0klw2nc4t', 'cmh649ggq0000p4ssnwlyu67q', 'cmh2bi85u0000p46w9z4w0g6i', '2025-10-28 12:00:00', 60, 'PENDIENTE', 'Esta es otra prueba', 'f', '2025-10-25 14:06:13.457', '2025-10-25 14:06:13.457');
INSERT INTO "public"."Appointment" VALUES ('cmh64ohmd0002p4ssw1plx2bk', 'cmh3hny9r0001p4jckmljv237', 'cmh649ggq0000p4ssnwlyu67q', 'cmh2bi85u0000p46w9z4w0g6i', '2025-10-25 13:30:00', 45, 'COMPLETADA', 'Prefiere ver otras propiedades', 'f', '2025-10-25 10:19:27.922', '2025-10-27 19:00:05.292');

-- ----------------------------
-- Table structure for City
-- ----------------------------
DROP TABLE IF EXISTS "public"."City";
CREATE TABLE "public"."City" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "provinceId" text COLLATE "pg_catalog"."default" NOT NULL,
  "isActive" bool NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of City
-- ----------------------------
INSERT INTO "public"."City" VALUES ('city_corrientes_capital', 'Corrientes', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_goya', 'Goya', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_paso_libres', 'Paso de los Libres', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_curuzu_cuatia', 'Curuzú Cuatiá', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_bella_vista', 'Bella Vista', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_esquina', 'Esquina', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_mercedes', 'Mercedes', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_monte_caseros', 'Monte Caseros', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_santo_tome', 'Santo Tomé', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_ituzaingo', 'Ituzaingó', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_alvear', 'Alvear', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_empedrado', 'Empedrado', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_saladas', 'Saladas', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_mburucuya', 'Mburucuyá', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_san_roque', 'San Roque', 'province_corrientes', 't', '2025-10-31 07:14:06.347', '2025-10-31 07:14:06.347');
INSERT INTO "public"."City" VALUES ('city_resistencia', 'Resistencia', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_saenz_pena', 'Presidencia Roque Sáenz Peña', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_villa_angela', 'Villa Ángela', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_charata', 'Charata', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_general_pinedo', 'General José de San Martín', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_quitilipi', 'Quitilipi', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_barranqueras', 'Barranqueras', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_fontana', 'Fontana', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_las_brenas', 'Las Breñas', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_machagai', 'Machagai', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_castelli', 'Juan José Castelli', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_villa_berthet', 'Villa Berthet', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_hermoso_campo', 'Hermoso Campo', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_corzuela', 'Corzuela', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_tres_isletas', 'Tres Isletas', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_pampa_del_infierno', 'Pampa del Infierno', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_presidencia_plaza', 'Presidencia de la Plaza', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_puerto_vilelas', 'Puerto Vilelas', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_la_leonesa', 'La Leonesa', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."City" VALUES ('city_general_pinedo_2', 'General Pinedo', 'province_chaco', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');

-- ----------------------------
-- Table structure for Client
-- ----------------------------
DROP TABLE IF EXISTS "public"."Client";
CREATE TABLE "public"."Client" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "email" text COLLATE "pg_catalog"."default" NOT NULL,
  "phone" text COLLATE "pg_catalog"."default" NOT NULL,
  "secondaryPhone" text COLLATE "pg_catalog"."default",
  "address" text COLLATE "pg_catalog"."default",
  "occupation" text COLLATE "pg_catalog"."default",
  "budget" float8,
  "preferredTransactionType" "public"."TransactionType",
  "notes" text COLLATE "pg_catalog"."default",
  "source" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "preferredPropertyTypeId" text COLLATE "pg_catalog"."default",
  "cityId" text COLLATE "pg_catalog"."default",
  "countryId" text COLLATE "pg_catalog"."default",
  "provinceId" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of Client
-- ----------------------------
INSERT INTO "public"."Client" VALUES ('cmh5ez7sa0001p42g8qwdi598', 'Pedro Cliente', 'pedro@cliente.com', '379-985141321', '', 'Calle del cliente 549', 'Licenciado en Informática', 900, 'ALQUILER', 'No se que poner en las notas', 'Web', 't', '2025-10-24 22:19:58.378', '2025-10-24 22:19:58.378', NULL, NULL, NULL, NULL);
INSERT INTO "public"."Client" VALUES ('cmh649ggq0000p4ssnwlyu67q', 'Lucca Lens', 'lucc86@gmail.com', '379121212', '', 'Calle nueva 2114', 'Estudiante', 800, 'ALQUILER', 'Nuevas notas', 'Web', 't', '2025-10-25 10:07:46.586', '2025-10-25 10:07:46.586', NULL, NULL, NULL, NULL);

-- ----------------------------
-- Table structure for Country
-- ----------------------------
DROP TABLE IF EXISTS "public"."Country";
CREATE TABLE "public"."Country" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "isActive" bool NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of Country
-- ----------------------------
INSERT INTO "public"."Country" VALUES ('country_argentina', 'Argentina', 'AR', 't', '2025-10-31 07:14:06.34', '2025-10-31 07:14:06.34');

-- ----------------------------
-- Table structure for Neighborhood
-- ----------------------------
DROP TABLE IF EXISTS "public"."Neighborhood";
CREATE TABLE "public"."Neighborhood" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "cityId" text COLLATE "pg_catalog"."default" NOT NULL,
  "isActive" bool NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of Neighborhood
-- ----------------------------
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_centro_ctes', 'Centro', 'city_corrientes_capital', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_san_benito', 'San Benito', 'city_corrientes_capital', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_500_viviendas', '500 Viviendas', 'city_corrientes_capital', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_laguna_brava', 'Laguna Brava', 'city_corrientes_capital', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_san_martin', 'San Martín', 'city_corrientes_capital', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_belgrano', 'Belgrano', 'city_corrientes_capital', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_molina_punta', 'Molina Punta', 'city_corrientes_capital', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_santa_catalina', 'Santa Catalina', 'city_corrientes_capital', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_yapeyú', 'Yapeyú', 'city_corrientes_capital', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_arazaty', 'Arazaty', 'city_corrientes_capital', 't', '2025-10-31 07:14:06.35', '2025-10-31 07:14:06.35');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_centro_res', 'Centro', 'city_resistencia', 't', '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_villa_don_alberto', 'Villa Don Alberto', 'city_resistencia', 't', '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_villa_rio_negro', 'Villa Río Negro', 'city_resistencia', 't', '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_villa_libertad', 'Villa Libertad', 'city_resistencia', 't', '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_villa_prosperidad', 'Villa Prosperidad', 'city_resistencia', 't', '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_barrio_frances', 'Barrio Francés', 'city_resistencia', 't', '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_villa_italia', 'Villa Italia', 'city_resistencia', 't', '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_villa_centenario', 'Villa Centenario', 'city_resistencia', 't', '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_toba', 'Toba', 'city_resistencia', 't', '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352');
INSERT INTO "public"."Neighborhood" VALUES ('neighborhood_san_cayetano', 'San Cayetano', 'city_resistencia', 't', '2025-10-31 07:14:06.352', '2025-10-31 07:14:06.352');
INSERT INTO "public"."Neighborhood" VALUES ('cmhjg2mvd0003p4fwqvfnn17c', 'Luz y Fuerza', 'city_corrientes_capital', 't', '2025-11-03 17:59:23.977', '2025-11-03 17:59:23.977');

-- ----------------------------
-- Table structure for Owner
-- ----------------------------
DROP TABLE IF EXISTS "public"."Owner";
CREATE TABLE "public"."Owner" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "email" text COLLATE "pg_catalog"."default" NOT NULL,
  "phone" text COLLATE "pg_catalog"."default" NOT NULL,
  "secondaryPhone" text COLLATE "pg_catalog"."default",
  "address" text COLLATE "pg_catalog"."default",
  "idNumber" text COLLATE "pg_catalog"."default",
  "taxId" text COLLATE "pg_catalog"."default",
  "notes" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "cityId" text COLLATE "pg_catalog"."default",
  "countryId" text COLLATE "pg_catalog"."default",
  "provinceId" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of Owner
-- ----------------------------
INSERT INTO "public"."Owner" VALUES ('cmh5epngu0000p42gwzcrk5b2', 'José propietario', 'jose@propietario.com', '379-124856313', '', 'Calle de su casa 875', '12.125.658', '', '', 't', '2025-10-24 22:12:32.107', '2025-10-24 22:12:32.107', NULL, NULL, NULL);
INSERT INTO "public"."Owner" VALUES ('cmhan82he0000p4q8rmcjmbtv', 'Julio Rodriguez', 'julio@rodriguez.com', '123456798', NULL, NULL, NULL, NULL, NULL, 'f', '2025-10-28 14:09:39.218', '2025-10-28 14:09:39.218', NULL, NULL, NULL);

-- ----------------------------
-- Table structure for Property
-- ----------------------------
DROP TABLE IF EXISTS "public"."Property";
CREATE TABLE "public"."Property" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "title" text COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default" NOT NULL,
  "transactionType" "public"."TransactionType" NOT NULL,
  "status" "public"."PropertyStatus" NOT NULL DEFAULT 'ACTIVO'::"PropertyStatus",
  "address" text COLLATE "pg_catalog"."default" NOT NULL,
  "zipCode" text COLLATE "pg_catalog"."default",
  "latitude" float8,
  "longitude" float8,
  "bedrooms" int4,
  "bathrooms" int4,
  "parkingSpaces" int4,
  "area" float8 NOT NULL,
  "lotSize" float8,
  "yearBuilt" int4,
  "price" float8 NOT NULL,
  "pricePerM2" float8,
  "rentalPrice" float8,
  "currency" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'USD'::text,
  "features" text[] COLLATE "pg_catalog"."default",
  "amenities" text[] COLLATE "pg_catalog"."default",
  "images" text[] COLLATE "pg_catalog"."default",
  "videos" text[] COLLATE "pg_catalog"."default",
  "virtualTour" text COLLATE "pg_catalog"."default",
  "wordpressId" int4,
  "syncedAt" timestamp(3),
  "views" int4 NOT NULL DEFAULT 0,
  "published" bool NOT NULL DEFAULT true,
  "createdById" text COLLATE "pg_catalog"."default" NOT NULL,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "ownerId" text COLLATE "pg_catalog"."default",
  "propertyTypeId" text COLLATE "pg_catalog"."default",
  "adrema" text COLLATE "pg_catalog"."default",
  "cityId" text COLLATE "pg_catalog"."default",
  "countryId" text COLLATE "pg_catalog"."default",
  "neighborhoodId" text COLLATE "pg_catalog"."default",
  "provinceId" text COLLATE "pg_catalog"."default",
  "rentalPeriod" "public"."RentalPeriod",
  "propertyLabel" "public"."PropertyLabel",
  "syncToWordPress" bool NOT NULL DEFAULT true
)
;

-- ----------------------------
-- Records of Property
-- ----------------------------
INSERT INTO "public"."Property" VALUES ('cmhajo5dd0000p4fg97p2509h', 'Casa Impecable en Corrientes, Corrientes - 3 Hab.', 'Aquí se debe colocar la descripción', 'VENTA', 'ACTIVO', 'Rivadavia 1970', '3400', -27.4754409, -58.8265158, NULL, NULL, NULL, 78, 110, NULL, 120000, 1538.461538461539, NULL, 'USD', '{Parrilla,Quincho}', '{"Mesa de Ping Pong",Pileta}', '{https://imgix.cosentino.com/es/wp-content/uploads/2023/07/Lumire-70-Facade-MtWaverley-vic-1.jpg?auto=format%2Ccompress&ixlib=php-3.3.0&w=1800}', '{}', NULL, 2258, '2025-11-08 11:09:02.844', 0, 't', 'cmh2bi85u0000p46w9z4w0g6i', '2025-10-28 12:30:10.989', '2025-11-08 11:09:02.848', 'cmh5epngu0000p42gwzcrk5b2', 'cmh83rnmw0000p4xclfja57is', 'A112545', 'city_corrientes_capital', 'country_argentina', 'neighborhood_centro_ctes', 'province_corrientes', NULL, 'NUEVA', 't');
INSERT INTO "public"."Property" VALUES ('cmh2c6uk90003p4rg9l9m7ihy', 'Amplia casa en barrio centrico', 'Descripción de la casa', 'VENTA', 'ACTIVO', 'Tte. Cnel. Cundom 1460', 'w3400', -27.48628, -58.83465, 4, 3, 2, 180, 246, 1969, 150000, 833.3333333333334, NULL, 'USD', '{Piscina,Jardín,Quincho}', '{Gimnasio,"Cancha de tenis","Mesa de Pool",Cine}', '{https://i.pinimg.com/1200x/9d/b4/56/9db456f6fc588802ee6ae3f53a7d2f1b.jpg}', '{}', NULL, 2260, '2025-11-08 11:09:09.573', 6, 't', 'cmh2bi85u0000p46w9z4w0g6i', '2025-10-22 18:38:37.114', '2025-11-08 11:09:09.577', 'cmh5epngu0000p42gwzcrk5b2', 'cmh83rnmw0000p4xclfja57is', NULL, 'city_corrientes_capital', 'country_argentina', 'neighborhood_centro_ctes', 'province_corrientes', NULL, 'DESTACADA', 't');
INSERT INTO "public"."Property" VALUES ('cmh3hny9r0001p4jckmljv237', 'Casa de prueba', 'Con descripción', 'VENTA', 'ACTIVO', 'AV RIO CHICO 3525', '3400', -27.4610486, -58.787524, 4, 2, NULL, 140, 200, 2020, 150230, 1073.071428571429, 1100, 'USD', '{Jardin}', '{Gimnasio}', '{https://nuevo.mahlerpropiedades.com.ar/wp-content/uploads/2025/10/1-3.jpg,https://nuevo.mahlerpropiedades.com.ar/wp-content/uploads/2025/10/2-3.jpg}', '{}', NULL, 2256, '2025-11-08 11:08:57.935', 3, 't', 'cmh2bi85u0000p46w9z4w0g6i', '2025-10-23 13:59:39.327', '2025-11-08 14:29:03.219', 'cmh5epngu0000p42gwzcrk5b2', 'cmh83rnmw0000p4xclfja57is', NULL, 'city_corrientes_capital', 'country_argentina', 'neighborhood_belgrano', 'province_corrientes', NULL, NULL, 't');
INSERT INTO "public"."Property" VALUES ('cmh2csgpq0001p4h0klw2nc4t', 'Hermosa casa en barrio privado', 'Descripción de la casa', 'ALQUILER', 'ACTIVO', 'Paraguay 860', 'w3400', -27.4679809, -58.8266259, 4, 2, 1, 160, 300, 2020, 220000, 1375, 1200, 'USD', '{Piscina,Jardín}', '{Gimnasio,"Cancha de tenis","Mesa de Pool"}', '{https://major.estatik.net/wp-content/uploads/2022/11/pexels-photo-3958954-min-1-300x200.jpeg,https://major.estatik.net/wp-content/uploads/2022/11/pexels-photo-5071144-min-300x200.jpeg,https://major.estatik.net/wp-content/uploads/2022/11/pexels-photo-7546721-2-min-300x200.jpeg}', '{}', NULL, 2264, '2025-11-08 11:09:07.012', 14, 'f', 'cmh2bi85u0000p46w9z4w0g6i', '2025-10-22 18:55:25.598', '2025-11-08 14:30:06.462', 'cmh5epngu0000p42gwzcrk5b2', 'cmh83rnmw0000p4xclfja57is', 'A1-2356', 'city_corrientes_capital', 'country_argentina', 'neighborhood_belgrano', 'province_corrientes', NULL, 'NUEVA', 't');

-- ----------------------------
-- Table structure for PropertyType
-- ----------------------------
DROP TABLE IF EXISTS "public"."PropertyType";
CREATE TABLE "public"."PropertyType" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of PropertyType
-- ----------------------------
INSERT INTO "public"."PropertyType" VALUES ('cmh84pfp60002p46wc4dp8q79', 'Barrio Privado', '', 't', '2025-10-26 19:55:44.442', '2025-10-27 18:35:45.753');
INSERT INTO "public"."PropertyType" VALUES ('cmh84otj80000p46w89h6yqxz', 'Campo', '', 't', '2025-10-26 19:55:15.716', '2025-10-27 18:35:56.275');
INSERT INTO "public"."PropertyType" VALUES ('cmh83rnmw0000p4xclfja57is', 'Casa', 'Casa unifamiliar', 't', '2025-10-26 19:29:28.424', '2025-10-27 18:36:05.029');
INSERT INTO "public"."PropertyType" VALUES ('cmh83rnnf0001p4xcinah5tvh', 'Departamento', 'Apartamento o departamento', 't', '2025-10-26 19:29:28.444', '2025-10-27 18:36:15.353');
INSERT INTO "public"."PropertyType" VALUES ('cmh83rnnv0005p4xc2f5598qy', 'Galpón', 'Galpón', 't', '2025-10-26 19:29:28.459', '2025-10-27 18:36:27.094');
INSERT INTO "public"."PropertyType" VALUES ('cmh83rnnq0003p4xcakdy65vh', 'Local Comercial', 'Local comercial', 't', '2025-10-26 19:29:28.454', '2025-10-27 18:36:39.448');
INSERT INTO "public"."PropertyType" VALUES ('cmh84ozz70001p46wqbeg6he4', 'Loteo', '', 't', '2025-10-26 19:55:24.067', '2025-10-27 18:36:48.285');
INSERT INTO "public"."PropertyType" VALUES ('cmh83rnnt0004p4xchqjc3ih6', 'Oficina', 'Oficina', 't', '2025-10-26 19:29:28.457', '2025-10-27 18:36:56.476');
INSERT INTO "public"."PropertyType" VALUES ('cmh83rnnk0002p4xcfrluu4dl', 'Terreno', 'Terreno o lote', 't', '2025-10-26 19:29:28.448', '2025-10-27 18:37:07.046');

-- ----------------------------
-- Table structure for Province
-- ----------------------------
DROP TABLE IF EXISTS "public"."Province";
CREATE TABLE "public"."Province" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "countryId" text COLLATE "pg_catalog"."default" NOT NULL,
  "isActive" bool NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of Province
-- ----------------------------
INSERT INTO "public"."Province" VALUES ('province_corrientes', 'Corrientes', 'country_argentina', 't', '2025-10-31 07:14:06.343', '2025-10-31 07:14:06.343');
INSERT INTO "public"."Province" VALUES ('province_chaco', 'Chaco', 'country_argentina', 't', '2025-10-31 07:14:06.343', '2025-10-31 07:14:06.343');

-- ----------------------------
-- Table structure for Session
-- ----------------------------
DROP TABLE IF EXISTS "public"."Session";
CREATE TABLE "public"."Session" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "userId" text COLLATE "pg_catalog"."default" NOT NULL,
  "token" text COLLATE "pg_catalog"."default" NOT NULL,
  "expiresAt" timestamp(3) NOT NULL,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of Session
-- ----------------------------
INSERT INTO "public"."Session" VALUES ('cmh2hbcoa0001p4l006vd634p', 'cmh2bi85u0000p46w9z4w0g6i', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbWgyYmk4NXUwMDAwcDQ2dzl6NHcwZzZpIiwiZXhwIjoxNzYxNzcxNzI1fQ.Hmir6ZJ3JoYaA1IcHAKiRZ2UPSc-vmQ_1BDV1SRwqKU', '2025-10-29 21:02:05.288', '2025-10-22 21:02:05.29');
INSERT INTO "public"."Session" VALUES ('cmh82bwkm0001p43wrzq445w0', 'cmh2bi85u0000p46w9z4w0g6i', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbWgyYmk4NXUwMDAwcDQ2dzl6NHcwZzZpIiwiZXhwIjoxNzYyMTA5MzUzfQ.WXeAfZpuFrDiwsGiXtNdnsPVSJsf4GujNQw6LF8TBYk', '2025-11-02 18:49:13.892', '2025-10-26 18:49:13.895');
INSERT INTO "public"."Session" VALUES ('cmh9gjhm70001p41o89qeogod', 'cmh2bi85u0000p46w9z4w0g6i', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbWgyYmk4NXUwMDAwcDQ2dzl6NHcwZzZpIiwiZXhwIjoxNzYyMTkzNjg4fQ.0HAg8FfXMjvtKqpQh7PFXXHy186RTCV_BlTgK5JHHsc', '2025-11-03 18:14:48.546', '2025-10-27 18:14:48.549');
INSERT INTO "public"."Session" VALUES ('cmhdxzznw0001p4wkcaon65va', 'cmh2bi85u0000p46w9z4w0g6i', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbWgyYmk4NXUwMDAwcDQ2dzl6NHcwZzZpIiwiZXhwIjoxNzYyNDY0ODc2fQ.yZSZl3kHoz4Jn1lY4kswSCaAkHyG0Xr5u522U54gQv8', '2025-11-06 21:34:36.617', '2025-10-30 21:34:36.62');
INSERT INTO "public"."Session" VALUES ('cmhj9ll5o0001p4fwz1yz6tt5', 'cmh2bi85u0000p46w9z4w0g6i', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbWgyYmk4NXUwMDAwcDQ2dzl6NHcwZzZpIiwiZXhwIjoxNzYyNzg2NjkwfQ.EWXR0pQldFe2DCcMuqHCRek9l3D51XmoK3Ol-pKVZ5E', '2025-11-10 14:58:10.893', '2025-11-03 14:58:10.895');
INSERT INTO "public"."Session" VALUES ('cmhuwkvel0001p458v291z4r9', 'cmh2bi85u0000p46w9z4w0g6i', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbWgyYmk4NXUwMDAwcDQ2dzl6NHcwZzZpIiwiZXhwIjoxNzYzNDkwNDE2fQ.h8OKPYWK-BUpChhCNt3jJoHSjo1K4OO_w40oPiRLuIE', '2025-11-18 18:26:56.622', '2025-11-11 18:26:56.636');

-- ----------------------------
-- Table structure for User
-- ----------------------------
DROP TABLE IF EXISTS "public"."User";
CREATE TABLE "public"."User" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "email" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "password" text COLLATE "pg_catalog"."default" NOT NULL,
  "role" "public"."UserRole" NOT NULL DEFAULT 'VENDEDOR'::"UserRole",
  "avatar" text COLLATE "pg_catalog"."default",
  "phone" text COLLATE "pg_catalog"."default",
  "twoFactorEnabled" bool NOT NULL DEFAULT false,
  "twoFactorSecret" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of User
-- ----------------------------
INSERT INTO "public"."User" VALUES ('cmh2bi85u0000p46w9z4w0g6i', 'admin@realestate.com', 'Administrador', '$2a$12$I4QFQxmyWU/buMSlDmX0F.OzbZU7YyhK0Pk1js7JaKZ/gAzwHqzza', 'ADMIN', NULL, '+1 (809) 555-0100', 'f', NULL, 't', '2025-10-22 18:19:28.334', '2025-10-22 18:19:28.334');

-- ----------------------------
-- Indexes structure for table Appointment
-- ----------------------------
CREATE INDEX "Appointment_agentId_idx" ON "public"."Appointment" USING btree (
  "agentId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Appointment_clientId_idx" ON "public"."Appointment" USING btree (
  "clientId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Appointment_propertyId_idx" ON "public"."Appointment" USING btree (
  "propertyId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Appointment_scheduledAt_idx" ON "public"."Appointment" USING btree (
  "scheduledAt" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "Appointment_status_idx" ON "public"."Appointment" USING btree (
  "status" "pg_catalog"."enum_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table Appointment
-- ----------------------------
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table City
-- ----------------------------
CREATE UNIQUE INDEX "City_name_provinceId_key" ON "public"."City" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "provinceId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "City_provinceId_idx" ON "public"."City" USING btree (
  "provinceId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table City
-- ----------------------------
ALTER TABLE "public"."City" ADD CONSTRAINT "City_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table Client
-- ----------------------------
CREATE INDEX "Client_cityId_idx" ON "public"."Client" USING btree (
  "cityId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Client_countryId_idx" ON "public"."Client" USING btree (
  "countryId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Client_email_idx" ON "public"."Client" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "Client_email_key" ON "public"."Client" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Client_phone_idx" ON "public"."Client" USING btree (
  "phone" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Client_preferredPropertyTypeId_idx" ON "public"."Client" USING btree (
  "preferredPropertyTypeId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Client_provinceId_idx" ON "public"."Client" USING btree (
  "provinceId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table Client
-- ----------------------------
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table Country
-- ----------------------------
CREATE INDEX "Country_code_idx" ON "public"."Country" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "Country_code_key" ON "public"."Country" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "Country_name_key" ON "public"."Country" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table Country
-- ----------------------------
ALTER TABLE "public"."Country" ADD CONSTRAINT "Country_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table Neighborhood
-- ----------------------------
CREATE INDEX "Neighborhood_cityId_idx" ON "public"."Neighborhood" USING btree (
  "cityId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "Neighborhood_name_cityId_key" ON "public"."Neighborhood" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "cityId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table Neighborhood
-- ----------------------------
ALTER TABLE "public"."Neighborhood" ADD CONSTRAINT "Neighborhood_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table Owner
-- ----------------------------
CREATE INDEX "Owner_cityId_idx" ON "public"."Owner" USING btree (
  "cityId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Owner_countryId_idx" ON "public"."Owner" USING btree (
  "countryId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Owner_email_idx" ON "public"."Owner" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "Owner_email_key" ON "public"."Owner" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Owner_phone_idx" ON "public"."Owner" USING btree (
  "phone" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Owner_provinceId_idx" ON "public"."Owner" USING btree (
  "provinceId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table Owner
-- ----------------------------
ALTER TABLE "public"."Owner" ADD CONSTRAINT "Owner_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table Property
-- ----------------------------
CREATE INDEX "Property_cityId_idx" ON "public"."Property" USING btree (
  "cityId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Property_countryId_idx" ON "public"."Property" USING btree (
  "countryId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Property_neighborhoodId_idx" ON "public"."Property" USING btree (
  "neighborhoodId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Property_ownerId_idx" ON "public"."Property" USING btree (
  "ownerId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Property_propertyLabel_idx" ON "public"."Property" USING btree (
  "propertyLabel" "pg_catalog"."enum_ops" ASC NULLS LAST
);
CREATE INDEX "Property_propertyTypeId_idx" ON "public"."Property" USING btree (
  "propertyTypeId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Property_provinceId_idx" ON "public"."Property" USING btree (
  "provinceId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "Property_status_idx" ON "public"."Property" USING btree (
  "status" "pg_catalog"."enum_ops" ASC NULLS LAST
);
CREATE INDEX "Property_transactionType_idx" ON "public"."Property" USING btree (
  "transactionType" "pg_catalog"."enum_ops" ASC NULLS LAST
);
CREATE INDEX "Property_wordpressId_idx" ON "public"."Property" USING btree (
  "wordpressId" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "Property_wordpressId_key" ON "public"."Property" USING btree (
  "wordpressId" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table Property
-- ----------------------------
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table PropertyType
-- ----------------------------
CREATE INDEX "PropertyType_name_idx" ON "public"."PropertyType" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "PropertyType_name_key" ON "public"."PropertyType" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table PropertyType
-- ----------------------------
ALTER TABLE "public"."PropertyType" ADD CONSTRAINT "PropertyType_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table Province
-- ----------------------------
CREATE INDEX "Province_countryId_idx" ON "public"."Province" USING btree (
  "countryId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "Province_name_countryId_key" ON "public"."Province" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "countryId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table Province
-- ----------------------------
ALTER TABLE "public"."Province" ADD CONSTRAINT "Province_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table Session
-- ----------------------------
CREATE UNIQUE INDEX "Session_token_key" ON "public"."Session" USING btree (
  "token" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table Session
-- ----------------------------
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table User
-- ----------------------------
CREATE UNIQUE INDEX "User_email_key" ON "public"."User" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table User
-- ----------------------------
ALTER TABLE "public"."User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table Appointment
-- ----------------------------
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table City
-- ----------------------------
ALTER TABLE "public"."City" ADD CONSTRAINT "City_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "public"."Province" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table Client
-- ----------------------------
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."City" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_preferredPropertyTypeId_fkey" FOREIGN KEY ("preferredPropertyTypeId") REFERENCES "public"."PropertyType" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "public"."Province" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table Neighborhood
-- ----------------------------
ALTER TABLE "public"."Neighborhood" ADD CONSTRAINT "Neighborhood_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."City" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table Owner
-- ----------------------------
ALTER TABLE "public"."Owner" ADD CONSTRAINT "Owner_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."City" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Owner" ADD CONSTRAINT "Owner_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Owner" ADD CONSTRAINT "Owner_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "public"."Province" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table Property
-- ----------------------------
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."City" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "public"."Neighborhood" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."Owner" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_propertyTypeId_fkey" FOREIGN KEY ("propertyTypeId") REFERENCES "public"."PropertyType" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "public"."Province" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table Province
-- ----------------------------
ALTER TABLE "public"."Province" ADD CONSTRAINT "Province_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."Country" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table Session
-- ----------------------------
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
