-- Fix column name from synced_at to wordpress_synced_at for consistency
-- This ensures the frontend code matches the database schema

DO $$ 
BEGIN
    -- Check if synced_at column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'synced_at'
    ) THEN
        -- Rename synced_at to wordpress_synced_at
        ALTER TABLE properties RENAME COLUMN synced_at TO wordpress_synced_at;
        RAISE NOTICE 'Column synced_at renamed to wordpress_synced_at';
    ELSIF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'wordpress_synced_at'
    ) THEN
        -- If neither exists, create wordpress_synced_at
        ALTER TABLE properties ADD COLUMN wordpress_synced_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Column wordpress_synced_at created';
    ELSE
        RAISE NOTICE 'Column wordpress_synced_at already exists, no changes needed';
    END IF;
END $$;
