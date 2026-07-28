-- DropForeignKey
ALTER TABLE "AccessRule" DROP CONSTRAINT "AccessRule_attributeId_fkey";

-- DropForeignKey
ALTER TABLE "PositionAttribute" DROP CONSTRAINT "PositionAttribute_attributeId_fkey";

-- DropForeignKey
ALTER TABLE "ProfileAttribute" DROP CONSTRAINT "ProfileAttribute_attributeId_fkey";

-- AddForeignKey
ALTER TABLE "PositionAttribute" ADD CONSTRAINT "PositionAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRule" ADD CONSTRAINT "AccessRule_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAttribute" ADD CONSTRAINT "ProfileAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
