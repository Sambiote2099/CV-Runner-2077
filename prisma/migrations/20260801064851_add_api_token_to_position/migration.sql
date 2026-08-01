/*
  Warnings:

  - A unique constraint covering the columns `[apiToken]` on the table `Position` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "apiToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Position_apiToken_key" ON "Position"("apiToken");
