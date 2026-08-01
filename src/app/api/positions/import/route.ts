import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// This endpoint is called by Odoo to create a position in CV Runner.
// It's protected by a static admin API key stored in .env —
// simpler than per-user auth since Odoo has no concept of CV Runner users.
export async function POST(req: Request) {
  // Verify the admin API key
  const key = req.headers.get("x-admin-key")
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid x-admin-key header." },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    )
  }

  // Validate required fields
  const { title, description, isPublic, maxProjects, projectTags, attributes } =
    body as {
      title?: string
      description?: string
      isPublic?: boolean
      maxProjects?: number
      projectTags?: string[]
      attributes?: string[]  // array of attribute IDs to link
    }

  if (!title?.trim()) {
    return NextResponse.json(
      { error: "title is required." },
      { status: 400 }
    )
  }
  if (!description?.trim()) {
    return NextResponse.json(
      { error: "description is required." },
      { status: 400 }
    )
  }

  // Validate attribute IDs if provided — must exist in the library
  let validAttributeIds: string[] = []
  if (attributes && attributes.length > 0) {
    const existingAttrs = await prisma.attribute.findMany({
      where: { id: { in: attributes } },
      select: { id: true },
    })
    validAttributeIds = existingAttrs.map((a) => a.id)

    const invalidIds = attributes.filter(
      (id) => !validAttributeIds.includes(id)
    )
    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: `Some attribute IDs don't exist: ${invalidIds.join(", ")}. ` +
            `Fetch available attributes from GET /api/attributes first.`,
        },
        { status: 400 }
      )
    }
  }

  // Create the position with linked attributes in one transaction
  const position = await prisma.$transaction(async (tx) => {
    const newPosition = await tx.position.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        isPublic: isPublic ?? true,
        maxProjects: maxProjects ?? 3,
        projectTags: (projectTags ?? []).map((t) => t.toLowerCase().trim()),
        positionAttributes: {
          create: validAttributeIds.map((attributeId, index) => ({
            attributeId,
            order: index,
          })),
        },
      },
    })
    return newPosition
  })

  return NextResponse.json(
    {
      success: true,
      position: {
        id: position.id,
        title: position.title,
        createdAt: position.createdAt,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/positions/${position.id}`,
      },
    },
    { status: 201 }
  )
}