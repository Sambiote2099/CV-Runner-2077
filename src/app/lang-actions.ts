"use server"

import { cookies } from "next/headers"

export type Lang = "en" | "ru"

export async function setLanguage(lang: Lang) {
  const cookieStore = await cookies()
  cookieStore.set("lang", lang, {
    httpOnly: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
}