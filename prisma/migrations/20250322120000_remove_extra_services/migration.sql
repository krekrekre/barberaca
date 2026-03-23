-- Remove stored extras snapshot from appointments, then drop ExtraService table.

ALTER TABLE "Appointment" DROP COLUMN IF EXISTS "extraServices";

DROP TABLE IF EXISTS "ExtraService";
