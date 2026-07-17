"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

export default function PDFButton({ cvId }: { cvId: string }) {
  const t = useTranslations("CV")
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    const res = await fetch(`/api/cv/${cvId}/pdf`)
    if (!res.ok) {
      alert("Could not generate PDF.")
      setLoading(false)
      return
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "cv.pdf"
    link.click()
    URL.revokeObjectURL(url)
    setLoading(false)
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="rounded-lg border border-amber-200 dark:border-slate-600 px-3 py-1 text-sm text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-300 disabled:opacity-50"
    >
      {t("downloadPdf")}
    </button>
  )
}
