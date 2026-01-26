-- Targeted fix for non-nullable violations
UPDATE medicines SET "genericName" = 'Flucloxacillin' WHERE id = 32474;
UPDATE medicines SET "genericName" = 'Vitamin Combination' WHERE id = 31869;

-- Broad cleanup for ANY remaining violations
UPDATE medicines SET "genericName" = 'Combined' WHERE "genericName" IS NULL OR "genericName" = '';
UPDATE medicines SET strength = 'As prescribed' WHERE strength IS NULL OR strength = '';
UPDATE medicines SET "storageConditions" = 'Store in a cool, dry place' WHERE "storageConditions" IS NULL OR "storageConditions" = '';
UPDATE medicines SET manufacturer = 'General' WHERE manufacturer IS NULL OR manufacturer = '';
UPDATE medicines SET "dosageForm" = 'Tablet' WHERE "dosageForm" IS NULL OR "dosageForm" = '';
UPDATE medicines SET category = 'General' WHERE category IS NULL OR category = '';
