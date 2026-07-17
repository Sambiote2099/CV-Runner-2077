import { prisma } from "@/lib/prisma"
import PositionForm from "./position-form"
import { getTranslations } from "next-intl/server"

export default async function NewPositionPage() {
  const t = await getTranslations("Positions")
  
  // Fetch all attributes so the form can show a searchable selection list
  const attributes = await prisma.attribute.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })

  return (
    <div className="w-full bg-amber-50 dark:bg-slate-950 min-h-screen p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-800 dark:text-amber-100">{t("newPosition")}</h1>
      <PositionForm attributes={attributes} />
    </div>
  )
}