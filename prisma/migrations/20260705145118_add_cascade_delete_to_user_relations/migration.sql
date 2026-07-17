-- DropForeignKey
ALTER TABLE "CV" DROP CONSTRAINT "CV_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_recruiterId_fkey";

-- AddForeignKey
ALTER TABLE "CV" ADD CONSTRAINT "CV_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
