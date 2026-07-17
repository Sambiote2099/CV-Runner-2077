import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const posts = await prisma.discussionPost.findMany({
    where: { positionId: id },
    include: { author: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(posts)
}