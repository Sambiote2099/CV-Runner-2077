import { prisma } from "@/lib/prisma"
import PositionForm from "./position-form"

export default async function NewPositionPage() {
  // Fetch all attributes so the form can show a searchable selection list
  const attributes = await prisma.attribute.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })

  return (
    <div className="max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">New Position</h1>
      <PositionForm attributes={attributes} />
    </div>
  )
}