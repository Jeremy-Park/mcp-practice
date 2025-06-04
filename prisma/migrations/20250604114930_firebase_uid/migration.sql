-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CLOSED');

-- CreateTable
CREATE TABLE "realtors" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "realtors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_realtors" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "realtorId" INTEGER NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_realtors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_clients" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "realtors_email_key" ON "realtors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "realtors_firebaseUid_key" ON "realtors"("firebaseUid");

-- CreateIndex
CREATE INDEX "team_realtors_teamId_idx" ON "team_realtors"("teamId");

-- CreateIndex
CREATE INDEX "team_realtors_realtorId_idx" ON "team_realtors"("realtorId");

-- CreateIndex
CREATE UNIQUE INDEX "team_realtors_teamId_realtorId_key" ON "team_realtors"("teamId", "realtorId");

-- CreateIndex
CREATE INDEX "team_clients_teamId_idx" ON "team_clients"("teamId");

-- CreateIndex
CREATE INDEX "team_clients_clientId_idx" ON "team_clients"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "team_clients_teamId_clientId_key" ON "team_clients"("teamId", "clientId");

-- AddForeignKey
ALTER TABLE "team_realtors" ADD CONSTRAINT "team_realtors_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_realtors" ADD CONSTRAINT "team_realtors_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "realtors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_clients" ADD CONSTRAINT "team_clients_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_clients" ADD CONSTRAINT "team_clients_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
