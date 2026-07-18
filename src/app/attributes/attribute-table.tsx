"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { deleteAttribute } from "./actions"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Trash2, Pencil } from "lucide-react"

type Attribute = {
  id: string
  name: string
  category: string
  type: string
  options: string[]
  isBuiltIn: boolean
  version: number
  createdAt: Date
  updatedAt: Date
}

export default function AttributeTable({ attributes }: { attributes: Attribute[] }) {
  const t = useTranslations("Attributes")
  const tCommon = useTranslations("Common")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const selectAllRef = useRef<HTMLInputElement>(null)

  const selectedAttrs = attributes.filter((a) => selectedIds.has(a.id))
  const noneSelected = selectedIds.size === 0
  const allSelected = attributes.length > 0 && selectedIds.size === attributes.length
  const someSelected = selectedIds.size > 0 && !allSelected
  const singleSelected = selectedAttrs.length === 1 ? selectedAttrs[0] : null

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
    setSelectedIds(allSelected ? new Set() : new Set(attributes.map((a) => a.id)))
  }

  async function handleDelete() {
    const names = selectedAttrs.map((a) => a.name).join(", ")
    if (!window.confirm(t("deleteConfirm", { name: names }))) return

    setLoading(true)
    let errorCount = 0
    for (const attr of selectedAttrs) {
      const result = await deleteAttribute(attr.id, attr.version)
      if (result?.error) errorCount++
    }
    if (errorCount > 0) {
      toast.error(t("somethingWrong"))
    } else {
      toast.success(t("deleteSuccess"))
    }
    setSelectedIds(new Set())
    setLoading(false)
    router.refresh()
  }

  return (
    <div>
      {/* Toolbar — always visible */}
      <div className="mb-3 flex min-h-[40px] flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400 dark:text-slate-500 mr-1">
          {noneSelected ? t("selectRow") : t("oneSelected").replace("1", String(selectedIds.size))}
        </span>

        {/* Edit — single selection only */}
        <Link
          href={singleSelected ? `/attributes/${singleSelected.id}/edit` : "#"}
          onClick={(e) => { if (!singleSelected) e.preventDefault() }}
          className={`rounded-lg border px-2.5 flex gap-1 py-1 text-sm transition-all duration-300 ${
            singleSelected
              ? "border-amber-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700"
              : "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
          }`}
        >
          <div className="mt-1"><Pencil size={14} /></div>
          {tCommon("edit")}
        </Link>

        <button
          onClick={handleDelete}
          disabled={noneSelected || loading}
          className="flex items-center gap-1.5 rounded-lg border border-rose-300 dark:border-rose-700 px-3 py-1 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={14} />
          {tCommon("delete")}
        </button>
      </div>

      {attributes.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">{t("noAttributes")}</p>
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
                <th className="py-2">{t("name")}</th>
                <th className="py-2 pl-2">{t("category")}</th>
                <th className="py-2 pl-2">{t("type")}</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
                <tr
                  key={attr.id}
                  onClick={() => toggleRow(attr.id)}
                  className={`cursor-pointer hover:scale-102 border-b border-amber-50 dark:border-slate-700 transition-all duration-300 ${
                    selectedIds.has(attr.id)
                      ? "bg-amber-100 dark:bg-slate-600"
                      : "hover:bg-amber-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <td className="py-2 pl-4">
                    <input
                      type="checkbox"
                      readOnly
                      checked={selectedIds.has(attr.id)}
                      className="pointer-events-none accent-amber-500"
                    />
                  </td>
                  <td className="py-2 text-slate-800 dark:text-slate-200">{attr.name}</td>
                  <td className="py-2 pl-2 text-slate-600 dark:text-slate-400">{attr.category}</td>
                  <td className="py-2 pl-2 text-slate-600 dark:text-slate-400">{attr.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
