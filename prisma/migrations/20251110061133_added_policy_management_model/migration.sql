-- AlterTable
ALTER TABLE "MetaData" ADD COLUMN     "privacyPolicy" JSONB,
ADD COLUMN     "terms" JSONB;

-- CreateTable
CREATE TABLE "PolicyContent" (
    "id" SERIAL NOT NULL,
    "terms" TEXT,
    "privacyPolicy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyContent_pkey" PRIMARY KEY ("id")
);
