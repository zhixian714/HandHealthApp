-- CreateTable
CREATE TABLE "SharpsObservation" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "carriedToPointOfCare" BOOLEAN NOT NULL,
    "noRecapping" BOOLEAN NOT NULL,
    "needleNotOnSurface" BOOLEAN NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharpsObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PpeObservation" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "maskWorn" BOOLEAN NOT NULL,
    "gownWorn" BOOLEAN NOT NULL,
    "glovesWorn" BOOLEAN NOT NULL,
    "gownRemovedBeforeNextPatient" BOOLEAN NOT NULL,
    "glovesRemovedAfterProcedure" BOOLEAN NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PpeObservation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SharpsObservation" ADD CONSTRAINT "SharpsObservation_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharpsObservation" ADD CONSTRAINT "SharpsObservation_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PpeObservation" ADD CONSTRAINT "PpeObservation_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PpeObservation" ADD CONSTRAINT "PpeObservation_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
