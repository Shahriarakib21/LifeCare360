SELECT COUNT(*) FROM medicines WHERE "genericName" IS NULL OR "genericName" = '';
SELECT name FROM medicines WHERE "genericName" IS NULL OR "genericName" = '' LIMIT 5;
