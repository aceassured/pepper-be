-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reason" TEXT;
