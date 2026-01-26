SELECT COUNT(*) FROM medicines WHERE category IS NULL OR category = '';
SELECT COUNT(*) FROM medicines WHERE price IS NULL OR price = 0;
SELECT category, AVG(price) as avg_price, MAX(price) as max_price, MIN(price) as min_price FROM medicines GROUP BY category ORDER BY avg_price DESC LIMIT 10;
SELECT name, price, stock FROM medicines WHERE stock = 0 LIMIT 5;
