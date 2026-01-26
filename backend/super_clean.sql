-- Super aggressive cleanup
UPDATE medicines SET "genericName" = 'General Medicine' WHERE "genericName" IS NULL;
UPDATE medicines SET "genericName" = 'General Medicine' WHERE TRIM("genericName") = '';
UPDATE medicines SET manufacturer = 'General' WHERE manufacturer IS NULL OR manufacturer = '';
UPDATE medicines SET category = 'General medicine' WHERE category IS NULL OR category = '';
UPDATE medicines SET "dosageForm" = 'Tablet' WHERE "dosageForm" IS NULL OR "dosageForm" = '';
UPDATE medicines SET strength = 'As prescribed' WHERE strength IS NULL OR strength = '';
UPDATE medicines SET "storageConditions" = 'Store in a cool, dry place' WHERE "storageConditions" IS NULL OR "storageConditions" = '';

VACUUM FULL medicines;
REINDEX TABLE medicines;
