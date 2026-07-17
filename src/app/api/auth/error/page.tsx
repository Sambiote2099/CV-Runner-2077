import Link from "next/link"
import { getTranslations } from "next-intl/server"

export default async function AuthErrorPage() {
  const t = await getTranslations("AuthError")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold text-red-600">{t("title")}</h1>
      <p className="text-gray-600">{t("message")}</p>
      <Link href="/" className="text-sm text-blue-600 underline">
        {t("goHome")}
      </Link>
    </div>
  )
}
