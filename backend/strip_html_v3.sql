-- Test on a single ID that we know has the issue (Dexend: 26958)
UPDATE medicines
SET indications = (
    SELECT array_agg(regexp_replace(val::text, '<[^>]*>', '', 'g')::text ORDER BY ord)
    FROM unnest(indications) WITH ORDINALITY AS t(val, ord)
)
WHERE id = 26958;

-- If successful, run on everything else
UPDATE medicines
SET indications = (
    SELECT array_agg(regexp_replace(val::text, '<[^>]*>', '', 'g')::text ORDER BY ord)
    FROM unnest(indications) WITH ORDINALITY AS t(val, ord)
)
WHERE indications::text LIKE '%<%';

-- Also ensure description is cleaned
UPDATE medicines 
SET description = regexp_replace(description::text, '<[^>]*>', '', 'g')::text
WHERE description LIKE '%<%';
