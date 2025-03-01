/*
  Warnings:

  - You are about to drop the column `action` on the `Policy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Policy" DROP COLUMN "action",
ADD COLUMN     "actions" TEXT[];
