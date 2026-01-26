SELECT id, quote_ident(name) as name, quote_ident("genericName") as gen FROM medicines WHERE "genericName" IS NULL OR "genericName" = '' LIMIT 10;
