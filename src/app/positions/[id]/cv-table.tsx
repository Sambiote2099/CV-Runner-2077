"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { deleteCV } from "@/app/cv/actions"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

type CVRow = {
  id: string
  version: number
  createdAt: Date
  candidate: { id: string; name: string | null; email: string }
  _count: { likes: number }
}

export default function CVTable({ cvs }: { cvs: CVRow[] }) {
  const t = useTranslations("Positions")
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

  if (selectAllRef.current) {
    selectAllRef.current.indeterminate = someSelected
  }

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
    if (!window.confirm(t("deleteCvsConfirm", { count: selectedIds.size }))) return

    setLoading(true)
    let errorCount = 0
    for (const cv of selectedCVs) {
      const result = await deleteCV(cv.id, cv.version)
      if (result?.error) errorCount++
    }
    if (errorCount > 0) toast.error(t("somethingWrong"))
    else toast.success(t("deleteSuccess"))
    setSelectedIds(new Set())
    setLoading(false)
    router.refresh()
  }

  return (
    <div>
      {/* Toolbar — always visible */}
      <div className="mb-3 flex min-h-[40px] flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400 dark:text-slate-500 mr-1">
          {noneSelected ? t("selectRowHint") : t("selectedCount", { count: selectedIds.size })}
        </span>

        {/* View — single only */}
        <Link
          href={singleSelected ? `/cv/${singleSelected.id}` : "#"}
          onClick={(e) => { if (!singleSelected) e.preventDefault() }}
          className={`rounded-lg border px-3 py-1 text-sm transition-all duration-300 ${
            singleSelected
              ? "border-amber-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700"
              : "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
          }`}
        >
          {tCommon("view")}
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
              <th className="py-2 pr-4">{t("candidate")}</th>
              <th className="py-2 pr-4">{t("likes")}</th>
              <th className="py-2">{tCommon("created")}</th>
            </tr>
          </thead>
          <tbody>
            {cvs.map((cv) => (
              <tr
                key={cv.id}
                onClick={() => toggleRow(cv.id)}
                className={`cursor-pointer hover:scale-102 hover:-translate-x-2 border-b border-amber-50 dark:border-slate-700 transition-all duration-300 ${
                  selectedIds.has(cv.id)
                    ? "bg-amber-100 dark:bg-slate-600"
                    : "hover:bg-amber-50 dark:hover:bg-slate-700"
                }`}
              >
                <td className="py-2 pl-4">
                  <input
                    type="checkbox"
                    readOnly
                    checked={selectedIds.has(cv.id)}
                    className="pointer-events-none accent-amber-500"
                  />
                </td>
                <td className="py-2 pr-4">
                  <Link
                    href={`/profile/${cv.candidate.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    {cv.candidate.name ?? cv.candidate.email}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">♥ {cv._count.likes}</td>
                <td className="py-2 text-slate-400 dark:text-slate-500">
                  {cv.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
