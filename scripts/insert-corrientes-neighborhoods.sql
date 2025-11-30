-- Script para insertar los 108 barrios de la ciudad de Corrientes Capital
-- Fuente: https://www.intermirarte.com.ar/2019/02/division-de-barrios-ciudad-de-corrientes.html

-- Primero obtener el city_id de Corrientes Capital
DO $$
DECLARE
    corrientes_city_id TEXT;
BEGIN
    -- Buscar el ID de la ciudad de Corrientes
    SELECT id INTO corrientes_city_id
    FROM "City"
    WHERE name = 'Corrientes'
    AND "provinceId" IN (
        SELECT id FROM "Province" WHERE name = 'Corrientes'
    )
    LIMIT 1;

    -- Si no existe la ciudad, no se puede continuar
    IF corrientes_city_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró la ciudad de Corrientes en la base de datos';
    END IF;

    -- Insertar los 108 barrios de Corrientes Capital
    INSERT INTO "Neighborhood" (id, name, "cityId", "isActive", "createdAt", "updatedAt")
    VALUES
        (gen_random_uuid(), 'Ferré', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Camba Cuá', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'La Cruz', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Centro', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Libertad', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Deportes', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'La Rosada', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Belgrano', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Antártida Argentina', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Villa Celia', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Villa García', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'San José', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Universitario', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Aldana', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Cichero', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Bañado Norte', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Nuestra Señora de Pompeya', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Yapeyú', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Plácido Martínez', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Pujol', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Quinta Ferré', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Itatí', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Anahí', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Popular', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Madariaga', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Hipódromo', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Arazatí', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'San Benito', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'San Martín', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Sur', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Verón de Astrada', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Santa Rosa', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Residencial Santa Rosa', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Tránsito de Tacuarí', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Granaderos', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Santa Teresita', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Villa Chiquita', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'General Güemes', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), '17 de Agosto', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Galván', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Virgen de los Dolores', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Sargento Cabral', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Juan de Vera', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Pío X', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Luz y Fuerza', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Codepro', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Santa María', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Bancario', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Ciudad de Arequipa', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Ex Aeroclub', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'San Marcos', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Cacique Canindeyú', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Progreso', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Las Rosas', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Villa Raquel', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), '9 de Julio', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'República de Venezuela', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'San Marcelo', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Patrono', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Juan XXIII', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Ciudad de Estepa', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Colón', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Islas Malvinas', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Doctor Nicolini', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'General San Martín', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Ongay', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Paloma de la Paz', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Irupé', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Parque Ingeniero Serantes', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Concepción', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'San Antonio', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Nuestra Señora de Guadalupe', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'San Roque', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Río Paraná', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), '3 de Abril', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Paysandú', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Alta Gracia', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Ayuda Mutua', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Primera Junta', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Unión', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Ciudades Correntinas', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Pirayú', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Nuestra Señora de la Asunción', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Fray José de la Quintana', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'San Gerónimo', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'UNNE Campus Universitario', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Víctor Colas', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Industrial', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Apipé', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Lomas del Mirador', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Collantes', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Molina Punta', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Ciudad de Valencia', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Sor María Assunta Pittaro', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Parque Balneario Molina Punta', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'UNNE Eragia', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Cremonte', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'San Ignacio', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Flier', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'José M. Ponce', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Lomas', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Parque Cadenas', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Sapucay', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Laguna Brava', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Doctor Montaña', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Santa Rita', corrientes_city_id, true, NOW(), NOW()),
        (gen_random_uuid(), 'Esperanza', corrientes_city_id, true, NOW(), NOW())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Se insertaron los 108 barrios de Corrientes Capital exitosamente';
END $$;
