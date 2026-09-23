DROP INDEX "Assignment_kamalId_juzNumber_key";
CREATE UNIQUE INDEX "Assignment_one_active_juz_key" ON "Assignment" ("kamalId", "juzNumber") WHERE "statut" IN ('EN_ATTENTE', 'CONFIRME');
