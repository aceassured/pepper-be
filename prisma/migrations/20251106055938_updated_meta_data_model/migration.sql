/*
  Warnings:

  - The `home` column on the `MetaData` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `knowOurPepper` column on the `MetaData` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `articles` column on the `MetaData` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `contactUs` column on the `MetaData` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `trackOrder` column on the `MetaData` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bookYourPepper` column on the `MetaData` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `login` column on the `MetaData` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "MetaData" DROP COLUMN "home",
ADD COLUMN     "home" JSONB,
DROP COLUMN "knowOurPepper",
ADD COLUMN     "knowOurPepper" JSONB,
DROP COLUMN "articles",
ADD COLUMN     "articles" JSONB,
DROP COLUMN "contactUs",
ADD COLUMN     "contactUs" JSONB,
DROP COLUMN "trackOrder",
ADD COLUMN     "trackOrder" JSONB,
DROP COLUMN "bookYourPepper",
ADD COLUMN     "bookYourPepper" JSONB,
DROP COLUMN "login",
ADD COLUMN     "login" JSONB;
