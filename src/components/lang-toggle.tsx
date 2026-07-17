"use client"

import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { setLanguage } from "@/app/lang-actions"
import type { Lang } from "@/app/lang-actions"

export default function LangToggle() {
  // useLocale() reads the current locale from the next-intl context —
  // no prop needed
  const locale = useLocale() as Lang
  const router = useRouter()

  async function toggle() {
    const next: Lang = locale === "en" ? "ru" : "en"
    await setLanguage(next)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      className="rounded-2xl border border-[#2e2e2e] font-semibold px-3 py-1 text-sm hover:bg-white dark:hover:bg-[#2e2e2e] dark:border-white transition-all duration-500 dark:text-gray-300"
    >
      {locale === "en" ? "RU" : "EN"}
    </button>
  )
}