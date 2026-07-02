"use server"

import { prisma } from "@/lib/prisma"
import { positionFormSchema, type PositionFormData } from "@/lib/schemas/position"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

// Small helper so we don't repeat this check in every action
async function requireRecruiter() {
  const session = await auth()
  const role = session?.user.role
  if (role !== "RECRUITER" && role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
}

export async function createPosition(data: PositionFormData) {
  await requireRecruiter()

  const parsed = positionFormSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { title, description, isPublic, maxProjects, projectTags, attributeIds, accessRules } =
  parsed.data

await prisma.position.create({
  data: {
    title,
    description,
    isPublic,
    maxProjects,
    projectTags: projectTags.split(",").map((s) => s.trim()).filter(Boolean),
    positionAttributes: {
      create: attributeIds.map((attributeId, index) => ({
        attributeId,
        order: index,
      })),
    },
    // Save each access rule linked to this position
    accessRules: {
      create: accessRules.map((rule) => ({
        attributeId: rule.attributeId,
        operator: rule.operator,
        value: rule.value,
      })),
    },
  },
})

  redirect("/positions")
}

export async function duplicatePosition(id: string) {
  await requireRecruiter()

  const original = await prisma.position.findUnique({
    where: { id },
    include: { positionAttributes: true, accessRules: true },
  })

  if (!original) return { error: "Position not found" }

  await prisma.position.create({
    data: {
      title: `Copy of ${original.title}`,
      description: original.description,
      isPublic: original.isPublic,
      maxProjects: original.maxProjects,
      projectTags: original.projectTags,
      // Copy linked attributes and access rules verbatim
      positionAttributes: {
        create: original.positionAttributes.map((pa) => ({
          attributeId: pa.attributeId,
          order: pa.order,
        })),
      },
      accessRules: {
        create: original.accessRules.map((rule) => ({
          attributeId: rule.attributeId,
          operator: rule.operator,
          value: rule.value,
        })),
      },
    },
  })

  redirect("/positions")
}

export async function updatePosition(
  id: string,
  version: number,
  data: PositionFormData
) {
  await requireRecruiter()

  const parsed = positionFormSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { title, description, isPublic, maxProjects, projectTags, attributeIds, accessRules } =
  parsed.data

  // Delete existing attribute links first, then recreate them.
  // This is simpler than diffing which ones were added/removed.
  // Both operations are wrapped in a transaction so they succeed or fail together.
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.position.updateMany({
      where: { id, version },
      data: {
        title,
        description,
        isPublic,
        maxProjects,
        projectTags: projectTags.split(",").map((s) => s.trim()).filter(Boolean),
        version: { increment: 1 },
      },
    })

    if (updated.count === 0) return null

    await tx.positionAttribute.deleteMany({ where: { positionId: id } })
    await tx.positionAttribute.createMany({
      data: attributeIds.map((attributeId, index) => ({
        positionId: id,
        attributeId,
        order: index,
      })),
    })
    await tx.accessRule.deleteMany({ where: { positionId: id } })
    await tx.accessRule.createMany({
      data: accessRules.map((rule) => ({
        positionId: id,
        attributeId: rule.attributeId,
        operator: rule.operator,
        value: rule.value,
      })),
    })

    return updated
  })

  if (!result) {
    return {
      error: {
        _conflict: ["This position was edited by someone else. Please reload and try again."],
      },
    }
  }

  redirect("/positions")
}

export async function deletePosition(id: string, version: number) {
  await requireRecruiter()

  const result = await prisma.position.deleteMany({
    where: { id, version },
  })

  if (result.count === 0) {
    return { error: "This position was already modified or deleted. Please reload." }
  }

  redirect("/positions")
}