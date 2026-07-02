"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function saveProfileAttribute(
  id: string,
  version: number,
  value: string
): Promise<{ version?: number; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // userId in WHERE ensures you can only ever save your own rows —
  // even if someone crafts a request with someone else's ProfileAttribute id.
  const result = await prisma.profileAttribute.updateMany({
    where: { id, version, userId: session.user.id },
    data: { value, version: { increment: 1 } },
  })

  if (result.count === 0) {
    // 0 rows updated = version mismatch (or wrong user) = conflict
    return { error: "conflict" }
  }

  return { version: version + 1 }
}

export async function addProfileAttribute(
  attributeId: string
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Check it's not a built-in — those are managed by the Me tab only
  const attr = await prisma.attribute.findUnique({ where: { id: attributeId } })
  if (!attr || attr.isBuiltIn) return { error: "Invalid attribute." }

  // upsert: do nothing if the row already exists (e.g. from a previous add)
  await prisma.profileAttribute.upsert({
    where: { userId_attributeId: { userId: session.user.id, attributeId } },
    update: {},
    create: { userId: session.user.id, attributeId, value: "" },
  })

  return {}
}

export async function removeProfileAttribute(
  id: string
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Guard: don't allow removing built-in attributes via this action
  const row = await prisma.profileAttribute.findUnique({
    where: { id },
    include: { attribute: true },
  })
  if (!row) return { error: "Not found." }
  if (row.attribute.isBuiltIn) return { error: "Cannot remove built-in attributes." }

  // userId in WHERE so you can only delete your own rows
  await prisma.profileAttribute.deleteMany({
    where: { id, userId: session.user.id },
  })

  return {}
}

export async function createProject(data: {
  name: string
  startDate: string
  endDate: string
  description: string
  tags: string[]
}): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.project.create({
    data: {
      userId: session.user.id,
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      description: data.description,
      tags: data.tags,
    },
  })

  return {}
}

export async function updateProject(
  id: string,
  version: number,
  data: {
    name: string
    startDate: string
    endDate: string
    description: string
    tags: string[]
  }
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const result = await prisma.project.updateMany({
    where: { id, version, userId: session.user.id },
    data: {
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      description: data.description,
      tags: data.tags,
      version: { increment: 1 },
    },
  })

  if (result.count === 0) return { error: "conflict" }
  return {}
}

export async function deleteProject(
  id: string,
  version: number
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const result = await prisma.project.deleteMany({
    where: { id, version, userId: session.user.id },
  })

  if (result.count === 0) return { error: "conflict" }
  return {}
}