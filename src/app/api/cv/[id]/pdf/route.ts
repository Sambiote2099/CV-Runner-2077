import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { renderToStream } from "@react-pdf/renderer"
import QRCode from "qrcode"
import CVDocument from "./cv-document"
import React from "react"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cv = await prisma.cV.findUnique({
    where: { id },
    include: {
      candidate: true,
      position: {
        include: {
          positionAttributes: {
            include: { attribute: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })
  if (!cv) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Only the owner or a recruiter/admin can download
  const isOwner = session.user.id === cv.candidateId
  const isRecruiterOrAdmin =
    session.user.role === "RECRUITER" || session.user.role === "ADMIN"
  if (!isOwner && !isRecruiterOrAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Recruiters can only download published CVs
  if (isRecruiterOrAdmin && !isOwner && cv.status !== "PUBLISHED") {
    return NextResponse.json({ error: "CV not published" }, { status: 403 })
  }

  // Fetch attribute values — same live-lookup pattern as the CV page
  const requiredAttributeIds = cv.position.positionAttributes.map(
    (pa) => pa.attributeId
  )
  const profileAttributes = await prisma.profileAttribute.findMany({
    where: { userId: cv.candidateId, attributeId: { in: requiredAttributeIds } },
  })
  const profileAttrMap = new Map(
    profileAttributes.map((pa) => [pa.attributeId, pa.value])
  )

  // Fetch filtered projects — same logic as CV page
  const projects = await prisma.project.findMany({
    where: {
      userId: cv.candidateId,
      ...(cv.position.projectTags.length > 0
        ? { tags: { hasSome: cv.position.projectTags } }
        : {}),
    },
    orderBy: { startDate: "desc" },
    take: cv.position.maxProjects,
  })

  // Build the CV URL — used both in the footer text and encoded in the QR code
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get("origin") ?? ""
  const cvUrl = `${appUrl}/cv/${id}`

  // Generate QR code as a base64 PNG data URL — embeddable in the PDF as an image
  const qrDataUrl = await QRCode.toDataURL(cvUrl, { width: 150 })

  // Build the attributes array for the PDF component
  const attributes = cv.position.positionAttributes.map((pa) => ({
  name: pa.attribute.name,
  value: profileAttrMap.get(pa.attributeId) ?? "",
  type: pa.attribute.type,   // ← pass the type so the document knows how to render it
}))

  // Render the PDF — renderToStream returns a Node.js readable stream
  const stream = await renderToStream(
  React.createElement(CVDocument, {
    positionTitle: cv.position.title,
    candidateName: cv.candidate.name ?? cv.candidate.email ?? "",
    status: cv.status,
    attributes,
    projects,
    qrDataUrl,
    cvUrl,
  }) as React.ReactElement<any>
)

  // Convert the stream to a buffer so we can return it as a Response
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on("data", (chunk: Buffer) => chunks.push(chunk))
    stream.on("end", () => resolve(Buffer.concat(chunks)))
    stream.on("error", reject)
  })

  const filename = `${cv.position.title} - ${cv.candidate.name ?? "CV"}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
  },
})
}