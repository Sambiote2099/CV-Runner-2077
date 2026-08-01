import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Public read endpoint — lists all attributes in the library.
// Used by Odoo to let the user pick attributes when creating a position.
export async function GET(req: Request) {
  const key = req.headers.get("x-admin-key")
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    )
  }

  const attributes = await prisma.attribute.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      category: true,
      isBuiltIn: true,
    },
  })

  return NextResponse.json({ attributes })
}