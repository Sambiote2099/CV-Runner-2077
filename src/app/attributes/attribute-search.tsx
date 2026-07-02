"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { AttributeCategory } from "@prisma/client"

export default function AttributeSearch() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  function update(key: string, value: string) {
    // Build a new query string with the changed param, then replace the URL.
    // router.replace instead of router.push so the browser Back button isn't
    // cluttered with every keystroke.
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
        type="text"
        placeholder="Search by name…"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => update("q", e.target.value)}
        className="rounded border px-3 py-2 text-sm"
      />
      <select
        defaultValue={searchParams.get("category") ?? ""}
        onChange={(e) => update("category", e.target.value)}
        className="rounded border px-3 py-2 text-sm"
      >
        <option value="">All categories</option>
        {Object.values(AttributeCategory).map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
  )
}