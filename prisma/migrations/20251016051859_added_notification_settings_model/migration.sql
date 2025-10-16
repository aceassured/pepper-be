-- CreateEnum
CREATE TYPE "ValidSettings" AS ENUM ('newBookings', 'paymentConfirmations', 'dailySummary', 'weeklySummary', 'monthlySummary');

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "newBookings" BOOLEAN NOT NULL DEFAULT false,
    "paymentConfirmations" BOOLEAN NOT NULL DEFAULT false,
    "dailySummary" BOOLEAN NOT NULL DEFAULT false,
    "weeklySummary" BOOLEAN NOT NULL DEFAULT false,
    "monthlySummary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
