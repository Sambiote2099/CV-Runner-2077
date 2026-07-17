import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditPositionForm from "./edit-form"
import { getTranslations } from "next-intl/server"

export default async function EditPositionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const t = await getTranslations("Positions")

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
    <div className="w-full bg-amber-50 dark:bg-slate-950 min-h-screen p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-800 dark:text-amber-100">{t("editPosition")}</h1>
      <EditPositionForm position={position} attributes={attributes} />
    </div>
  )
}