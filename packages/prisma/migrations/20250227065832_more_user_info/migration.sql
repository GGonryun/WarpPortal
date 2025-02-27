/*
  Warnings:

  - Added the required column `hash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shell` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hash" INTEGER NOT NULL,
ADD COLUMN     "shell" TEXT NOT NULL,
ALTER COLUMN "name" SET NOT NULL;
