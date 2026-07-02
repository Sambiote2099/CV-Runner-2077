"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { evaluateAccessRules } from "@/lib/access-rules"

export async function createCV(
  positionId: string
): Promise<{ error?: string } | void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Only candidates create CVs — admins could if needed but keep it simple for now
  if (session.user.role !== "CANDIDATE") {
    return { error: "Only candidates can create CVs." }
  }

  const userId = session.user.id

  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: {
      accessRules: true,
      positionAttributes: true,
    },
  })
  if (!position) return { error: "Position not found." }

  // Re-check access on the server — never trust the client alone
  if (!position.isPublic) {
    const profileAttrs = await prisma.profileAttribute.findMany({
      where: { userId },
    })
    const hasAccess = evaluateAccessRules(position.accessRules, profileAttrs)
    if (!hasAccess) return { error: "You don't meet the access requirements." }
  }

  // If a CV already exists, just redirect to it
  const existing = await prisma.cV.findUnique({
    where: { candidateId_positionId: { candidateId: userId, positionId } },
  })
  if (existing) redirect(`/cv/${existing.id}`)

  // Create the CV record and upsert any missing ProfileAttribute rows
  // inside a transaction so both succeed or neither does.
  //
  // Note on the loop: this is not an N+1 query pattern — we're not
  // fetching related data per list item. We're doing sequential upserts
  // inside a single transaction, which is fine for small bounded sets
  // like position attributes.
  const cv = await prisma.$transaction(async (tx) => {
    const newCv = await tx.cV.create({
      data: { candidateId: userId, positionId },
    })

    for (const pa of position.positionAttributes) {
      await tx.profileAttribute.upsert({
        where: {
          userId_attributeId: { userId, attributeId: pa.attributeId },
        },
        update: {},
        create: { userId, attributeId: pa.attributeId, value: "" },
      })
    }

    return newCv
  })

  redirect(`/cv/${cv.id}`)
}