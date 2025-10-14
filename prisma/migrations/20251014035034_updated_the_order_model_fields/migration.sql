/*
  Warnings:

  - The values [PROCESSING] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `pricePerUnitInPaise` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');
ALTER TABLE "public"."Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "productName" DROP NOT NULL,
ALTER COLUMN "productName" SET DEFAULT 'Kumbukkal Selection Black Pepper Saplings',
ALTER COLUMN "productId" SET DEFAULT 1,
ALTER COLUMN "deliveryLocation" SET DEFAULT 'Kerala, Kottayam District',
ALTER COLUMN "pricePerUnitInPaise" SET DATA TYPE DECIMAL(5,2);
