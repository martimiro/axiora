/*
  Warnings:

  - You are about to drop the column `subject` on the `Conversation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "subject",
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'web';
