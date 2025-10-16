/*
  Warnings:

  - The values [INITIATED,PROCESSING] on the enum `RefundStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `completedAt` on the `Refund` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RefundStatus_new" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');
ALTER TABLE "public"."Refund" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Refund" ALTER COLUMN "status" TYPE "RefundStatus_new" USING ("status"::text::"RefundStatus_new");
ALTER TYPE "RefundStatus" RENAME TO "RefundStatus_old";
ALTER TYPE "RefundStatus_new" RENAME TO "RefundStatus";
DROP TYPE "public"."RefundStatus_old";
ALTER TABLE "Refund" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Refund" DROP COLUMN "completedAt",
ADD COLUMN     "failedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PENDING';
