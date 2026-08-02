"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { uploadJsonToDropbox } from "@/lib/dropbox"

type Priority = "High" | "Average" | "Low"

export async function createSupportTicket(data: {
  summary: string
  priority: Priority
  link: string
}): Promise<{ success?: boolean; error?: string }> {
  const session = await auth()

  if (!data.summary.trim()) {
    return { error: "Summary is required." }
  }

  // "Reported by" — current user with role, or Anonymous if not signed in
  const reportedBy = session?.user
    ? `${session.user.name ?? session.user.email} (${session.user.role})`
    : "Anonymous (not signed in)"

  // Try to resolve a Position title from the page the ticket was raised on.
  // Handles /positions/[id] directly, and /cv/[id] by looking up the CV's position.
  let positionTitle: string | null = null
  try {
    const url = new URL(data.link)
    const positionMatch = url.pathname.match(/\/positions\/([^\/?]+)/)
    const cvMatch = url.pathname.match(/\/cv\/([^\/?]+)/)

    if (positionMatch && positionMatch[1] !== "new") {
      const position = await prisma.position.findUnique({
        where: { id: positionMatch[1] },
        select: { title: true },
      })
      positionTitle = position?.title ?? null
    } else if (cvMatch) {
      const cv = await prisma.cV.findUnique({
        where: { id: cvMatch[1] },
        select: { position: { select: { title: true } } },
      })
      positionTitle = cv?.position.title ?? null
    }
  } catch {
    // Invalid URL or lookup miss — not fatal, position just stays null
  }

  // Admin emails to notify — Power Automate reads this array from the JSON
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  })
  const adminEmails = admins.map((a) => a.email).filter(Boolean)

  const ticket = {
    reportedBy,
    position: positionTitle,
    link: data.link,
    priority: data.priority,
    summary: data.summary.trim(),
    adminEmails,
    createdAt: new Date().toISOString(),
  }

  try {
    await uploadJsonToDropbox(`ticket-${Date.now()}.json`, ticket)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return { error: `Failed to submit ticket: ${message} (must be logged in)` }
  }

  return { success: true }
}