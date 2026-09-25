ALTER TABLE "Assignment" ADD COLUMN "lectureCount" INTEGER NOT NULL DEFAULT 0;

-- Existing completed assignments already represent a finished cycle.
UPDATE "Assignment" SET "lectureCount" = 2 WHERE "statut" = 'CONFIRME';
