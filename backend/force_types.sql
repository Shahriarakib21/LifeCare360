-- Manually cast columns to expected array type
ALTER TABLE medicines ALTER COLUMN indications TYPE character varying(255)[] USING indications::character varying(255)[];
ALTER TABLE medicines ALTER COLUMN "sideEffects" TYPE character varying(255)[] USING "sideEffects"::character varying(255)[];
ALTER TABLE medicines ALTER COLUMN contraindications TYPE character varying(255)[] USING contraindications::character varying(255)[];
ALTER TABLE medicines ALTER COLUMN interactions TYPE character varying(255)[] USING interactions::character varying(255)[];

-- Ensure they are NOT NULL with default matching Sequelize
ALTER TABLE medicines ALTER COLUMN indications SET NOT NULL;
ALTER TABLE medicines ALTER COLUMN indications SET DEFAULT ARRAY[]::character varying(255)[];

ALTER TABLE medicines ALTER COLUMN "sideEffects" SET NOT NULL;
ALTER TABLE medicines ALTER COLUMN "sideEffects" SET DEFAULT ARRAY[]::character varying(255)[];

ALTER TABLE medicines ALTER COLUMN contraindications SET NOT NULL;
ALTER TABLE medicines ALTER COLUMN contraindications SET DEFAULT ARRAY[]::character varying(255)[];

ALTER TABLE medicines ALTER COLUMN interactions SET NOT NULL;
ALTER TABLE medicines ALTER COLUMN interactions SET DEFAULT ARRAY[]::character varying(255)[];
