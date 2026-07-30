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

  // Fetch the user's built-in profile attributes (First Name, Last Name)
  // These are the "non-removable fields" the spec mentions
  const builtInAttrs = await prisma.profileAttribute.findMany({
    where: {
      userId: session.user.id,
      attribute: { isBuiltIn: true },
    },
    include: { attribute: true },
  })

  // Build a map of attribute name → value for easy lookup
  const attrMap = new Map(
    builtInAttrs.map((pa) => [pa.attribute.name, pa.value])
  )

  const firstName = attrMap.get("First Name") ?? ""
  const lastName = attrMap.get("Last Name") ?? ""
  const email = session.user.email ?? ""

  // Validate the minimum required fields
  if (!firstName.trim() || !lastName.trim()) {
    return {
      error: "Please fill in your First Name and Last Name in the Me tab before pushing to Salesforce.",
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
