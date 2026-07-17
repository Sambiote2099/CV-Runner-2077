"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// Returns the effective userId — either the caller's own ID, or a target
// user's ID if the caller is an Admin acting on someone else's profile.
async function resolveUserId(targetUserId?: string): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (targetUserId && session.user.role === "ADMIN") {
    return targetUserId
  }
  return session.user.id
}

export async function saveProfileAttribute(
  id: string,
  version: number,
  value: string
): Promise<{ version?: number; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const isAdmin = session.user.role === "ADMIN"

  // Admins can save any ProfileAttribute row — skip userId restriction.
  // For regular users, userId in WHERE ensures you only save your own rows.
  const result = await prisma.profileAttribute.updateMany({
    where: {
      id,
      version,
      ...(isAdmin ? {} : { userId: session.user.id }),
    },
    data: { value, version: { increment: 1 } },
  })

  if (result.count === 0) return { error: "conflict" }
  return { version: version + 1 }
}

export async function addProfileAttribute(
  attributeId: string,
  targetUserId?: string
): Promise<{ error?: string }> {
  const userId = await resolveUserId(targetUserId)

  const attr = await prisma.attribute.findUnique({ where: { id: attributeId } })
  if (!attr || attr.isBuiltIn) return { error: "Invalid attribute." }

  await prisma.profileAttribute.upsert({
    where: { userId_attributeId: { userId, attributeId } },
    update: {},
    create: { userId, attributeId, value: "" },
  })

  return {}
}

export async function removeProfileAttribute(
  id: string,
  targetUserId?: string
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const isAdmin = session.user.role === "ADMIN"

  const row = await prisma.profileAttribute.findUnique({
    where: { id },
    include: { attribute: true },
  })
  if (!row) return { error: "Not found." }
  if (row.attribute.isBuiltIn) return { error: "Cannot remove built-in attributes." }

  await prisma.profileAttribute.deleteMany({
    where: {
      id,
      ...(isAdmin ? {} : { userId: session.user.id }),
    },
  })

  return {}
}

export async function createProject(data: {
  name: string
  startDate: string
  endDate: string
  description: string
  tags: string[]
}, targetUserId?: string): Promise<{ error?: string }> {
  const userId = await resolveUserId(targetUserId)

  await prisma.project.create({
    data: {
      userId,
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      description: data.description,
      tags: data.tags.map((t) => t.toLowerCase()),
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

  const isAdmin = session.user.role === "ADMIN"

  const result = await prisma.project.updateMany({
    where: {
      id,
      version,
      ...(isAdmin ? {} : { userId: session.user.id }),
    },
    data: {
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      description: data.description,
      tags: data.tags.map((t) => t.toLowerCase()),
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

  const isAdmin = session.user.role === "ADMIN"

  const result = await prisma.project.deleteMany({
    where: {
      id,
      version,
      ...(isAdmin ? {} : { userId: session.user.id }),
    },
  })

  if (result.count === 0) return { error: "conflict" }
  return {}
}