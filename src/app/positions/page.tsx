import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import PositionTable from "./position-table"
import { getTranslations } from "next-intl/server"

export default async function PositionsPage() {
  const t = await getTranslations("Positions")
  const tCommon = await getTranslations("Common")
  const session = await auth()
  const isRecruiterOrAdmin =
    session?.user.role === "RECRUITER" || session?.user.role === "ADMIN"

  const positions = await prisma.position.findMany({
  orderBy: { createdAt: "desc" },
  include: {
    _count: { select: { positionAttributes: true } },
    cvs: {
      where: { status: "PUBLISHED" },
      select: { id: true },
    },
  },
})

  return (
    <div className="p-4 md:p-6 bg-amber-50 dark:bg-slate-950 min-h-screen">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-amber-100">{t("title")}</h1>
        {isRecruiterOrAdmin && (
          <Link
            href="/positions/new"
            className="rounded-2xl font-semibold bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-900 px-4 py-2 text-sm text-white transition-all duration-300"
          >
            {t("newPosition")} +
          </Link>
        )}
      </div>

      {isRecruiterOrAdmin ? (
        <PositionTable positions={positions} />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 shadow-sm overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-amber-100 dark:border-slate-600 font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-2 pr-4 pl-4">{t("title")}</th>
                <th className="py-2 pr-4">{tCommon("access")}</th>
                <th className="py-2 pr-4">{t("attributes")}</th>
                <th className="py-2">{tCommon("created")}</th>
                <th className="py-2 pr-4">People applied</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.id} className="border-b border-amber-50 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-300">
                  <td className="py-2 pr-4 pl-4 font-medium">
                    <Link href={`/positions/${pos.id}`} className="hover:underline text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400">
                      {pos.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pos.isPublic ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"}`}>
                      {pos.isPublic ? tCommon("public") : tCommon("restricted")}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{pos._count.positionAttributes}</td>
                  <td className="py-2 text-slate-500 dark:text-slate-400">{pos.createdAt.toLocaleDateString()}</td>
                  <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{pos.cvs.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}