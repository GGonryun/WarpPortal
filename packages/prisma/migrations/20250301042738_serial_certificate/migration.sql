/*
  Warnings:

  - You are about to drop the column `destination` on the `Certificate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serial]` on the table `Certificate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serial` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Certificate" DROP COLUMN "destination",
ADD COLUMN     "serial" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_serial_key" ON "Certificate"("serial");
