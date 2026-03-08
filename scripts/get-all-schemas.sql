-- Get columns for ALL tables in the database
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('users', 'owners', 'clients', 'properties', 'appointments', 
                   'cities', 'provinces', 'countries', 'neighborhoods', 'property_types')
ORDER BY table_name, ordinal_position;
