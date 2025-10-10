-- CreateEnum
CREATE TYPE "StageType" AS ENUM ('ORDER_CONFIRMED', 'NURSERY_ALLOCATION', 'GROWTH_PHASE', 'READY_FOR_DISPATCH', 'DELIVERED');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED');

-- CreateTable
CREATE TABLE "ProgressTracker" (
    "id" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "orderConfirmedStatus" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "orderConfirmedStart" TIMESTAMP(3),
    "orderConfirmedEnd" TIMESTAMP(3),
    "nurseryAllocationStatus" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "nurseryAllocationStart" TIMESTAMP(3),
    "nurseryAllocationEnd" TIMESTAMP(3),
    "growthPhaseStatus" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "growthPhaseStart" TIMESTAMP(3),
    "growthPhaseEnd" TIMESTAMP(3),
    "readyForDispatchStatus" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "readyForDispatchStart" TIMESTAMP(3),
    "readyForDispatchEnd" TIMESTAMP(3),
    "deliveredStatus" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "deliveredStart" TIMESTAMP(3),
    "deliveredEnd" TIMESTAMP(3),
    "currentStage" "StageType",
    "expectedCompletionDate" TIMESTAMP(3),
    "progressPercentage" INTEGER DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressTracker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgressTracker_orderId_key" ON "ProgressTracker"("orderId");

-- AddForeignKey
ALTER TABLE "ProgressTracker" ADD CONSTRAINT "ProgressTracker_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
