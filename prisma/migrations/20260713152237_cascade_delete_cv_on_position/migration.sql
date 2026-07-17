-- DropForeignKey
ALTER TABLE "CV" DROP CONSTRAINT "CV_positionId_fkey";

-- AddForeignKey
ALTER TABLE "CV" ADD CONSTRAINT "CV_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
