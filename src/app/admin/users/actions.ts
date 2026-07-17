"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"

// Every action re-checks that the caller is an Admin — never trust the client alone
async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
  return session
}

export async function blockUser(userId: string): Promise<{ error?: string }> {
  const session = await requireAdmin()
  // Admins cannot block themselves
  if (userId === session.user.id) return { error: "You cannot block yourself." }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    }),
    prisma.session.deleteMany({
      where: { userId },
    }),
  ])
  revalidatePath("/admin/users")
  return {}
}

export async function unblockUser(userId: string): Promise<{ error?: string }> {
  await requireAdmin()
  await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: false },
  })
  revalidatePath("/admin/users")
  return {}
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (userId === session.user.id) return { error: "You cannot delete yourself." }

  await prisma.user.delete({ where: { id: userId } })
  revalidatePath("/admin/users")
  return {}
}

export async function setUserRole(
  userId: string,
  role: Role
): Promise<{ error?: string }> {
  const session = await requireAdmin()

  // Admin can remove their own Admin role — spec explicitly allows this.
  // But they can't change other things about themselves via this action.
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })
  revalidatePath("/admin/users")
  return {}
}