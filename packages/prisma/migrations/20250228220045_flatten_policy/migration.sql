/*
  Warnings:

  - You are about to drop the column `actions` on the `Policy` table. All the data in the column will be lost.
  - Added the required column `action` to the `Policy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Policy" DROP COLUMN "actions",
ADD COLUMN     "action" TEXT NOT NULL;
