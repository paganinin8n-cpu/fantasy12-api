-- Data migration: preserve every current participant while assigning the
-- product default capacity to legacy Mesas that were previously unlimited.
UPDATE "rankings"
SET "maxParticipants" = GREATEST("currentParticipants", 50)
WHERE "type" = 'BOLAO' AND "maxParticipants" IS NULL;
