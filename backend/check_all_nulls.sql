SELECT 
    COUNT(*) FILTER (WHERE name IS NULL OR name = '') as name_nulls,
    COUNT(*) FILTER (WHERE "genericName" IS NULL OR "genericName" = '') as genericName_nulls,
    COUNT(*) FILTER (WHERE manufacturer IS NULL OR manufacturer = '') as manufacturer_nulls,
    COUNT(*) FILTER (WHERE category IS NULL OR category = '') as category_nulls,
    COUNT(*) FILTER (WHERE "dosageForm" IS NULL OR "dosageForm" = '') as dosageForm_nulls,
    COUNT(*) FILTER (WHERE strength IS NULL OR strength = '') as strength_nulls,
    COUNT(*) FILTER (WHERE price IS NULL) as price_nulls,
    COUNT(*) FILTER (WHERE "storageConditions" IS NULL OR "storageConditions" = '') as storageConditions_nulls
FROM medicines;
