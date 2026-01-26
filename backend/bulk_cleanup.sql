-- 1. Categorize common medicines that have NULL/empty category
UPDATE medicines SET category = 'Macrolides' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%Azithromycin%';
UPDATE medicines SET category = 'Proton Pump Inhibitor' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%Esomeprazole%';
UPDATE medicines SET category = 'Broad spectrum penicillins' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%Ampicillin%';
UPDATE medicines SET category = 'Glucocorticoids' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%Dexamethasone%';
UPDATE medicines SET category = 'Combined antihypertensive preparations' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%Sacubitril%' AND "genericName" ILIKE '%Valsartan%';
UPDATE medicines SET category = 'Beta-adrenoceptor blocking drugs' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%Metoprolol%';
UPDATE medicines SET category = 'Multi-vitamin & Multi-mineral combined preparations' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%antioxidant%';
UPDATE medicines SET category = 'Drugs for Dry eyes' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%Carboxymethylcellulose%';
UPDATE medicines SET category = 'Non opioid analgesics' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%Paracetamol%';
UPDATE medicines SET category = 'Non-steroidal Anti-inflammatory Drugs (NSAIDs)' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%Ketorolac%';
UPDATE medicines SET category = 'Calcium-channel blockers' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%Amlodipine%';
UPDATE medicines SET category = 'H2 receptor antagonist' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%Ranitidine%';
UPDATE medicines SET category = 'Anti-emetic drugs' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%Domperidone%';
UPDATE medicines SET category = 'Antihistamines' WHERE (category IS NULL OR category = '') AND "genericName" ILIKE '%Cetirizine%';
UPDATE medicines SET category = 'General' WHERE (category IS NULL OR category = '');

-- 2. Assign realistic prices based on dosageForm and category
UPDATE medicines
SET price = ROUND(CAST(
  (CASE 
    WHEN "dosageForm" ILIKE '%Tablet%' THEN 8.0
    WHEN "dosageForm" ILIKE '%Capsule%' THEN 10.0
    WHEN "dosageForm" ILIKE '%Injection%' THEN 150.0
    WHEN "dosageForm" ILIKE '%Infusion%' THEN 450.0
    WHEN "dosageForm" ILIKE '%Syrup%' OR "dosageForm" ILIKE '%Suspension%' THEN 75.0
    WHEN "dosageForm" ILIKE '%Cream%' OR "dosageForm" ILIKE '%Ointment%' OR "dosageForm" ILIKE '%Gel%' THEN 95.0
    WHEN "dosageForm" ILIKE '%Inhaler%' THEN 400.0
    WHEN "dosageForm" ILIKE '%Drop%' THEN 120.0
    WHEN "dosageForm" ILIKE '%Spray%' THEN 180.0
    ELSE 25.0
  END)
  *
  (CASE 
    WHEN category ILIKE '%Cancer%' OR category ILIKE '%Cytotoxic%' OR category ILIKE '%Targeted%' THEN 15.0
    WHEN category ILIKE '%Cephalosporins%' OR category ILIKE '%Penicillins%' OR category ILIKE '%Macrolides%' THEN 1.8
    WHEN category ILIKE '%Antihypertensive%' OR category ILIKE '%Beta-adrenoceptor%' OR category ILIKE '%Calcium-channel%' THEN 1.4
    WHEN category ILIKE '%Proton Pump Inhibitor%' THEN 1.2
    WHEN category ILIKE '%Diabetes%' OR category ILIKE '%Insulin%' THEN 1.6
    WHEN category ILIKE '%Analgesics%' OR category ILIKE '%NSAIDs%' THEN 0.6
    WHEN category ILIKE '%Vitamin%' OR category ILIKE '%Mineral%' THEN 0.8
    ELSE 1.0
  END)
  *
  (CASE 
    WHEN strength ILIKE '%1000%' OR strength ILIKE '%1 gm%' THEN 1.8
    WHEN strength ILIKE '%500%' THEN 1.4
    WHEN strength ILIKE '%250%' THEN 1.2
    WHEN strength ILIKE '%100%' THEN 1.1
    ELSE 1.0
  END)
  + (RANDOM() * 5.0 - 2.5) -- Slight variation for realism
  AS NUMERIC), 2);

-- 3. Ensure no negative prices and minimum floor
UPDATE medicines SET price = 2.0 WHERE price < 2.0;

-- 4. Set stock to realistic levels for demo
UPDATE medicines SET stock = FLOOR(RANDOM() * 500 + 50);
UPDATE medicines SET stock = 0 WHERE RANDOM() < 0.05; -- 5% out of stock for variety
