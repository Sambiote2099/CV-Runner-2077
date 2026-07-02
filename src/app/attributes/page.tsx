import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { parseRecentIds, RECENT_ATTRS_COOKIE } from "@/lib/recently-used"
import { AttributeCategory } from "@prisma/client"
import Link from "next/link"
import { Suspense } from "react"
import AttributeTable from "./attribute-table"
import AttributeSearch from "./attribute-search"

export default async function AttributesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { q, category } = await searchParams

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
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attribute Library</h1>
        <Link
          href="/attributes/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
        >
          New Attribute
        </Link>
      </div>

      {/* Suspense is required here because AttributeSearch uses useSearchParams(),
          which needs the client JS bundle to be ready. The fallback shows instantly. */}
      <Suspense fallback={<div className="mb-4 h-10 animate-pulse rounded bg-gray-100" />}>
        <AttributeSearch />
      </Suspense>

      {recentAttributes.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-500">Recently used</h2>
          <div className="flex flex-wrap gap-2">
            {recentAttributes.map((attr) => attr && (
              <span
                key={attr.id}
                className="rounded-full border px-3 py-1 text-xs text-gray-700"
              >
                {attr.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <AttributeTable attributes={attributes} />
    </div>
  )
}