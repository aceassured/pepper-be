/*
  Warnings:

  - Added the required column `maxQuantity` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pinCode` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerUnit` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "maxQuantity" INTEGER NOT NULL,
ADD COLUMN     "pinCode" TEXT NOT NULL,
ADD COLUMN     "pricePerUnit" INTEGER NOT NULL;
