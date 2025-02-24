-- CreateTable
CREATE TABLE "UserAttributes" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "UserAttributes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserAttributes" ADD CONSTRAINT "UserAttributes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
