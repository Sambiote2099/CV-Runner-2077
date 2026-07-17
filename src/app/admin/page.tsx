import { getTranslations } from "next-intl/server"

export default async function AdminPage() {
  const t = await getTranslations("Admin")
  return <p className="p-6">{t("message")}</p>
}