/*
  Warnings:

  - You are about to drop the column `revoked` on the `Certificate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Certificate" DROP COLUMN "revoked",
ADD COLUMN     "revokedAt" TIMESTAMP(3);
