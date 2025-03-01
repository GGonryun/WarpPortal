/*
  Warnings:

  - A unique constraint covering the columns `[local]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_local_key" ON "User"("local");
