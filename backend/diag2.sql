SELECT COUNT(*) FROM medicines WHERE price IS NOT NULL AND price > 0;
SELECT name, price FROM medicines WHERE price IS NOT NULL AND price > 0 LIMIT 10;
