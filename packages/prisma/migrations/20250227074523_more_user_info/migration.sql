/*
  Warnings:

  - Added the required column `domain` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `local` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "domain" TEXT NOT NULL,
ADD COLUMN     "local" TEXT NOT NULL;
