/*
  Warnings:

  - You are about to drop the `UserAttributes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserAttributes" DROP CONSTRAINT "UserAttributes_userId_fkey";

-- DropTable
DROP TABLE "UserAttributes";
