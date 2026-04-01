-- Seed script para ubicaciones de Argentina (Corrientes y Chaco)
-- Ejecutar después de aplicar el schema con: npx prisma db push

-- Limpiar datos existentes (opcional, comentar si no quieres borrar datos)
-- DELETE FROM "Neighborhood";
-- DELETE FROM "City";
-- DELETE FROM "Province";
-- DELETE FROM "Country";

-- Insertar Argentina
INSERT INTO "Country" (id, name, code, "createdAt", "updatedAt")
VALUES ('country_argentina', 'Argentina', 'AR', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Insertar Provincias
INSERT INTO "Province" (id, name, "countryId", "createdAt", "updatedAt")
VALUES 
  ('province_corrientes', 'Corrientes', 'country_argentina', NOW(), NOW()),
  ('province_chaco', 'Chaco', 'country_argentina', NOW(), NOW())
ON CONFLICT (name, "countryId") DO NOTHING;

-- Insertar Ciudades de Corrientes
INSERT INTO "City" (id, name, "provinceId", "createdAt", "updatedAt")
VALUES 
  ('city_corrientes_capital', 'Corrientes', 'province_corrientes', NOW(), NOW()),
  ('city_goya', 'Goya', 'province_corrientes', NOW(), NOW()),
  ('city_paso_libres', 'Paso de los Libres', 'province_corrientes', NOW(), NOW()),
  ('city_curuzu_cuatia', 'Curuzú Cuatiá', 'province_corrientes', NOW(), NOW()),
  ('city_bella_vista', 'Bella Vista', 'province_corrientes', NOW(), NOW()),
  ('city_esquina', 'Esquina', 'province_corrientes', NOW(), NOW()),
  ('city_mercedes', 'Mercedes', 'province_corrientes', NOW(), NOW()),
  ('city_monte_caseros', 'Monte Caseros', 'province_corrientes', NOW(), NOW()),
  ('city_santo_tome', 'Santo Tomé', 'province_corrientes', NOW(), NOW()),
  ('city_ituzaingo', 'Ituzaingó', 'province_corrientes', NOW(), NOW()),
  ('city_alvear', 'Alvear', 'province_corrientes', NOW(), NOW()),
  ('city_empedrado', 'Empedrado', 'province_corrientes', NOW(), NOW()),
  ('city_saladas', 'Saladas', 'province_corrientes', NOW(), NOW()),
  ('city_mburucuya', 'Mburucuyá', 'province_corrientes', NOW(), NOW()),
  ('city_san_roque', 'San Roque', 'province_corrientes', NOW(), NOW())
ON CONFLICT (name, "provinceId") DO NOTHING;

-- Insertar Ciudades de Chaco
INSERT INTO "City" (id, name, "provinceId", "createdAt", "updatedAt")
VALUES 
  ('city_resistencia', 'Resistencia', 'province_chaco', NOW(), NOW()),
  ('city_saenz_pena', 'Presidencia Roque Sáenz Peña', 'province_chaco', NOW(), NOW()),
  ('city_villa_angela', 'Villa Ángela', 'province_chaco', NOW(), NOW()),
  ('city_charata', 'Charata', 'province_chaco', NOW(), NOW()),
  ('city_general_pinedo', 'General José de San Martín', 'province_chaco', NOW(), NOW()),
  ('city_quitilipi', 'Quitilipi', 'province_chaco', NOW(), NOW()),
  ('city_barranqueras', 'Barranqueras', 'province_chaco', NOW(), NOW()),
  ('city_fontana', 'Fontana', 'province_chaco', NOW(), NOW()),
  ('city_las_brenas', 'Las Breñas', 'province_chaco', NOW(), NOW()),
  ('city_machagai', 'Machagai', 'province_chaco', NOW(), NOW()),
  ('city_castelli', 'Juan José Castelli', 'province_chaco', NOW(), NOW()),
  ('city_villa_berthet', 'Villa Berthet', 'province_chaco', NOW(), NOW()),
  ('city_hermoso_campo', 'Hermoso Campo', 'province_chaco', NOW(), NOW()),
  ('city_corzuela', 'Corzuela', 'province_chaco', NOW(), NOW()),
  ('city_tres_isletas', 'Tres Isletas', 'province_chaco', NOW(), NOW()),
  ('city_pampa_del_infierno', 'Pampa del Infierno', 'province_chaco', NOW(), NOW()),
  ('city_presidencia_plaza', 'Presidencia de la Plaza', 'province_chaco', NOW(), NOW()),
  ('city_puerto_vilelas', 'Puerto Vilelas', 'province_chaco', NOW(), NOW()),
  ('city_la_leonesa', 'La Leonesa', 'province_chaco', NOW(), NOW()),
  ('city_general_pinedo_2', 'General Pinedo', 'province_chaco', NOW(), NOW())
ON CONFLICT (name, "provinceId") DO NOTHING;

-- Insertar Barrios de Corrientes Capital
INSERT INTO "Neighborhood" (id, name, "cityId", "createdAt", "updatedAt")
VALUES 
  ('neighborhood_centro_ctes', 'Centro', 'city_corrientes_capital', NOW(), NOW()),
  ('neighborhood_san_benito', 'San Benito', 'city_corrientes_capital', NOW(), NOW()),
  ('neighborhood_500_viviendas', '500 Viviendas', 'city_corrientes_capital', NOW(), NOW()),
  ('neighborhood_laguna_brava', 'Laguna Brava', 'city_corrientes_capital', NOW(), NOW()),
  ('neighborhood_san_martin', 'San Martín', 'city_corrientes_capital', NOW(), NOW()),
  ('neighborhood_belgrano', 'Belgrano', 'city_corrientes_capital', NOW(), NOW()),
  ('neighborhood_molina_punta', 'Molina Punta', 'city_corrientes_capital', NOW(), NOW()),
  ('neighborhood_santa_catalina', 'Santa Catalina', 'city_corrientes_capital', NOW(), NOW()),
  ('neighborhood_yapeyú', 'Yapeyú', 'city_corrientes_capital', NOW(), NOW()),
  ('neighborhood_arazaty', 'Arazaty', 'city_corrientes_capital', NOW(), NOW())
ON CONFLICT (name, "cityId") DO NOTHING;

-- Insertar Barrios de Resistencia
INSERT INTO "Neighborhood" (id, name, "cityId", "createdAt", "updatedAt")
VALUES 
  ('neighborhood_centro_res', 'Centro', 'city_resistencia', NOW(), NOW()),
  ('neighborhood_villa_don_alberto', 'Villa Don Alberto', 'city_resistencia', NOW(), NOW()),
  ('neighborhood_villa_rio_negro', 'Villa Río Negro', 'city_resistencia', NOW(), NOW()),
  ('neighborhood_villa_libertad', 'Villa Libertad', 'city_resistencia', NOW(), NOW()),
  ('neighborhood_villa_prosperidad', 'Villa Prosperidad', 'city_resistencia', NOW(), NOW()),
  ('neighborhood_barrio_frances', 'Barrio Francés', 'city_resistencia', NOW(), NOW()),
  ('neighborhood_villa_italia', 'Villa Italia', 'city_resistencia', NOW(), NOW()),
  ('neighborhood_villa_centenario', 'Villa Centenario', 'city_resistencia', NOW(), NOW()),
  ('neighborhood_toba', 'Toba', 'city_resistencia', NOW(), NOW()),
  ('neighborhood_san_cayetano', 'San Cayetano', 'city_resistencia', NOW(), NOW())
ON CONFLICT (name, "cityId") DO NOTHING;

-- Verificar resultados
SELECT 'Países insertados:' as tipo, COUNT(*) as cantidad FROM "Country"
UNION ALL
SELECT 'Provincias insertadas:', COUNT(*) FROM "Province"
UNION ALL
SELECT 'Ciudades insertadas:', COUNT(*) FROM "City"
UNION ALL
SELECT 'Barrios insertados:', COUNT(*) FROM "Neighborhood";
