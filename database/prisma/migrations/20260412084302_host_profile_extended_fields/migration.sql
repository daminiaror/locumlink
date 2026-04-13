-- AlterTable
ALTER TABLE "host_profiles" ADD COLUMN     "accommodationProvided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "address1" TEXT,
ADD COLUMN     "address2" TEXT,
ADD COLUMN     "contactFirstName" TEXT,
ADD COLUMN     "contactLastName" TEXT,
ADD COLUMN     "cpsnsNumber" TEXT,
ADD COLUMN     "emr" TEXT,
ADD COLUMN     "licenseFile" TEXT,
ADD COLUMN     "numPhysicians" TEXT,
ADD COLUMN     "patientVol" TEXT,
ADD COLUMN     "practiceType" TEXT,
ADD COLUMN     "speciality" TEXT;
