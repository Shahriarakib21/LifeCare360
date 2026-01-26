-- Final attempt at array cleaning with explicit types
UPDATE medicines
SET indications = string_to_array(regexp_replace(array_to_string(indications::text[], '|||'), '<[^>]*>', '', 'g'), '|||')::varchar[]
WHERE indications::text LIKE '%<%';

-- Final entity cleanup for indications
UPDATE medicines
SET indications = string_to_array(replace(replace(replace(array_to_string(indications::text[], '|||'), '&amp;', '&'), '&nbsp;', ' '), '... Read more', ''), '|||')::varchar[]
WHERE indications::text LIKE '%&%' OR indications::text LIKE '%Read more%';
