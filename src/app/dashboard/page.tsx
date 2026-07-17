import { getTranslations } from "next-intl/server"

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard")
  return <p className="p-6">{t("message")}</p>
}