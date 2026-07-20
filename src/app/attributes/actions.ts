"use server"

import { prisma } from "@/lib/prisma"
import { attributeFormSchema } from "@/lib/schemas/attribute"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import type { AttributeFormData } from "@/lib/schemas/attribute"
import { cookies } from "next/headers"
import { parseRecentIds, addRecentId, RECENT_ATTRS_COOKIE } from "@/lib/recently-used"

async function setRecentCookie(id: string) {
  const cookieStore = await cookies()
  const existing = parseRecentIds(cookieStore.get(RECENT_ATTRS_COOKIE)?.value)
  cookieStore.set(RECENT_ATTRS_COOKIE, JSON.stringify(addRecentId(existing, id)), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

export async function createAttribute(data: AttributeFormData) {
  // Re-check authorization on the server — never trust the client alone.
  const session = await auth()
  if (session?.user.role !== "RECRUITER" && session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const parsed = attributeFormSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { name, category, type, options, description } = parsed.data

  const created = await prisma.attribute.create({
  data: {
    name,
    category,
    type,
    description,
    options: type === "ONE_OF_MANY"
      ? options.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
  },
})

await setRecentCookie(created.id)
redirect("/attributes")
}

export async function updateAttribute(
  id: string,
  version: number,
  data: AttributeFormData
) {
  const session = await auth()
  if (session?.user.role !== "RECRUITER" && session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const parsed = attributeFormSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { name, category, type, options, description } = parsed.data

  // updateMany lets us include version in the WHERE clause.
  // If the version in the database no longer matches, count will be 0
  // meaning someone else saved a change between when we loaded and when we saved.
  const result = await prisma.attribute.updateMany({
    where: { id, version },
    data: {
      name,
      category,
      type,
      description,
      options: type === "ONE_OF_MANY"
        ? options.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      version: { increment: 1 },
    },
  })

  if (result.count === 0) {
    return { error: { _conflict: ["This attribute was edited by someone else. Please reload and try again."] } }
  }
  await setRecentCookie(id)
  redirect("/attributes")
}

export async function deleteAttribute(id: string, version: number) {
  const session = await auth()
  if (session?.user.role !== "RECRUITER" && session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  // Prevent deleting built-in attributes (First Name, Last Name, etc.)
  const attr = await prisma.attribute.findUnique({ where: { id } })
  if (attr?.isBuiltIn) {
    return { error: "Built-in attributes cannot be deleted." }
  }

  const result = await prisma.attribute.deleteMany({
    where: { id, version },
  })

  if (result.count === 0) {
    return { error: "This attribute was already modified or deleted. Please reload." }
  }

  redirect("/attributes")
}