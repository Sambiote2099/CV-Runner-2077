import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import TagCloud from "./tag-cloud"
import { getTranslations } from "next-intl/server"
import StatsCharts from "@/components/stats-charts"

export default async function HomePage() {
  const session = await auth()
  const isRecruiterOrAdmin = session?.user?.role === "RECRUITER" || session?.user?.role === "ADMIN"
  const t = await getTranslations("Home")
  const tCommon = await getTranslations("Common")

  // Latest 10 positions
  const latestPositions = await prisma.position.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { _count: { select: { cvs: true } } },
  })

  // Top 5 positions by published CV count
  const popularPositions = await prisma.position.findMany({
    orderBy: { cvs: { _count: "desc" } },
    take: 5,
    include: { _count: { select: { cvs: true } } },
  })

  // Stats
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [
    totalPositions,
    totalCandidates,
    totalRecruiters,
    totalPublishedCVs,
    recentCVs,
  ] = await Promise.all([
    prisma.position.count(),
    prisma.user.count({ where: { role: "CANDIDATE" } }),
    prisma.user.count({ where: { role: "RECRUITER" } }),
    prisma.cV.count({ where: { status: "PUBLISHED" } }),
    prisma.cV.count({ where: { createdAt: { gte: oneDayAgo } } }),
  ])

  // Donut data
const roleSplit = [
  { name: t("candidates"), value: totalCandidates },
  { name: t("recruiters"), value: totalRecruiters },
]

// Activity sparkline: CVs created per hour for last 24h
const now = new Date()
const start = new Date(now.getTime() - 24 * 60 * 60 * 1000)

const recentCvRows = await prisma.cV.findMany({
  where: { createdAt: { gte: start } },
  select: { createdAt: true },
})

const hourlyBuckets = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(start.getTime() + i * 60 * 60 * 1000)

  return {
    hour: d.toLocaleTimeString([], { hour: "2-digit" }),
    cvs: 0,
  }
})

for (const row of recentCvRows) {
  const diffHours = Math.floor(
    (row.createdAt.getTime() - start.getTime()) / (1000 * 60 * 60)
  )

  if (diffHours >= 0 && diffHours < 24) {
    hourlyBuckets[diffHours].cvs += 1
  }
}

const activityData = hourlyBuckets
  // Tag cloud — aggregate all project tags with their frequency
  // NEW — aggregate from Position.projectTags instead:
  const positions = await prisma.position.findMany({
    select: { projectTags: true },
  })
  const tagCounts: Record<string, number> = {}
  for (const position of positions) {
    for (const tag of position.projectTags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }
  const tagCloudData = Object.entries(tagCounts).map(([value, count]) => ({
    value,
    count,
  }))

  return (
    <div className="w-full p-6 flex flex-col gap-10 bg-amber-50 dark:bg-slate-950">

      {/* Stats */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-amber-100">{t("statistics")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: t("cvsToday"), value: recentCVs },
            { label: t("totalPositions"), value: totalPositions },
            { label: t("candidates"), value: totalCandidates },
            { label: t("recruiters"), value: totalRecruiters },
            { label: t("publishedCvs"), value: totalPublishedCVs },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-4xl shadow-md transition-all duration-500 hover:scale-102 hover:-translate-y-2 border border-amber-100 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 p-4 text-center"
            >
              <p className="text-2xl font-bold text-slate-800 dark:text-amber-400">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

          <StatsCharts
  tagCloudData={tagCloudData}
  roleSplit={roleSplit}
  activityData={activityData}
  overviewData={{
    totalPositions: totalPositions,
    publishedCVs: totalPublishedCVs,
  }}
/>
      {/* Latest positions */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-amber-100">{t("latestPositions")}</h2>
        {latestPositions.length === 0 ? (
          <p className="text-sm text-slate-400">{t("noPositions")}</p>
        ) : (
          <div className="overflow-visible">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-amber-100 dark:border-slate-500 font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-2 pr-4 pl-2">{t("title")}</th>
                <th className="py-2 pr-4">{t("access")}</th>
                <th className="py-2">{t("cvs")}</th>
              </tr>
            </thead>
            <tbody>
              {latestPositions.map((pos) => (
                <tr key={pos.id} className="hover:bg-amber-50 hover:scale-102 dark:hover:bg-slate-700 transition-all duration-300 border-b border-amber-50 dark:border-slate-700">
                  <td className="py-2 pr-4 pl-2">
                    <Link
                      href={`/positions/${pos.id}`}
                      className="hover:underline font-medium text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400"
                    >
                      {pos.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        pos.isPublic
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      }`}
                    >
                      {pos.isPublic ? tCommon("public") : tCommon("restricted")}
                    </span>
                  </td>
                  <td className="py-2 text-slate-500 dark:text-slate-400">
                    {pos._count.cvs}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>

      {/* Most popular positions */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-amber-100">{t("popularPositions")}</h2>
        {popularPositions.length === 0 ? (
          <p className="text-sm text-slate-400">{t("noPositions")}</p>
        ) : (
          <div className="overflow-visible">
          <table className="w-full border-collapse transparent text-left text-sm">
            <thead>
              <tr className="border-b-2 border-amber-100 dark:border-slate-500 font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-2 pr-4 pl-2">{t("title")}</th>
                <th className="py-2">{t("cvsSubmitted")}</th>
              </tr>
            </thead>
            <tbody>
              {popularPositions.map((pos, i) => (
                <tr key={pos.id} className="hover:bg-amber-50 hover:scale-102 dark:hover:bg-slate-700 transition-all duration-300 border-b border-amber-50 dark:border-slate-700">
                  <td className="py-2 pr-4 pl-2">
                    <span className="mr-2 text-amber-400 dark:text-amber-500 font-semibold">#{i + 1}</span>
                    <Link
                      href={`/positions/${pos.id}`}
                      className="hover:underline font-medium text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400"
                    >
                      {pos.title}
                    </Link>
                  </td>
                  <td className="py-2 text-slate-500 dark:text-slate-400">{pos._count.cvs}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>

      {/* Tag cloud */}
      {tagCloudData.length > 0 && (
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-amber-100">{t("tags")}</h2>
          <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
            {t("tagClick", { role: isRecruiterOrAdmin ? t("tagRoleCvs") : t("tagRolePositions") })}
          </p>
          <TagCloud
            tags={tagCloudData}
            isRecruiterOrAdmin={isRecruiterOrAdmin}
          />
        </section>
      )}

    </div>
  )
}
