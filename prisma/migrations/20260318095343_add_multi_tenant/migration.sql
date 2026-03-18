/*
  Warnings:

  - You are about to drop the column `subject` on the `Conversation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `GmailIntegration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `GmailIntegration` table without a default value. This is not possible if the table is not empty.

*/
-- Añadir userId a Agent con valor por defecto temporal
ALTER TABLE "Agent" ADD COLUMN "userId" TEXT NOT NULL DEFAULT 'cmmv3xzvm0000a6ainjl63zha';
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Agent" ALTER COLUMN "userId" DROP DEFAULT;

-- Añadir userId a Config con valor por defecto temporal
ALTER TABLE "Config" ADD COLUMN "userId" TEXT NOT NULL DEFAULT 'cmmv3xzvm0000a6ainjl63zha';
ALTER TABLE "Config" ADD CONSTRAINT "Config_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Config" ALTER COLUMN "userId" DROP DEFAULT;

-- Añadir userId a GmailIntegration con valor por defecto temporal
ALTER TABLE "GmailIntegration" ADD COLUMN "userId" TEXT NOT NULL DEFAULT 'cmmv3xzvm0000a6ainjl63zha';
ALTER TABLE "GmailIntegration" ADD CONSTRAINT "GmailIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GmailIntegration" ALTER COLUMN "userId" DROP DEFAULT;
ALTER TABLE "GmailIntegration" ADD CONSTRAINT "GmailIntegration_userId_key" UNIQUE ("userId");

-- Actualizar el id de GmailIntegration para que sea el userId
UPDATE "GmailIntegration" SET "id" = 'cmmv3xzvm0000a6ainjl63zha' WHERE "id" = 'default';
