-- 1. Strip HTML tags from description
UPDATE medicines 
SET description = regexp_replace(description, '<[^>]*>', '', 'g')
WHERE description LIKE '%<%';

-- 2. Clean indications array (remove HTML tags from each element)
-- This approach unnest the array, cleans each string, and re-aggregates it.
WITH cleaned_indications AS (
  SELECT id, ARRAY_AGG(regexp_replace(ind, '<[^>]*>', '', 'g') ORDER BY idx) as new_indications
  FROM medicines, UNNEST(indications) WITH ORDINALITY AS t(ind, idx)
  WHERE indications::text LIKE '%<%'
  GROUP BY id
)
UPDATE medicines
SET indications = ci.new_indications
FROM cleaned_indications ci
WHERE medicines.id = ci.id;

-- 3. Additional cleanup: Replace &amp; with &, &nbsp; with space, etc.
UPDATE medicines
SET description = replace(replace(description, '&amp;', '&'), '&nbsp;', ' ')
WHERE description LIKE '%&%';

WITH cleaned_indications_entities AS (
  SELECT id, ARRAY_AGG(replace(replace(ind, '&amp;', '&'), '&nbsp;', ' ') ORDER BY idx) as new_indications
  FROM medicines, UNNEST(indications) WITH ORDINALITY AS t(ind, idx)
  WHERE indications::text LIKE '%&%'
  GROUP BY id
)
UPDATE medicines
SET indications = cie.new_indications
FROM cleaned_indications_entities cie
WHERE medicines.id = cie.id;
