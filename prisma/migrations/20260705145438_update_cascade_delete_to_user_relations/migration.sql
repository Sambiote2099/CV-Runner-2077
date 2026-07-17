-- DropForeignKey
ALTER TABLE "DiscussionPost" DROP CONSTRAINT "DiscussionPost_authorId_fkey";

-- AddForeignKey
ALTER TABLE "DiscussionPost" ADD CONSTRAINT "DiscussionPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
