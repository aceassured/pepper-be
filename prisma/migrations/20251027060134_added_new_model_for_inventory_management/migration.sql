-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "month" TEXT NOT NULL,
    "maxQuantity" INTEGER NOT NULL,
    "currentQuantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);
