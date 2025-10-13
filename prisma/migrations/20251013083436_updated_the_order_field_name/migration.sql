/*
  Warnings:

  - You are about to drop the column `deliveryBatch` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "deliveryBatch",
ADD COLUMN     "deliveryDate" TIMESTAMP(3);
