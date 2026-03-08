-- Script to clean corrupted features and amenities data in the database

-- Clean features field - extract clean text from escaped JSON strings
UPDATE properties 
SET features = ARRAY(
  SELECT 
    -- Remove escaped quotes and brackets from each array element
    regexp_replace(
      regexp_replace(
        regexp_replace(elem, '^\["', ''),  -- Remove leading ["
        '"\]$', ''                          -- Remove trailing "]
      ),
      '\\"', '"', 'g'                       -- Unescape quotes
    )
  FROM unnest(features) AS elem
  WHERE elem != '[]' AND elem != ''
)
WHERE features IS NOT NULL 
  AND array_length(features, 1) > 0
  AND features::text LIKE '%[\\"%';

-- Clean amenities field - same logic
UPDATE properties 
SET amenities = ARRAY(
  SELECT 
    regexp_replace(
      regexp_replace(
        regexp_replace(elem, '^\["', ''),
        '"\]$', ''
      ),
      '\\"', '"', 'g'
    )
  FROM unnest(amenities) AS elem
  WHERE elem != '[]' AND elem != ''
)
WHERE amenities IS NOT NULL 
  AND array_length(amenities, 1) > 0
  AND amenities::text LIKE '%[\\"%';

-- Remove empty array elements like ["[]"]
UPDATE properties
SET features = ARRAY_REMOVE(features, '[]')
WHERE '[]' = ANY(features);

UPDATE properties
SET amenities = ARRAY_REMOVE(amenities, '[]')
WHERE '[]' = ANY(amenities);

-- Final cleanup: ensure NULL for truly empty arrays
UPDATE properties
SET features = NULL
WHERE features = '{}' OR array_length(features, 1) IS NULL;

UPDATE properties
SET amenities = NULL
WHERE amenities = '{}' OR array_length(amenities, 1) IS NULL;
