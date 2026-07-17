"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function createDiscussionPost(
  positionId: string,
  content: string
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "You must be signed in to post." }
  if (!content.trim()) return { error: "Post content cannot be empty." }

  await prisma.discussionPost.create({
    data: {
      positionId,
      authorId: session.user.id,
      content: content.trim(),
    },
  })

  return {}
}