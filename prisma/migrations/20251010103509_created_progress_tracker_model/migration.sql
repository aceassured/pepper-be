/*
  Warnings:

  - The primary key for the `ProgressTracker` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ProgressTracker` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "public"."ProgressTracker" DROP CONSTRAINT "ProgressTracker_orderId_fkey";

-- AlterTable
ALTER TABLE "ProgressTracker" DROP CONSTRAINT "ProgressTracker_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ProgressTracker_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "ProgressTracker" ADD CONSTRAINT "ProgressTracker_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
