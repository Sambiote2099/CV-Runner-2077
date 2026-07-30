"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createSalesforceContact, type SalesforceContactData } from "@/lib/salesforce"

// Loosely validates phone numbers: optional leading +, then digits, spaces,
// dashes, and parentheses, 7–20 characters. Intentionally permissive since
// international formats vary a lot — this just catches obviously-malformed
// input (letters, symbols, way-too-short/long strings).
const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/

export async function pushToSalesforce(
  data: {
    targetUserId?: string // omit when pushing your own profile
    phone: string
    site: string
    jobTitle: string
    department: string
    birthdate: string
    languages: string
    description: string
  }
): Promise<{ success?: boolean; accountId?: string; contactId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Defaults to the logged-in user — i.e. pushing your own profile.
  const targetUserId = data.targetUserId ?? session.user.id

  // Pushing someone else's data is Admin-only. This is enforced here, not
  // just by hiding the button in the UI, since a server action can in
  // principle be called directly.
  if (targetUserId !== session.user.id && session.user.role !== "ADMIN") {
    return { error: "You don't have permission to push this profile to Salesforce." }
  }

  // Always look up the target user's own record — never trust a
  // client-supplied email, and never fall back to session.user's email,
  // which would be the *logged-in* user (e.g. the Admin), not the profile
  // actually being pushed.
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!targetUser) {
    return { error: "User not found." }
  }

  // Fetch the target user's built-in profile attributes (First Name, Last Name)
  const builtInAttrs = await prisma.profileAttribute.findMany({
    where: {
      userId: targetUserId,
      attribute: { isBuiltIn: true },
    },
    include: { attribute: true },
  })

  const attrMap = new Map(
    builtInAttrs.map((pa) => [pa.attribute.name, pa.value])
  )

  const firstName = attrMap.get("First Name") ?? ""
  const lastName = attrMap.get("Last Name") ?? ""
  const email = targetUser.email ?? ""

  // Validate the minimum required fields
  if (!firstName.trim() || !lastName.trim()) {
    return {
      error: "First Name and Last Name must be filled in on the Me tab before pushing to Salesforce.",
    }
  }
  if (data.phone.trim() && !PHONE_REGEX.test(data.phone.trim())) {
    return { error: "Phone number looks invalid. Use digits, spaces, +, -, and parentheses only." }
  }

  const contactData: SalesforceContactData = {
    firstName,
    lastName,
    email,
    phone: data.phone,
    site: data.site,
    jobTitle: data.jobTitle,
    department: data.department,
    birthdate: data.birthdate,
    languages: data.languages,
    description: data.description,
  }

  try {
    const result = await createSalesforceContact(contactData)
    return {
      success: true,
      accountId: result.accountId,
      contactId: result.contactId,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return { error: `Salesforce error: ${message}` }
  }
}