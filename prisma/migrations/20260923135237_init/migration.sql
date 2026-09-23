-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "KamalStatus" AS ENUM ('BROUILLON', 'EN_COURS', 'TERMINE', 'EXPIRE');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'REASSIGNE', 'ANNULE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kamal" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateLimite" TIMESTAMP(3),
    "statut" "KamalStatus" NOT NULL DEFAULT 'BROUILLON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kamal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "kamalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "juzNumber" INTEGER NOT NULL,
    "tokenAcces" TEXT NOT NULL,
    "statut" "AssignmentStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "confirmedAt" TIMESTAMP(3),
    "confirmedBy" "UserRole",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telephone_key" ON "User"("telephone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_actif_idx" ON "User"("actif");

-- CreateIndex
CREATE INDEX "Kamal_statut_idx" ON "Kamal"("statut");

-- CreateIndex
CREATE INDEX "Kamal_dateLimite_idx" ON "Kamal"("dateLimite");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_tokenAcces_key" ON "Assignment"("tokenAcces");

-- CreateIndex
CREATE INDEX "Assignment_kamalId_idx" ON "Assignment"("kamalId");

-- CreateIndex
CREATE INDEX "Assignment_userId_idx" ON "Assignment"("userId");

-- CreateIndex
CREATE INDEX "Assignment_statut_idx" ON "Assignment"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_kamalId_juzNumber_key" ON "Assignment"("kamalId", "juzNumber");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_kamalId_fkey" FOREIGN KEY ("kamalId") REFERENCES "Kamal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
