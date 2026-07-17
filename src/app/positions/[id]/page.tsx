import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound } from "next/navigation"
import { evaluateAccessRules } from "@/lib/access-rules"
import CreateCVButton from "./create-cv-button"
import DiscussionPanel from "./discussion-panel"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import ExportButton from "./export-button"
import CVTable from "./cv-table"

export default async function PositionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab = "overview" } = await searchParams
  const session = await auth()
  
  const t = await getTranslations("Positions")
  const tCommon = await getTranslations("Common")

  const position = await prisma.position.findUnique({
    where: { id },
    include: {
      positionAttributes: {
        include: { attribute: true },
        orderBy: { order: "asc" },
      },
      accessRules: {
      include: { attribute: true },
    },
    },
  })
  if (!position) notFound()

  const isCandidate = session?.user?.role === "CANDIDATE"
  const isRecruiterOrAdmin = session?.user?.role === "RECRUITER" || session?.user?.role === "ADMIN"

  let hasAccess = false
  let existingCV = null

  if (isCandidate && session?.user?.id) {
    hasAccess = position.isPublic
      ? true
      : evaluateAccessRules(
          position.accessRules,
          await prisma.profileAttribute.findMany({
            where: { userId: session.user.id },
          })
        )

    existingCV = await prisma.cV.findUnique({
      where: {
        candidateId_positionId: {
          candidateId: session.user.id,
          positionId: id,
        },
      },
    })
  }

  const publishedCVCount =
  isRecruiterOrAdmin
    ? await prisma.cV.count({
        where: { positionId: id, status: "PUBLISHED" },
      })
    : 0

  // Fetch initial posts server-side so the page isn't blank on first load.
  // SWR takes over polling from here on the client.
  const initialPosts = await prisma.discussionPost.findMany({
    where: { positionId: id },
    include: { author: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  })

  const tabs = [
  { key: "overview", label: t("overview") },
  { key: "discussion", label: t("discussionWithCount", { count: initialPosts.length }) },
  ...(isRecruiterOrAdmin ? [{ key: "cvs", label: `${t("cvsTab")} (${publishedCVCount})` }] : []),
  ]

  // Only fetch CVs when on the CVs tab — avoids unnecessary queries
const positionCVs =
  isRecruiterOrAdmin && tab === "cvs"
    ? await prisma.cV.findMany({
        where: { positionId: id, status: "PUBLISHED" },
        include: {
          candidate: { select: { id: true, name: true, email: true } },
          _count: { select: { likes: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : []

  return (
    <div className="max-w-2xl p-4 md:p-6">
      <div className="mb-6 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-amber-100">{position.title}</h1>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              position.isPublic
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
            }`}
          >
            {position.isPublic ? tCommon("public") : tCommon("restricted")}
          </span>
        </div>
        <Link href="/positions" className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200">
          {tCommon("back")}
        </Link>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b border-amber-100 dark:border-slate-700 overflow-x-auto whitespace-nowrap">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              tab === t.key
                ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="flex flex-col gap-6">

          {/* Description */}
          <div>
            <h2 className="mb-1 text-xs font-semibold text-amber-400 dark:text-amber-500 uppercase tracking-wide">
              {t("description")}
            </h2>
            <p className="text-slate-700 dark:text-slate-300">{position.description}</p>
          </div>

          {/* Project settings */}
          <div>
            <h2 className="mb-2 text-xs font-semibold text-amber-400 dark:text-amber-500 uppercase tracking-wide">
              {t("projectSettings")}
            </h2>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">{t("maxProjects")}:</span>{" "}
                {position.maxProjects}
              </p>
              {position.projectTags.length > 0 ? (
                <div>
                  <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t("projectFilterTags")}{" "}
                    <span className="font-normal text-slate-400 dark:text-slate-500">
                      {t("projectFilterHelp")}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {position.projectTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  {t("noTagFilter")}
                </p>
              )}
            </div>
          </div>

          {/* Required attributes */}
          {position.positionAttributes.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold text-emerald-400 dark:text-emerald-500 uppercase tracking-wide">
                {t("requiredAttributes")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {position.positionAttributes.map((pa) => (
                  <span
                    key={pa.id}
                    className="rounded-full border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-0.5 text-xs text-slate-600 dark:text-slate-300"
                  >
                    {pa.attribute.name}
                    <span className="ml-1 text-slate-400 dark:text-slate-500">{pa.attribute.type}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Access rules — only show if position is restricted */}
          {!position.isPublic && (
            <div>
              <h2 className="mb-2 text-xs font-semibold text-rose-400 dark:text-rose-500 uppercase tracking-wide">
                {t("accessRules")}
              </h2>
              {position.accessRules.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">{t("noRules")}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {position.accessRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-2 rounded-lg border border-amber-100 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-200">{rule.attribute.name}</span>
                      <span className="text-slate-400 dark:text-slate-500">
                        {rule.operator.replace(/_/g, " ")}
                      </span>
                      {rule.value && (
                        <span className="font-medium text-slate-700 dark:text-slate-200">{rule.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Candidate CV section */}
          {isCandidate && (
            <div className="rounded-xl border border-amber-100 dark:border-slate-600 bg-white dark:bg-slate-800 p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t("yourCv")}</h2>
              {!hasAccess ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">
                  {t("noAccess")}
                </p>
              ) : existingCV ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {t("status")}: <strong>{existingCV.status === "PUBLISHED" ? tCommon("published") : tCommon("draft")}</strong>
                  </span>
                  <Link
                    href={`/cv/${existingCV.id}`}
                    className="rounded-2xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-900 px-3 py-1 text-sm text-white font-semibold transition-all duration-300"
                  >
                    {t("viewCv")}
                  </Link>
                </div>
              ) : (
                <CreateCVButton positionId={id} />
              )}
            </div>
          )}

          {!session && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <Link href="/signin" className="underline hover:text-amber-600 dark:hover:text-amber-400">{t("signIn")}</Link> {t("toApply")}
            </p>
          )}

        </div>
      )}

      {/* CVs tab */}
      {tab === "cvs" && isRecruiterOrAdmin && (
        <div>
          <h2 className="mb-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            {t("publishedCvsForPosition")}
          </h2>
          <div className="mb-4">
            <ExportButton positionId={id} />
          </div>
          {positionCVs.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">{t("noPublishedCvs")}</p>
          ) : (
            <CVTable cvs={positionCVs} />
          )}
        </div>
      )}

      {/* Discussion tab */}
      {tab === "discussion" && (
        <DiscussionPanel
          positionId={id}
          initialPosts={JSON.parse(JSON.stringify(initialPosts))}
          isLoggedIn={!!session?.user}
          isRecruiter={!!isRecruiterOrAdmin}
        />
      )}
    </div>
  )
}