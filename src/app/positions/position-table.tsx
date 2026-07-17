"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { deletePosition, duplicatePosition } from "./actions"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Copy, Pencil, Trash2 } from "lucide-react"

type PositionRow = {
  id: string
  title: string
  isPublic: boolean
  version: number
  createdAt: Date
  _count: { positionAttributes: number }
  cvs: { id: string }[]
}

export default function PositionTable({ positions }: { positions: PositionRow[] }) {
  const t = useTranslations("Positions")
  const tCommon = useTranslations("Common")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const selectAllRef = useRef<HTMLInputElement>(null)

  const selectedPositions = positions.filter((p) => selectedIds.has(p.id))
  const noneSelected = selectedIds.size === 0
  const allSelected = positions.length > 0 && selectedIds.size === positions.length
  const someSelected = selectedIds.size > 0 && !allSelected
  const singleSelected = selectedPositions.length === 1 ? selectedPositions[0] : null

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
    setSelectedIds(allSelected ? new Set() : new Set(positions.map((p) => p.id)))
  }

  async function handleDelete() {
    const titles = selectedPositions.map((p) => p.title).join(", ")
    if (!window.confirm(t("deleteConfirm", { title: titles }))) return

    setLoading(true)
    let errorCount = 0
    for (const pos of selectedPositions) {
      const result = await deletePosition(pos.id, pos.version)
      if (result?.error) errorCount++
    }
    if (errorCount > 0) toast.error(t("somethingWrong"))
    else toast.success(t("deleteSuccess"))
    setSelectedIds(new Set())
    setLoading(false)
    router.refresh()
  }

  async function handleDuplicate() {
    if (!singleSelected) return
    setLoading(true)
    const result = await duplicatePosition(singleSelected.id)
    if (result?.error) toast.error(result.error)
    else toast.success(t("duplicateSuccess"))
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

        {/* Edit — single only */}
        <Link
          href={singleSelected ? `/positions/${singleSelected.id}/edit` : "#"}
          onClick={(e) => { if (!singleSelected) e.preventDefault() }}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-sm transition-all duration-300 ${
            singleSelected
              ? "border-amber-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700"
              : "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
          }`}
        >
          <Pencil size={14} />
          {tCommon("edit")}
        </Link>

        {/* Duplicate — single only */}
        <button
          onClick={handleDuplicate}
          disabled={!singleSelected || loading}
          className="flex items-center gap-1.5 rounded-lg border border-amber-200 dark:border-slate-600 px-3 py-1 text-sm text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Copy size={14} />
          {tCommon("duplicate")}
        </button>

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

      {positions.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">{t("noPositions")}</p>
      ) : (
        <div className="bg-white p-2 dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 shadow-sm overflow-x-auto sm:overflow-visible">
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
                <th className="py-2 pr-4">{t("titleLabel")}</th>
                <th className="py-2 pr-4">{tCommon("access")}</th>
                <th className="py-2 pr-4">{t("attributes")}</th>
                <th className="py-2">{tCommon("created")}</th>
                <th className="py-2 pl-2 pr-4">{t("peopleApplied")}</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr
                  key={pos.id}
                  onClick={() => toggleRow(pos.id)}
                  className={`cursor-pointer hover:scale-102 border-b border-amber-50 dark:border-slate-700 transition-all duration-300 ${
                    selectedIds.has(pos.id)
                      ? "bg-amber-100 dark:bg-slate-600"
                      : "hover:bg-amber-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <td className="py-2 pl-4">
                    <input
                      type="checkbox"
                      readOnly
                      checked={selectedIds.has(pos.id)}
                      className="pointer-events-none accent-amber-500"
                    />
                  </td>
                  <td className="py-2 pr-4 font-medium">
                    <Link
                      href={`/positions/${pos.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400"
                    >
                      {pos.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      pos.isPublic
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                    }`}>
                      {pos.isPublic ? tCommon("public") : tCommon("restricted")}
                    </span>
                  </td>
                  <td className="py-2 pl-6 pr-4 text-slate-500 dark:text-slate-400">{pos._count.positionAttributes}</td>
                  <td className="py-2 text-slate-500 dark:text-slate-400">{pos.createdAt.toLocaleDateString()}</td>
                  <td className="py-2 pl-6 pr-4 text-slate-500 dark:text-slate-400">{pos.cvs.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
