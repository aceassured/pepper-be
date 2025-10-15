-- CreateEnum
CREATE TYPE "OrderRefundStatus" AS ENUM ('PENDING', 'APPROVED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "refundStatus" "OrderRefundStatus";
