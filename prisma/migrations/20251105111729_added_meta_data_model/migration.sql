-- CreateTable
CREATE TABLE "MetaData" (
    "id" SERIAL NOT NULL,
    "home" TEXT,
    "knowOurPepper" TEXT,
    "articles" TEXT,
    "contactUs" TEXT,
    "trackOrder" TEXT,
    "bookYourPepper" TEXT,
    "login" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaData_pkey" PRIMARY KEY ("id")
);
