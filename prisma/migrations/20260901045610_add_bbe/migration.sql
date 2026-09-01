-- CreateTable
CREATE TABLE "BbeObservation" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "doctorStaffCount" INTEGER NOT NULL,
    "doctorCompliantCount" INTEGER NOT NULL,
    "nurseStaffCount" INTEGER NOT NULL,
    "nurseCompliantCount" INTEGER NOT NULL,
    "cleanerStaffCount" INTEGER NOT NULL,
    "cleanerCompliantCount" INTEGER NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BbeObservation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BbeObservation" ADD CONSTRAINT "BbeObservation_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BbeObservation" ADD CONSTRAINT "BbeObservation_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
