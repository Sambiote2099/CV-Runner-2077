"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { publishCV } from "@/app/cv/actions"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

export default function CVPublishButton({
  cvId,
  version,
  allFilled,
}: {
  cvId: string
  version: number
  allFilled: boolean
}) {
  const t = useTranslations("CV")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handlePublish() {
    setLoading(true)
    const result = await publishCV(cvId, version)
    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    toast.success(t("publishSuccess"))
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-amber-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
        {allFilled ? t("allFilled") : t("fillRequired")}
      </p>
      <button
        onClick={handlePublish}
        disabled={!allFilled || loading}
        className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 py-2 text-sm text-white font-semibold transition-all duration-300 disabled:opacity-50"
      >
        {loading ? t("publishing") : t("publishCv")}
      </button>
    </div>
  )
}
