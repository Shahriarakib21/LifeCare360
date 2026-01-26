-- Final cleanup script for all HTML and entities
UPDATE medicines 
SET description = regexp_replace(description, '<[^>]*>', '', 'g')
WHERE description LIKE '%<%';

-- For indications, use a temporary mapping table to avoid complex nested functions
CREATE TEMPORARY TABLE cleaned_inds AS
SELECT id, array_agg(regexp_replace(val, '<[^>]*>', '', 'g') ORDER BY ord) as new_indications
FROM (
    SELECT id, unnest(indications) as val, generate_subscripts(indications, 1) as ord
    FROM medicines 
    WHERE indications::text LIKE '%<%'
) sub
GROUP BY id;

UPDATE medicines
SET indications = ci.new_indications
FROM cleaned_inds ci
WHERE medicines.id = ci.id;

DROP TABLE cleaned_inds;

-- Cleanup entities
UPDATE medicines
SET description = replace(replace(replace(description, '&amp;', '&'), '&nbsp;', ' '), '... Read more', '')
WHERE description LIKE '%&%' OR description LIKE '%Read more%';

CREATE TEMPORARY TABLE cleaned_inds_ent AS
SELECT id, array_agg(replace(replace(replace(val, '&amp;', '&'), '&nbsp;', ' '), '... Read more', '') ORDER BY ord) as new_indications
FROM (
    SELECT id, unnest(indications) as val, generate_subscripts(indications, 1) as ord
    FROM medicines 
    WHERE indications::text LIKE '%&%' OR indications::text LIKE '%Read more%'
) sub
GROUP BY id;

UPDATE medicines
SET indications = ci.new_indications
FROM cleaned_inds_ent ci
WHERE medicines.id = ci.id;

DROP TABLE cleaned_inds_ent;
