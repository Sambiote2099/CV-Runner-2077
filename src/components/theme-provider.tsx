"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { setTheme } from "@/app/theme-actions"

type Theme = "light" | "dark"

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: "light", toggle: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export default function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode
  initialTheme: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)

  // Apply/remove the "dark" class on <html> whenever theme changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light"
    setThemeState(next)
    setTheme(next)   // persist to cookie via server action
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}