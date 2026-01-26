SELECT COUNT(*) FROM medicines WHERE description LIKE '%<%';
SELECT COUNT(*) FROM medicines WHERE indications::text LIKE '%<%';
SELECT id, name, description FROM medicines WHERE name ILIKE '%Cefadroxil%' OR name ILIKE '%Sefanid%' LIMIT 1;
