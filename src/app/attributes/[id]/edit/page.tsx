import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditAttributeForm from "./edit-form"

export default async function EditAttributePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const attribute = await prisma.attribute.findUnique({ where: { id } })
  if (!attribute) notFound()

  return (
    <div className="max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit Attribute</h1>
      <EditAttributeForm attribute={attribute} />
    </div>
  )
}