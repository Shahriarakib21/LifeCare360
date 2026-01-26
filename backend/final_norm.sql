UPDATE medicines SET "genericName" = 'Flucloxacillin' WHERE name = 'Affrox';
UPDATE medicines SET "genericName" = 'Vitamin Combination' WHERE name = 'Pregcare';
UPDATE medicines SET strength = 'As prescribed' WHERE strength IS NULL OR strength = '';
UPDATE medicines SET "storageConditions" = 'Store in a cool, dry place' WHERE "storageConditions" IS NULL OR "storageConditions" = '';
UPDATE medicines SET manufacturer = 'General' WHERE manufacturer IS NULL OR manufacturer = '';
UPDATE medicines SET "dosageForm" = 'Tablet' WHERE "dosageForm" IS NULL OR "dosageForm" = '';
UPDATE medicines SET category = 'General' WHERE category IS NULL OR category = '';
