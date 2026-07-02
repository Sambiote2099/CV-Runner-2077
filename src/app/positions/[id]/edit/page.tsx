import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditPositionForm from "./edit-form"

export default async function EditPositionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [position, attributes] = await Promise.all([
    prisma.position.findUnique({
      where: { id },
      include: {
        positionAttributes: { orderBy: { order: "asc" } },
        accessRules: true,
      },
    }),
    prisma.attribute.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ])

  if (!position) notFound()

  return (
    <div className="max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit Position</h1>
      <EditPositionForm position={position} attributes={attributes} />
    </div>
  )
}