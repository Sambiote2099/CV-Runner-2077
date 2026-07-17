"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"

export default function SearchBar({ placeholder }: { placeholder?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const t = useTranslations("Nav")

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      }
    }, 400)

    return () => clearTimeout(timeout)
  }, [query, router])

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder={placeholder ?? t("search")}
      className="rounded-2xl bg-white px-3 py-1 border-2 border-[#2e2e2e] dark:border-white text-sm w-full md:w-48 dark:bg-[#2e2e2e] text-[#2e2e2e] dark:text-white"
    />
  )
}