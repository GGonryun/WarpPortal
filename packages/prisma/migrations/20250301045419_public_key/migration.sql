/*
  Warnings:

  - You are about to drop the column `content` on the `Certificate` table. All the data in the column will be lost.
  - Added the required column `publicKey` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Certificate" DROP COLUMN "content",
ADD COLUMN     "publicKey" TEXT NOT NULL;
