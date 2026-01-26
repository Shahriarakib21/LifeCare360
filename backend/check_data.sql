SELECT name, category, "isActive" FROM medicines WHERE name ILIKE '%Augmentin%' LIMIT 10;
SELECT name, category, "isActive" FROM medicines WHERE category ILIKE '%Cephalosporins%' LIMIT 10;
SELECT count(*) FROM medicines WHERE "isActive" = true;
