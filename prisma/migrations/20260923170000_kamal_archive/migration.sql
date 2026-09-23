ALTER TABLE "Kamal" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE INDEX "Kamal_archivedAt_idx" ON "Kamal"("archivedAt");
