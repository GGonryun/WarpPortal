/*
  Warnings:

  - You are about to drop the column `destination` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `Policy` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[hostname]` on the table `Destination` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `destinationId` to the `Policy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Policy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Policy" DROP COLUMN "destination",
DROP COLUMN "source",
ADD COLUMN     "destinationId" TEXT NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Destination_hostname_key" ON "Destination"("hostname");

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
