SELECT id, name, indications FROM medicines WHERE indications::text ILIKE '%ac-body%' LIMIT 5;
SELECT id, name, description FROM medicines WHERE description ILIKE '%ac-body%' LIMIT 5;
