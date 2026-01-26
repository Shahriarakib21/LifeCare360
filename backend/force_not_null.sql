-- Force fix
UPDATE medicines SET "genericName" = 'General' WHERE "genericName" IS NULL OR "genericName" = '';
ALTER TABLE medicines ALTER COLUMN "genericName" SET NOT NULL;

UPDATE medicines SET manufacturer = 'General' WHERE manufacturer IS NULL OR manufacturer = '';
ALTER TABLE medicines ALTER COLUMN manufacturer SET NOT NULL;

UPDATE medicines SET category = 'General' WHERE category IS NULL OR category = '';
ALTER TABLE medicines ALTER COLUMN category SET NOT NULL;

UPDATE medicines SET "dosageForm" = 'Tablet' WHERE "dosageForm" IS NULL OR "dosageForm" = '';
ALTER TABLE medicines ALTER COLUMN "dosageForm" SET NOT NULL;

UPDATE medicines SET strength = 'As prescribed' WHERE strength IS NULL OR strength = '';
ALTER TABLE medicines ALTER COLUMN strength SET NOT NULL;

UPDATE medicines SET "storageConditions" = 'Store in a cool, dry place' WHERE "storageConditions" IS NULL OR "storageConditions" = '';
ALTER TABLE medicines ALTER COLUMN "storageConditions" SET NOT NULL;
