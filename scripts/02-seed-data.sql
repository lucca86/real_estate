-- Seed Countries
INSERT INTO "Country" ("id", "name", "code") VALUES
('country_ar', 'Argentina', 'AR'),
('country_br', 'Brasil', 'BR'),
('country_uy', 'Uruguay', 'UY'),
('country_py', 'Paraguay', 'PY');

-- Seed Provinces for Argentina
INSERT INTO "Province" ("id", "name", "countryId") VALUES
('province_corrientes', 'Corrientes', 'country_ar'),
('province_chaco', 'Chaco', 'country_ar'),
('province_misiones', 'Misiones', 'country_ar'),
('province_buenosaires', 'Buenos Aires', 'country_ar');

-- Seed Cities for Corrientes
INSERT INTO "City" ("id", "name", "provinceId") VALUES
('city_corrientes', 'Corrientes Capital', 'province_corrientes'),
('city_goya', 'Goya', 'province_corrientes'),
('city_curuzu', 'Curuzú Cuatiá', 'province_corrientes'),
('city_paso', 'Paso de los Libres', 'province_corrientes');

-- Seed Cities for Chaco
INSERT INTO "City" ("id", "name", "provinceId") VALUES
('city_resistencia', 'Resistencia', 'province_chaco'),
('city_barranqueras', 'Barranqueras', 'province_chaco');

-- Seed Neighborhoods for Corrientes Capital
INSERT INTO "Neighborhood" ("id", "name", "cityId") VALUES
('neighborhood_centro', 'Centro', 'city_corrientes'),
('neighborhood_mburucuya', 'Mburucuyá', 'city_corrientes'),
('neighborhood_500viviendas', '500 Viviendas', 'city_corrientes'),
('neighborhood_pirayui', 'Pirayuí', 'city_corrientes'),
('neighborhood_san_benito', 'San Benito', 'city_corrientes'),
('neighborhood_laguna_brava', 'Laguna Brava', 'city_corrientes');

-- Seed Property Types
INSERT INTO "PropertyType" ("id", "name", "description") VALUES
('type_casa', 'Casa', 'Casa unifamiliar'),
('type_departamento', 'Departamento', 'Departamento o apartamento'),
('type_terreno', 'Terreno', 'Lote o terreno baldío'),
('type_local', 'Local Comercial', 'Local para comercio'),
('type_oficina', 'Oficina', 'Oficina comercial'),
('type_galpon', 'Galpón', 'Galpón industrial o depósito'),
('type_campo', 'Campo', 'Campo o establecimiento rural'),
('type_quinta', 'Quinta', 'Quinta o casa de campo');

-- Seed Admin User (password: admin123)
INSERT INTO "User" ("id", "email", "name", "password", "role") VALUES
('user_admin', 'admin@mahler.com', 'Administrador', '$2a$10$rXKX7jXlEzQj0GxYxYxYxepXKX7jXlEzQj0GxYxYxYxe', 'ADMIN');

-- Seed Sample Owner
INSERT INTO "Owner" ("id", "name", "email", "phone", "cityId", "provinceId", "countryId") VALUES
('owner_jose', 'José Propietario', 'jose@example.com', '+54 379 4123456', 'city_corrientes', 'province_corrientes', 'country_ar');

-- Seed Sample Client
INSERT INTO "Client" ("id", "name", "email", "phone", "preferredPropertyTypeId", "preferredTransactionType", "cityId", "provinceId", "countryId") VALUES
('client_maria', 'María Cliente', 'maria@example.com', '+54 379 4654321', 'type_casa', 'VENTA', 'city_corrientes', 'province_corrientes', 'country_ar');
