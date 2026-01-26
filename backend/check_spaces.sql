SELECT DISTINCT quote_ident(category) FROM medicines WHERE category ILIKE '%Cephalosporins%' LIMIT 5;
SELECT category, LENGTH(category) FROM medicines WHERE category ILIKE '%Cephalosporins%' LIMIT 5;
