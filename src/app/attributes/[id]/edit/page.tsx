import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditAttributeForm from "./edit-form"
import { getTranslations } from "next-intl/server"

export default async function EditAttributePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const t = await getTranslations("Attributes")

  const attribute = await prisma.attribute.findUnique({ where: { id } })
  if (!attribute) notFound()

  return (
    <div className="bg-amber-50 dark:bg-slate-950 min-h-screen">
    <div className="max-w-md p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-800 dark:text-amber-100">{t("editAttribute")}</h1>
      <EditAttributeForm attribute={attribute} />
    </div>
    </div>
  )
}