import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { parseRecentIds, RECENT_ATTRS_COOKIE } from "@/lib/recently-used"
import { AttributeCategory } from "@prisma/client"
import Link from "next/link"
import { Suspense } from "react"
import AttributeTable from "./attribute-table"
import AttributeSearch from "./attribute-search"
import { getTranslations } from "next-intl/server"

export default async function AttributesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { q, category } = await searchParams
  const t = await getTranslations("Attributes")

  // Filtered main list
  const attributes = await prisma.attribute.findMany({
    where: {
      ...(q ? { name: { startsWith: q, mode: "insensitive" as const } } : {}),
      ...(category ? { category: category as AttributeCategory } : {}),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })

  // Recently used — read from cookie, then fetch those rows in order
  const cookieStore = await cookies()
  const recentIds = parseRecentIds(cookieStore.get(RECENT_ATTRS_COOKIE)?.value)
  const recentAttributes = recentIds.length > 0
    ? await prisma.attribute.findMany({ where: { id: { in: recentIds } } })
      .then((rows) =>
        // Restore cookie order (findMany doesn't guarantee it)
        recentIds.map((id) => rows.find((r) => r.id === id)).filter(Boolean)
      )
    : []

  return (
    <div className="p-4 md:p-6 bg-amber-50 dark:bg-slate-950 min-h-screen">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-amber-100">{t("title")}</h1>
        <Link
          href="/attributes/new"
          className="rounded-2xl font-semibold bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-900 px-4 py-2 text-sm text-white transition-all duration-300"
        >
          {t("newAttribute")} +
        </Link>
      </div>

      <Suspense fallback={<div className="mb-4 h-10 animate-pulse rounded-lg bg-amber-100 dark:bg-slate-700" />}>
        <AttributeSearch />
      </Suspense>

      {recentAttributes.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{t("recentlyUsed")}</h2>
          <div className="flex flex-wrap gap-2">
            {recentAttributes.map((attr) => attr && (
              <Link
                key={attr.id}
                href={`/attributes?q=${encodeURIComponent(attr.name)}`}
                className="rounded-full border border-amber-300 dark:border-white bg-amber-50 dark:bg-[#2e2e2e] px-3 py-1 text-xs text-[#2e2e2e] font-semibold dark:text-white 
                hover:-translate-y-1 hover:translate-x-1 duration-500 transition-all hover:bg-amber-400 dark:hover:bg-gray-700"
              >
                {attr.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <AttributeTable attributes={attributes} />
    </div>
  )
}