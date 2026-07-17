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

export async function publishCV(
  id: string,
  version: number
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const cv = await prisma.cV.findUnique({
    where: { id },
    include: { position: { include: { positionAttributes: true } } },
  })
  if (!cv) return { error: "CV not found." }

  // Only the owner (or admin) can publish
  if (cv.candidateId !== session.user.id && session.user.role !== "ADMIN") {
    return { error: "Unauthorized." }
  }

  // Re-verify all required attributes are filled before publishing —
  // the client already checks this, but we never trust the client alone
  const requiredIds = cv.position.positionAttributes.map((pa) => pa.attributeId)
  const profileAttrs = await prisma.profileAttribute.findMany({
    where: { userId: cv.candidateId, attributeId: { in: requiredIds } },
  })

  const allFilled = requiredIds.every((attrId) => {
    const pa = profileAttrs.find((p) => p.attributeId === attrId)
    return pa && pa.value.trim() !== ""
  })

  if (!allFilled) {
    return { error: "Fill in all required attributes before publishing." }
  }

  // Version-checked update — same optimistic locking pattern as everywhere else
  const result = await prisma.cV.updateMany({
    where: { id, version },
    data: { status: "PUBLISHED", version: { increment: 1 } },
  })

  if (result.count === 0) {
    return { error: "This CV was changed elsewhere. Please reload." }
  }
  return {}
}

export async function toggleLike(
  cvId: string
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  if (session.user.role !== "RECRUITER" && session.user.role !== "ADMIN") {
    return { error: "Only recruiters can like CVs." }
  }

  const recruiterId = session.user.id

  // Check if like already exists
  const existing = await prisma.like.findUnique({
    where: { recruiterId_cvId: { recruiterId, cvId } },
  })

  if (existing) {
    // Unlike
    await prisma.like.delete({ where: { id: existing.id } })
  } else {
    // Like
    await prisma.like.create({ data: { recruiterId, cvId } })
  }

  return {}
}

export async function deleteCV(
  id: string,
  version: number
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const cv = await prisma.cV.findUnique({ where: { id } })
  if (!cv) return { error: "CV not found." }

  // Only the owner or an Admin can delete
  if (cv.candidateId !== session.user.id && session.user.role !== "ADMIN") {
    return { error: "Unauthorized." }
  }

  const result = await prisma.cV.deleteMany({
    where: { id, version },
  })

  if (result.count === 0) {
    return { error: "CV was modified elsewhere. Please reload." }
  }

  return {}
}