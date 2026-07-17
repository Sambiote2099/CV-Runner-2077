import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound, redirect } from "next/navigation"
import { evaluateAccessRules } from "@/lib/access-rules"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Link from "next/link"
import CVAttributeField from "./cv-attribute-field"
import CVPublishButton from "./cv-publish-button"
import LikeButton from "@/app/cv/like-button"
import { getTranslations } from "next-intl/server"
import PDFButton from "./pdf-button"

export default async function CVPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/signin")

  const t = await getTranslations("CV")
  const tCommon = await getTranslations("Common")

  const cv = await prisma.cV.findUnique({
    where: { id },
    include: {
      candidate: true,
      position: {
        include: {
          positionAttributes: {
            include: { attribute: true },
            orderBy: { order: "asc" },
          },
          accessRules: true,
        },
      },
    },
  })
  if (!cv) notFound()

  const isOwner = session.user.id === cv.candidateId
  const isRecruiterOrAdmin = session.user.role === "RECRUITER" || session.user.role === "ADMIN"
  const isAdmin = session.user.role === "ADMIN"
  const isRecruiter = session.user.role === "RECRUITER"

  if (!isOwner && !isRecruiterOrAdmin) redirect("/")

  // Check if the candidate still meets access requirements
  if (!cv.position.isPublic && isOwner) {
    const profileAttrs = await prisma.profileAttribute.findMany({
      where: { userId: cv.candidateId },
    })
    const stillHasAccess = evaluateAccessRules(
      cv.position.accessRules,
      profileAttrs
    )
    if (!stillHasAccess) {
      return (
        <div className="max-w-2xl p-4 md:p-6">
          <p className="text-slate-500 dark:text-slate-400">{t("hidden")}</p>
          <Link href="/profile" className="mt-2 block text-sm text-amber-600 dark:text-amber-400 underline">
            {t("goToProfile")}
          </Link>
        </div>
      )
    }
  }
  // If the owner is loading their CV, upsert any position attributes
// that were added to the position AFTER this CV was created.
// This handles Example 2: new attribute added to position → existing
// CV holders get an empty editable row, not a broken read-only box.
if (isOwner) {
  const existingAttrIds = new Set(
    (await prisma.profileAttribute.findMany({
      where: { userId: cv.candidateId },
      select: { attributeId: true },
    })).map((pa) => pa.attributeId)
  )

  const missingAttrIds = cv.position.positionAttributes
    .map((pa) => pa.attributeId)
    .filter((attrId) => !existingAttrIds.has(attrId))

  if (missingAttrIds.length > 0) {
    await prisma.profileAttribute.createMany({
      data: missingAttrIds.map((attributeId) => ({
        userId: cv.candidateId,
        attributeId,
        value: "",
      })),
      skipDuplicates: true,
    })
  }
}

  // Recruiters can only see published CVs
  if (isRecruiter && !isOwner && cv.status !== "PUBLISHED") {
    return (
      <div className="max-w-2xl p-4 md:p-6">
        <p className="text-slate-500 dark:text-slate-400">{t("notPublished")}</p>
      </div>
    )
  }

  // Fetch current attribute values — live lookup from ProfileAttribute
  const requiredAttributeIds = cv.position.positionAttributes.map(
    (pa) => pa.attributeId
  )
  const profileAttributes = await prisma.profileAttribute.findMany({
    where: { userId: cv.candidateId, attributeId: { in: requiredAttributeIds } },
  })
  const profileAttrMap = new Map(
    profileAttributes.map((pa) => [pa.attributeId, pa])
  )

  const allFilled = requiredAttributeIds.every((attrId) => {
    const pa = profileAttrMap.get(attrId)
    return pa && pa.value.trim() !== ""
  })

  // Fetch projects filtered by position tags, capped at maxProjects
  const projects = await prisma.project.findMany({
    where: {
      userId: cv.candidateId,
      ...(cv.position.projectTags.length > 0
        ? { tags: { hasSome: cv.position.projectTags } }
        : {}),
    },
    orderBy: { startDate: "desc" },
    take: cv.position.maxProjects,
  })

  // Like data for recruiter view
  const likeCount = await prisma.like.count({ where: { cvId: id } })
  const hasLiked =
    isRecruiterOrAdmin && session?.user?.id
      ? !!(await prisma.like.findUnique({
          where: {
            recruiterId_cvId: { recruiterId: session.user.id, cvId: id },
          },
        }))
      : false

  return (
    <div className="max-w-2xl p-4 md:p-6 flex flex-col gap-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">CV</p>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-amber-100">{cv.position.title}</h1>
          <Link href={`/profile/${cv.candidateId}`} className="text-sm underline font-semibold mt-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300">
            {t("candidate")}: <strong>{cv.candidate.name ?? cv.candidate.email}</strong>
          </Link>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            cv.status === "PUBLISHED"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
          }`}>
            {cv.status === "PUBLISHED" ? tCommon("published") : tCommon("draft")}
          </span>
          <PDFButton cvId={cv.id} />
          <Link href={`/positions/${cv.positionId}`} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200">
            {tCommon("back")}
          </Link>
        </div>
      </div>

      {/* ── Position Details ── */}
      <section className="rounded-xl border border-amber-200 dark:border-slate-700 p-4 flex flex-col gap-3 bg-slate-50 dark:bg-slate-800">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-amber-100 uppercase tracking-wide">
          {t("positionDetails")}
        </h2>

        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">{t("description")}</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{cv.position.description}</p>
        </div>

        <div className="flex gap-6">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">{tCommon("access")}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              cv.position.isPublic
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
            }`}>
              {cv.position.isPublic ? tCommon("public") : tCommon("restricted")}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">{t("maxProjects")}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{cv.position.maxProjects}</p>
          </div>
        </div>

        {cv.position.projectTags.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
              {t("projectFilterTags")}
              <span className="ml-1 text-slate-300 dark:text-slate-600">{t("projectFilterHelp")}</span>
            </p>
            <div className="flex flex-wrap gap-1">
              {cv.position.projectTags.map((tag) => (
                <span key={tag} className="rounded-full border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {cv.position.positionAttributes.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{t("requiredAttributes")}</p>
            <div className="flex flex-wrap gap-1">
              {cv.position.positionAttributes.map((pa) => (
                <span key={pa.id} className="rounded-full border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {pa.attribute.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Profile Attributes ── */}
      {cv.position.positionAttributes.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-amber-100">{t("profile")}</h2>
          {cv.position.positionAttributes.map((pa) => {
            const profileAttr = profileAttrMap.get(pa.attributeId)
            const isEmpty = !profileAttr?.value?.trim()

            return (
              <div key={pa.id}>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {pa.attribute.name}
                  <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">{pa.attribute.type}</span>
                </label>

                {(isOwner || isAdmin) && cv.status !== "PUBLISHED" && profileAttr ? (
                  <CVAttributeField
                    profileAttributeId={profileAttr.id}
                    initialValue={profileAttr.value}
                    initialVersion={profileAttr.version}
                    attribute={pa.attribute}
                  />
                ) : (
                  <div className={`rounded-lg border px-3 py-2 text-sm ${
                    isEmpty && cv.status === "DRAFT"
                      ? "border-rose-300 bg-rose-50 dark:bg-rose-900/20 text-rose-400"
                      : "border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  }`}>
                    {isEmpty ? (
                      tCommon("notFilled")
                    ) : pa.attribute.type === "IMAGE" ? (
                      <img src={profileAttr?.value} alt={pa.attribute.name} className="h-24 w-24 rounded object-cover" />
                    ) : pa.attribute.type === "BOOLEAN" ? (
                      profileAttr?.value === "true" ? "Yes" : "No"
                    ) : pa.attribute.type === "PERIOD" ? (
                      (() => {
                        const [start, end] = (profileAttr?.value ?? "").split("|")
                        return `${start ? new Date(start).toLocaleDateString() : "—"} to ${end ? new Date(end).toLocaleDateString() : "—"}`
                      })()
                    ) : pa.attribute.type === "DATE" ? (
                      profileAttr?.value ? new Date(profileAttr.value).toLocaleDateString() : "—"
                    ) : (
                      profileAttr?.value ?? ""
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}

      {/* ── Matched Projects ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-amber-100">{t("projects")}</h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {projects.length === 0
              ? t("noMatchingProjects")
              : t("maxOf", { count: projects.length, max: cv.position.maxProjects })}
          </span>
        </div>

        {projects.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {cv.position.projectTags.length > 0
              ? t("noMatchingProjects", { tags: cv.position.projectTags.join(", ") })
              : t("noProjectsAdded")}
            {isOwner && (
              <Link href="/profile?tab=projects" className="ml-1 text-amber-600 dark:text-amber-400 underline">
                {t("addProjects")}
              </Link>
            )}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((project) => (
              <div key={project.id} className="rounded-xl border border-amber-100 dark:border-slate-600 bg-white dark:bg-slate-800 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-medium text-slate-800 dark:text-slate-200">{project.name}</h3>
                  {(project.startDate || project.endDate) && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {project.startDate?.toLocaleDateString()} —{" "}
                      {project.endDate?.toLocaleDateString() ?? t("present")}
                    </span>
                  )}
                </div>

                {project.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <span key={tag} className={`rounded-full border px-2 py-0.5 text-xs ${
                        cv.position.projectTags.includes(tag)
                          ? "border-amber-300 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                          : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400"
                      }`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {project.description && (
                  <div className="prose prose-sm dark:prose-invert text-slate-700 dark:text-slate-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.description}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Publish button (candidate, draft only) ── */}
      {(isOwner || isAdmin) && cv.status === "DRAFT" && (
        <CVPublishButton cvId={cv.id} version={cv.version} allFilled={allFilled} />
      )}

      {/* ── Like button (recruiter, published only) ── */}
      {isRecruiterOrAdmin && cv.status === "PUBLISHED" && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-black dark:text-white">{t("likeCv")}</span>
          <LikeButton cvId={cv.id} initialCount={likeCount} initialLiked={hasLiked} />
        </div>
      )}
    </div>
  )
}