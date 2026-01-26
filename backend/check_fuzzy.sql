SELECT COUNT(*) FROM medicines WHERE category ILIKE '%Cephalosporins%';
SELECT COUNT(*) FROM medicines WHERE category ILIKE '%Antibiotic%';
SELECT COUNT(*) FROM medicines WHERE category ILIKE '%Pain%';
SELECT name, category FROM medicines WHERE category ILIKE '%Cephalosporins%' LIMIT 5;
