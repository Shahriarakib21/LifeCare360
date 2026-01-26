-- 1. Final check/clean on description for specific patterns
UPDATE medicines 
SET description = regexp_replace(description, '<[^>]*>', '', 'g')
WHERE description LIKE '%<%';

-- 2. Clean indications array record by record
UPDATE medicines
SET indications = (
    SELECT array_agg(regexp_replace(val, '<[^>]*>', '', 'g') ORDER BY ord)
    FROM unnest(indications) WITH ORDINALITY AS t(val, ord)
)
WHERE indications::text LIKE '%<%';

-- 3. Clean entities and "Read more" artifacts
UPDATE medicines
SET description = replace(replace(replace(description, '&amp;', '&'), '&nbsp;', ' '), '... Read more', ''),
    indications = (
        SELECT array_agg(replace(replace(replace(val, '&amp;', '&'), '&nbsp;', ' '), '... Read more', '') ORDER BY ord)
        FROM unnest(indications) WITH ORDINALITY AS t(val, ord)
    )
WHERE description LIKE '%&%' OR description LIKE '%Read more%'
   OR indications::text LIKE '%&%' OR indications::text LIKE '%Read more%';
