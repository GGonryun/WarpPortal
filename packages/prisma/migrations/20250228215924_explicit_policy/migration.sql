-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "action" TEXT[],

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);
