/*
  Warnings:

  - A unique constraint covering the columns `[userId,key]` on the table `UserAttributes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserAttributes_userId_key_key" ON "UserAttributes"("userId", "key");
