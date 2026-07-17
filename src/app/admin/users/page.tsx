import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import UserTable from "./user-table"
import { getTranslations } from "next-intl/server"

export default async function AdminUsersPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/")
  const t = await getTranslations("Admin")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-4 md:p-6 bg-amber-50 dark:bg-slate-950 min-h-screen">
      <h1 className="mb-6 text-2xl font-bold text-slate-800 dark:text-amber-100">{t("userManagement")}</h1>
      <UserTable users={users} currentUserId={session.user.id} />
    </div>
  )
}