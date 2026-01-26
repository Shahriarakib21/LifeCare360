-- Comprehensive Array Cleanup
UPDATE medicines SET indications = ARRAY[]::VARCHAR(255)[] WHERE indications IS NULL;
UPDATE medicines SET "sideEffects" = ARRAY[]::VARCHAR(255)[] WHERE "sideEffects" IS NULL;
UPDATE medicines SET contraindications = ARRAY[]::VARCHAR(255)[] WHERE contraindications IS NULL;
UPDATE medicines SET interactions = ARRAY[]::VARCHAR(255)[] WHERE interactions IS NULL;

-- Re-verify mandatory strings
UPDATE medicines SET "genericName" = 'General' WHERE "genericName" IS NULL OR "genericName" = '';
UPDATE medicines SET strength = 'As prescribed' WHERE strength IS NULL OR strength = '';
UPDATE medicines SET "storageConditions" = 'Store in a cool, dry place' WHERE "storageConditions" IS NULL OR "storageConditions" = '';
UPDATE medicines SET manufacturer = 'General medicine' WHERE manufacturer IS NULL OR manufacturer = '';
UPDATE medicines SET "dosageForm" = 'Tablet' WHERE "dosageForm" IS NULL OR "dosageForm" = '';
UPDATE medicines SET category = 'General medicine' WHERE category IS NULL OR category = '';
