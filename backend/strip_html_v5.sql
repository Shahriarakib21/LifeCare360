SELECT id, name, description FROM medicines WHERE description ILIKE '%inhibits bacterial cell wall synthesis by binding%' LIMIT 1;

-- Simplify cleaning to just use common tags
UPDATE medicines SET description = replace(description, '<div class="ac-body">', '') WHERE description LIKE '%ac-body%';
UPDATE medicines SET description = replace(description, '</div>', '') WHERE description LIKE '%</div>%';

-- For indications
UPDATE medicines
SET indications = array_replace(indications, val, replace(val, '<div class="ac-body">', ''))
FROM (SELECT id, unnest(indications) as val FROM medicines WHERE indications::text LIKE '%ac-body%') sub
WHERE medicines.id = sub.id AND sub.val LIKE '%ac-body%';

UPDATE medicines
SET indications = array_replace(indications, val, replace(val, '</div>', ''))
FROM (SELECT id, unnest(indications) as val FROM medicines WHERE indications::text LIKE '%</div>%') sub
WHERE medicines.id = sub.id AND sub.val LIKE '%</div>%';
