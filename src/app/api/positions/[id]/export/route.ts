import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Only Recruiters and Admins can export
  const session = await auth()
  if (
    session?.user?.role !== "RECRUITER" &&
    session?.user?.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch the position with its required attributes
  const position = await prisma.position.findUnique({
    where: { id },
    include: {
      positionAttributes: {
        include: { attribute: true },
        orderBy: { order: "asc" },
      },
    },
  })
  if (!position) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Fetch all published CVs for this position
  const cvs = await prisma.cV.findMany({
    where: { positionId: id, status: "PUBLISHED" },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Fetch ALL relevant ProfileAttribute values in one query — not in a loop.
  // We collect all candidate IDs and all attribute IDs first, then fetch
  // everything at once and build a lookup map.
  const candidateIds = cvs.map((cv) => cv.candidateId)
  const attributeIds = position.positionAttributes.map((pa) => pa.attributeId)

  const profileAttributes = await prisma.profileAttribute.findMany({
    where: {
      userId: { in: candidateIds },
      attributeId: { in: attributeIds },
    },
  })

  // Build a nested map: candidateId → attributeId → value
  // So we can look up any candidate's value for any attribute in O(1)
  const valueMap = new Map<string, Map<string, string>>()
  for (const pa of profileAttributes) {
    if (!valueMap.has(pa.userId)) {
      valueMap.set(pa.userId, new Map())
    }
    valueMap.get(pa.userId)!.set(pa.attributeId, pa.value)
  }

  // Build one row per CV
  const rows = cvs.map((cv) => {
    const candidateValues = valueMap.get(cv.candidateId) ?? new Map()

    // Start with fixed columns
    const row: Record<string, string> = {
      "Candidate Name": cv.candidate.name ?? "",
      "Candidate Email": cv.candidate.email ?? "",
      "CV Status": cv.status,
      "Submitted At": cv.createdAt.toLocaleDateString(),
    }

    // Add one column per position attribute, using the attribute name as the header
    for (const pa of position.positionAttributes) {
      row[pa.attribute.name] = candidateValues.get(pa.attributeId) ?? ""
    }

    return row
  })

  // Create the workbook and worksheet
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, worksheet, "CVs")

  // Write to a buffer (in-memory — we never write to disk)
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

  // Return as a file download
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${position.title} - CVs.xlsx"`,
    },
  })
}