/*
  Warnings:

  - Added the required column `createdAt` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL;
