-- AlterEnum
ALTER TYPE "ValidSettings" ADD VALUE 'refundRequests';

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "refundRequests" BOOLEAN NOT NULL DEFAULT false;
