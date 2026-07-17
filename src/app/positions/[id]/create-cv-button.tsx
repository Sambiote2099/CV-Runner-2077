"use client"

import { useState } from "react"
import { createCV } from "@/app/cv/actions"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

export default function CreateCVButton({ positionId }: { positionId: string }) {
  const t = useTranslations("CV")
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const result = await createCV(positionId)
    // On success createCV redirects — we only land here on error
    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-2xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-900 px-4 py-2 text-sm text-white font-semibold transition-all duration-300 disabled:opacity-50"
    >
      {loading ? t("creating") : t("createCv")}
    </button>
  )
}
