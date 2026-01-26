SELECT id, name, description FROM medicines WHERE name ILIKE '%Cefadroxil%' OR description ILIKE '%Cefadroxil%' LIMIT 5;

-- Optimized and typed cleanup
UPDATE medicines 
SET description = regexp_replace(description::text, '<[^>]*>'::text, ''::text, 'g'::text)
WHERE description LIKE '%<%';

UPDATE medicines
SET indications = (
    SELECT array_agg(regexp_replace(val::text, '<[^>]*>'::text, ''::text, 'g'::text)::text ORDER BY ord)
    FROM unnest(indications) WITH ORDINALITY AS t(val, ord)
)
WHERE indications::text LIKE '%<%';

-- Final check on Cefadroxil
SELECT id, name, description FROM medicines WHERE name ILIKE '%Cefadroxil%' LIMIT 1;
