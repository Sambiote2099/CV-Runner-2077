"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { AttributeCategory } from "@prisma/client"
import { useTranslations } from "next-intl"

export default function AttributeSearch() {
  const t = useTranslations("Attributes")
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="mb-4 flex gap-3">
      <input
        key={searchParams.get("q") ?? ""}
        type="text"
        placeholder={t("searchByName")}
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => update("q", e.target.value)}
        className="rounded-lg border bg-white border-amber-200 dark:border-slate-600 dark:bg-[#2e2e2e] px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
      />
      <select
        defaultValue={searchParams.get("category") ?? ""}
        onChange={(e) => update("category", e.target.value)}
        className="rounded-lg border border-amber-200 dark:border-slate-600 bg-white dark:bg-[#2e2e2e] px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
      >
        <option value="">{t("allCategories")}</option>
        {Object.values(AttributeCategory).map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
  )
}
