/*
  Warnings:

  - Changed the type of `action` on the `Policy` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PolicyAction" AS ENUM ('SUDO', 'ALLOW', 'DENY');

-- AlterTable
ALTER TABLE "Policy" DROP COLUMN "action",
ADD COLUMN     "action" "PolicyAction" NOT NULL;
