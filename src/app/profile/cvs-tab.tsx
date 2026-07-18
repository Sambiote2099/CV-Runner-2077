"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { deleteCV } from "@/app/cv/actions"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

type Position = {
  id: string
  title: string
  description: string
  isPublic: boolean
  maxProjects: number
  projectTags: string[]
  version: number
  createdAt: Date
  updatedAt: Date
}

type CV = {
  id: string
  candidateId: string
  positionId: string
  status: string
  version: number
  createdAt: Date
  updatedAt: Date
  position: Position
}

type CVWithAccess = CV & {
  position: Position
  isAccessible: boolean
}

export default function CVsTab({ cvs }: { cvs: CVWithAccess[] }) {
  const t = useTranslations("Profile")
  const tCommon = useTranslations("Common")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const selectAllRef = useRef<HTMLInputElement>(null)

  const selectedCVs = cvs.filter((cv) => selectedIds.has(cv.id))
  const noneSelected = selectedIds.size === 0
  const allSelected = cvs.length > 0 && selectedIds.size === cvs.length
  const someSelected = selectedIds.size > 0 && !allSelected
  const singleSelected = selectedCVs.length === 1 ? selectedCVs[0] : null

  useEffect(() => {
      if (selectAllRef.current) {
        selectAllRef.current.indeterminate = someSelected
      }
    }, [someSelected])

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(cvs.map((cv) => cv.id)))
  }

  async function handleDelete() {
    const titles = selectedCVs.map((cv) => cv.position.title).join(", ")
    if (!window.confirm(t("deleteCvConfirm", { title: titles }))) return

    setLoading(true)
    let errorCount = 0
    for (const cv of selectedCVs) {
      const result = await deleteCV(cv.id, cv.version)
      if (result?.error) errorCount++
    }
    if (errorCount > 0) toast.error(tCommon("somethingWrong"))
    else toast.success(t("deleteCvSuccess"))
    setSelectedIds(new Set())
    setLoading(false)
    router.refresh()
  }

  if (cvs.length === 0) {
    return (
      <div>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {t("noCvs")}{" "}
          <Link href="/positions" className="text-amber-600 dark:text-amber-400 underline">
            {t("browseTo")}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar — always visible */}
      <div className="flex min-h-[40px] flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400 dark:text-slate-500 mr-1">
          {noneSelected ? t("selectRowCvHint") : t("selectedCount", { count: selectedIds.size })}
        </span>

        {/* Open — single accessible CV only */}
        <Link
          href={singleSelected?.isAccessible ? `/cv/${singleSelected.id}` : "#"}
          onClick={(e) => { if (!singleSelected?.isAccessible) e.preventDefault() }}
          className={`rounded-lg border px-3 py-1 text-sm transition-all duration-300 ${
            singleSelected?.isAccessible
              ? "border-amber-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700"
              : "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
          }`}
        >
          {t("openCv")}
        </Link>

        {/* Delete — multi */}
        <button
          onClick={handleDelete}
          disabled={noneSelected || loading}
          className="flex items-center gap-1.5 rounded-lg border border-rose-300 dark:border-rose-700 px-3 py-1 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={14} />
          {tCommon("delete")}
        </button>
      </div>

      <div className="bg-white p-2 dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-amber-100 dark:border-slate-600 font-semibold text-slate-600 dark:text-slate-300">
              <th className="w-8 py-2 pl-4">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="accent-amber-500 cursor-pointer"
                />
              </th>
              <th className="py-2 pr-4">{t("positionCol")}</th>
              <th className="py-2 pr-4">{t("status")}</th>
              <th className="py-2 pr-4">{tCommon("access")}</th>
              <th className="py-2">{tCommon("created")}</th>
            </tr>
          </thead>
          <tbody>
            {cvs.map((cv) => (
              <tr
                key={cv.id}
                onClick={() => toggleRow(cv.id)}
                className={`cursor-pointer hover:scale-102 hover:-translate-x-2 border-b border-amber-50 dark:border-slate-700 transition-all duration-300 ${
                  !cv.isAccessible ? "opacity-50" : ""
                } ${
                  selectedIds.has(cv.id)
                    ? "bg-amber-100 dark:bg-slate-600"
                    : "hover:bg-amber-50 dark:hover:bg-slate-700"
                }`}
              >
                <td className="py-2 pl-4">
                  <input type="checkbox" readOnly checked={selectedIds.has(cv.id)} className="pointer-events-none accent-amber-500" />
                </td>
                <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-200">{cv.position.title}</td>
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    cv.status === "PUBLISHED"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                  }`}>
                    {cv.status === "PUBLISHED" ? tCommon("published") : tCommon("draft")}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  {cv.isAccessible ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">{t("accessible")}</span>
                  ) : (
                    <span className="text-xs text-rose-500 dark:text-rose-400">{t("accessLost")}</span>
                  )}
                </td>
                <td className="py-2 text-slate-400 dark:text-slate-500">{cv.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
