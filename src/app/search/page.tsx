import { searchPositions, searchPositionsByTag, searchCVsByTag, searchCVsByContent } from "@/lib/search"
import { auth } from "@/auth"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>
}) {
  const { q = "", tag = "" } = await searchParams
  const session = await auth()
  const isRecruiterOrAdmin =
    session?.user?.role === "RECRUITER" || session?.user?.role === "ADMIN"
  
  const t = await getTranslations("Search")
  const tCommon = await getTranslations("Common")

  // Tag click from tag cloud — show role-appropriate results
  if (tag) {
    if (isRecruiterOrAdmin) {
      const cvs = await searchCVsByTag(tag)

      return (
        <div className="w-full p-6 flex flex-col gap-6 bg-amber-50 dark:bg-slate-950">
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
          <div>
            <h1 className="mb-1 text-2xl font-bold">{t("cvsTagged", { tag })}</h1>
            <p className="text-sm text-gray-400">{t("query", { q: tag, count: cvs.length })}</p>
          </div>

          {cvs.length === 0 ? (
            <p className="text-gray-500">{t("noCvs")}</p>
          ) : (
            <div className="overflow-x-auto sm:overflow-visible">
            <table className="w-full border-collapse transparent text-left text-sm">
              <thead>
                <tr className="border-b-2 border-amber-100 dark:border-slate-500 font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-2 pr-4">{t("candidate")}</th>
                  <th className="py-2 pr-4">{t("positionsSection")}</th>
                  <th className="py-2">{t("likes")}</th>
                  <th className="py-2 pl-1">{t("cv")}</th>
                </tr>
              </thead>
              <tbody>
                {cvs.map((cv) => (
                  <tr key={cv.id} className="hover:bg-amber-50 hover:scale-102 hover:translate-x-2 dark:hover:bg-slate-700 transition-all duration-300 border-b border-amber-50 dark:border-slate-700">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/profile/${cv.candidateId}`}
                        className=" hover:underline"
                      >
                        {cv.candidate.name ?? cv.candidate.email}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {cv.position.title}
                    </td>
                    <td className="py-2 text-gray-500">
                      ♥ {cv._count.likes}
                    </td>
                    <td className="py-2 text-gray-500">
                      <Link href={`/cv/${cv.id}`} className="bg-cyan-600 text-sm transition-all duration-300 text-white rounded-2xl py-1 px-2 hover:bg-emerald-600 font-medium">
                        view
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          </section>
        </div>
      )
    }

    // Candidate — show positions with this tag
    const positions = await searchPositionsByTag(tag)

    return (
      <div className="w-full p-6 flex flex-col gap-6 bg-amber-50 dark:bg-slate-950">
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="mb-1 text-2xl font-bold">{t("positionsTagged", { tag })}</h1>
          <p className="text-sm text-gray-400">{t("query", { q: tag, count: positions.length })}</p>
        </div>

        {positions.length === 0 ? (
          <p className="text-gray-500">{t("noPositions")}</p>
        ) : (
          <div className="overflow-x-auto sm:overflow-visible">
          <table className="w-full border-collapse transparent text-left text-sm">
            <thead>
              <tr className="border-b-2 border-amber-100 dark:border-slate-500 font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-2 pr-4">{t("title")}</th>
                <th className="py-2">{tCommon("access")}</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.id} className="hover:bg-amber-50 hover:scale-102 hover:translate-x-2 dark:hover:bg-slate-700 transition-all duration-300 border-b border-amber-50 dark:border-slate-700">
                  <td className="py-2 pr-4 font-medium">
                    <Link
                      href={`/positions/${pos.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {pos.title}
                    </Link>
                  </td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      pos.isPublic
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {pos.isPublic ? tCommon("public") : tCommon("restricted")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        </section>
      </div>
    )
  }

  // Regular text search — positions for everyone, CVs for Recruiters/Admins
  const [positionResults, cvResults] = await Promise.all([
    searchPositions(q),
    isRecruiterOrAdmin ? searchCVsByContent(q) : Promise.resolve([]),
  ])

  const totalResults = positionResults.length + cvResults.length

  return (
    <div className="w-full p-6 flex flex-col gap-6 bg-amber-50 dark:bg-slate-950">
      <div>
        <h1 className="mb-1 text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-gray-400">
          {q
            ? t("query", { q, count: totalResults })
            : t("noQuery")}
        </p>
      </div>

      {/* Position results — visible to everyone */}
      {positionResults.length > 0 && (
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t("positionsSection")}
          </h2>
          <div className="overflow-x-auto sm:overflow-visible">
            <table className="w-full border-collapse transparent text-left text-sm">
              <thead>
                <tr className="border-b-2 border-amber-100 dark:border-slate-500 font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-2 pr-4">{t("title")}</th>
                  <th className="py-2 pr-4">{tCommon("access")}</th>
                  <th className="py-2">{tCommon("created")}</th>
                </tr>
              </thead>
              <tbody>
                {positionResults.map((pos) => (
                  <tr key={pos.id} className="hover:bg-amber-50 hover:scale-102 hover:translate-x-2 dark:hover:bg-slate-700 transition-all duration-300 border-b border-amber-50 dark:border-slate-700">
                    <td className="py-2 pr-4 font-medium">
                      <Link href={`/positions/${pos.id}`} className="text-blue-600 hover:underline">
                        {pos.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        pos.isPublic
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {pos.isPublic ? tCommon("public") : tCommon("restricted")}
                      </span>
                    </td>
                    <td className="py-2 text-gray-400">
                      {pos.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* CV content results — Recruiters and Admins only */}
      {isRecruiterOrAdmin && cvResults.length > 0 && (
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t("cvsMatching", { q })}
          </h2>
          <div className="overflow-x-auto sm:overflow-visible">
            <table className="w-full border-collapse transparent text-left text-sm">
              <thead>
                <tr className="border-b-2 border-amber-100 dark:border-slate-500 font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-2 pr-4">{t("candidate")}</th>
                  <th className="py-2 pr-4">{t("positionsSection")}</th>
                  <th className="py-2">{t("likes")}</th>
                  <th className="py-2 pl-1">{t("cv")}</th>
                </tr>
              </thead>
              <tbody>
                {cvResults.map((cv) => (
                  <tr key={cv.id} className="hover:bg-amber-50 hover:scale-102 hover:translate-x-2 dark:hover:bg-slate-700 transition-all duration-300 border-b border-amber-50 dark:border-slate-700">
                    <td className="py-2 pr-4">
                      <Link href={`/profile/${cv.candidateId}`} className=" font-medium hover:underline">
                        {cv.candidate.name ?? cv.candidate.email}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">
                      <Link href={`/positions/${cv.position.id}`} className="hover:underline">
                        {cv.position.title}
                      </Link>
                    </td>
                    <td className="py-2 text-gray-500">
                      ♥ {cv._count.likes}
                    </td>
                    <td className="py-2 text-gray-500">
                      <Link href={`/cv/${cv.id}`} className="bg-cyan-600 text-sm transition-all duration-300 text-white rounded-2xl py-1 px-2 hover:bg-emerald-600 font-medium">
                        view
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {totalResults === 0 && q && (
        <p className="text-gray-500">{t("noResults")}</p>
      )}
    </div>
  )
}