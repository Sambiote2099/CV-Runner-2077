"use client"

import { useTheme } from "./theme-provider"
import { useTranslations } from "next-intl"

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const t = useTranslations("Nav")
  const isDark = theme === "dark"

  return (
    <button
      onClick={toggle}
      className="relative w-[100px] scale-85 h-8 bg-gray-300 dark:bg-gray-700 rounded-full transition-colors duration-500 focus:outline-none flex items-center justify-center"
      aria-label="Toggle theme"
    >
      <span
        className={`absolute z-10 text-[14px] font-medium transition-all duration-500 ${
          isDark ? "text-white right-10 mt-[2px]" : "text-gray-800 right-[10px] mt-[2px]"
        }`}
      >
        {isDark ? `${t("darkMode")}` : `${t("lightMode")}`}
      </span>
      <div className="relative w-[100px] h-9 bg-slate-200 dark:bg-gray-700 rounded-full">
        <div
          className={`absolute top-0.5 mt-[5px] left-0.5 w-5 h-5 rounded-full shadow-md dark:bg-white dark:ring-2 dark:ring-black bg-yellow-100 ring-2 ring-amber-200 transform transition-transform duration-500 ${
            isDark ? "translate-x-[68px]" : "translate-x-[6px]"
          }`}
        />
      </div>
    </button>
  )
}