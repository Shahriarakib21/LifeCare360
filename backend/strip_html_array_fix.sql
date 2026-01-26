-- Bulk fix for indications array using string conversion
UPDATE medicines
SET indications = string_to_array(regexp_replace(array_to_string(indications, '|||'), '<[^>]*>', '', 'g'), '|||')
WHERE indications::text LIKE '%<%';

-- Final entity cleanup for indications
UPDATE medicines
SET indications = string_to_array(replace(replace(replace(array_to_string(indications, '|||'), '&amp;', '&'), '&nbsp;', ' '), '... Read more', ''), '|||')
WHERE indications::text LIKE '%&%' OR indications::text LIKE '%Read more%';
