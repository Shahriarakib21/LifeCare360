SELECT category, COUNT(*) as count FROM medicines GROUP BY category ORDER BY count DESC;
SELECT "dosageForm", COUNT(*) as count FROM medicines GROUP BY "dosageForm" ORDER BY count DESC;
SELECT strength, COUNT(*) as count FROM medicines GROUP BY strength ORDER BY count DESC LIMIT 20;
