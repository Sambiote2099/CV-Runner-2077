import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { evaluateAccessRules } from "@/lib/access-rules"
import MeTab from "../me-tab"
import InfoTab from "../info-tab"
import ProjectsTab from "../projects-tab"
import CVsTab from "../cvs-tab"
import { getTranslations } from "next-intl/server"

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab = "me" } = await searchParams
  const session = await auth()
  const t = await getTranslations("Profile")
  const tCommon = await getTranslations("Common")
  if (!session?.user?.id) redirect("/signin")

  // Candidates can only see their own profile
  if (session.user.role === "CANDIDATE") {
    if (session.user.id === id) redirect("/profile")
    redirect("/")
  }

  // If Admin visits their own profile via /profile/[id], redirect to /profile
  if (session.user.role === "ADMIN" && session.user.id === id) {
    redirect("/profile")
  }

  const profileUser = await prisma.user.findUnique({ where: { id } })
  if (!profileUser) notFound()

  const isAdmin = session.user.role === "ADMIN"
  const isRecruiter = session.user.role === "RECRUITER"

// ── Recruiter view — full profile, read-only, same tab layout as Admin ──
if (isRecruiter) {
  const [meAttributes, infoAttributes, projects, publishedCVs] = await Promise.all([
    prisma.profileAttribute.findMany({
      where: { userId: id, attribute: { isBuiltIn: true } },
      include: { attribute: true },
      orderBy: { attribute: { name: "asc" } },
    }),
    prisma.profileAttribute.findMany({
      where: { userId: id, attribute: { isBuiltIn: false } },
      include: { attribute: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.project.findMany({
      where: { userId: id },
      orderBy: { startDate: "desc" },
    }),
    prisma.cV.findMany({
      where: { candidateId: id, status: "PUBLISHED" },
      include: { position: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const tabs = [
    { key: "me", label: t("me") },
    { key: "info", label: t("info") },
    { key: "projects", label: t("projects") },
    { key: "cvs", label: t("cvs") },
  ]

  return (
    <div className="max-w-2xl p-4 md:p-6">

      {/* Header — same structure as Admin view */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
            {t("readOnlyLabel")}
          </p>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-amber-100">
            {profileUser.name ?? profileUser.email}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{profileUser.email}</p>
        </div>
        <Link href="javascript:history.back()" className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200">
          {tCommon("back")}
        </Link>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b border-amber-100 dark:border-slate-700 overflow-x-auto whitespace-nowrap">
        {tabs.map((tab_item) => (
          <Link
            key={tab_item.key}
            href={`?tab=${tab_item.key}`}
            className={`px-4 py-2 text-sm font-medium flex-shrink-0 transition-colors duration-200 ${
              tab === tab_item.key
                ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab_item.label}
          </Link>
        ))}
      </div>

      {/* Me tab */}
      {tab === "me" && (
        <div className="flex flex-col gap-4">
          {meAttributes.map((pa) => (
            <div key={pa.id}>
              <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{pa.attribute.name}</p>
              {pa.attribute.type === "IMAGE" && pa.value ? (
                <img src={pa.value} alt={pa.attribute.name} className="h-24 w-24 rounded-lg border border-amber-200 dark:border-slate-600 object-cover" />
              ) : (
                <div className={`rounded-lg border px-3 py-2 text-sm ${
                  !pa.value
                    ? "border-rose-300 bg-rose-50 dark:bg-rose-900/20 text-rose-400"
                    : "border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                }`}>
                  {pa.value || tCommon("notFilled")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info tab */}
      {tab === "info" && (
        <div className="flex flex-col gap-4">
          {infoAttributes.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">{t("noAttributesAdded")}</p>
          ) : (
            infoAttributes.map((pa) => (
              <div key={pa.id}>
                <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {pa.attribute.name}
                  <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">{pa.attribute.type}</span>
                </p>
                {pa.attribute.type === "BOOLEAN" ? (
                  <div className="rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200">
                    {pa.value === "true" ? tCommon("yes") : tCommon("no")}
                  </div>
                ) : pa.attribute.type === "IMAGE" && pa.value ? (
                  <img src={pa.value} alt={pa.attribute.name} className="h-24 w-24 rounded-lg border border-amber-200 dark:border-slate-600 object-cover" />
                ) : (
                  <div className={`rounded-lg border px-3 py-2 text-sm ${
                    !pa.value
                      ? "border-rose-300 bg-rose-50 dark:bg-rose-900/20 text-rose-400"
                      : "border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  }`}>
                    {pa.value || tCommon("notFilled")}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Projects tab */}
      {tab === "projects" && (
        <div className="flex flex-col gap-4">
          {projects.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">{t("noProjectsAdded")}</p>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="rounded-xl border border-amber-100 dark:border-slate-600 bg-white dark:bg-slate-800 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-medium text-slate-800 dark:text-slate-200">{project.name}</h3>
                  {(project.startDate || project.endDate) && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {project.startDate?.toLocaleDateString()} —{" "}
                      {project.endDate?.toLocaleDateString() ?? tCommon("present")}
                    </span>
                  )}
                </div>
                {project.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {project.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {project.description.replace(/[#*`_~>\[\]]/g, "")}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* CVs tab */}
      {tab === "cvs" && (
        <div>
          {publishedCVs.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">{t("noPublishedCvsYet")}</p>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 shadow-sm overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-amber-100 dark:border-slate-600 font-semibold text-slate-600 dark:text-slate-300">
                    <th className="py-2 pr-4 pl-4">{t("positionCol")}</th>
                    <th className="py-2">{t("submitted")}</th>
                  </tr>
                </thead>
                <tbody>
                  {publishedCVs.map((cv) => (
                    <tr key={cv.id} className="border-b border-amber-50 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-300">
                      <td className="py-2 pr-4 pl-4">
                        <Link href={`/cv/${cv.id}`} className="text-amber-600 dark:text-amber-400 hover:underline font-medium">
                          {cv.position.title}
                        </Link>
                      </td>
                      <td className="py-2 text-slate-400 dark:text-slate-500">{cv.createdAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

  // ── Admin view — full editable profile ──
  // Upsert built-in ProfileAttribute rows for this user if missing
  const builtIns = await prisma.attribute.findMany({ where: { isBuiltIn: true } })
  await Promise.all(
    builtIns.map((attr) =>
      prisma.profileAttribute.upsert({
        where: { userId_attributeId: { userId: id, attributeId: attr.id } },
        update: {},
        create: { userId: id, attributeId: attr.id, value: "" },
      })
    )
  )

  const [meAttributes, infoAttributes, allLibraryAttributes, projects, cvs, allProfileAttrs] =
    await Promise.all([
      prisma.profileAttribute.findMany({
        where: { userId: id, attribute: { isBuiltIn: true } },
        include: { attribute: true },
        orderBy: { attribute: { name: "asc" } },
      }),
      prisma.profileAttribute.findMany({
        where: { userId: id, attribute: { isBuiltIn: false } },
        include: { attribute: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.attribute.findMany({
        where: { isBuiltIn: false },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      }),
      prisma.project.findMany({
        where: { userId: id },
        orderBy: { startDate: "desc" },
      }),
      prisma.cV.findMany({
        where: { candidateId: id },
        include: { position: { include: { accessRules: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.profileAttribute.findMany({ where: { userId: id } }),
    ])

  const allTags = [...new Set(projects.flatMap((p) => p.tags))]

  const cvsWithAccess = cvs.map((cv) => ({
    ...cv,
    isAccessible:
      cv.position.isPublic ||
      evaluateAccessRules(cv.position.accessRules, allProfileAttrs),
  }))

  const tabs = [
    { key: "me", label: t("me") },
    { key: "info", label: t("info") },
    { key: "projects", label: t("projects") },
    { key: "cvs", label: t("cvs") },
  ]

  return (
    <div className="max-w-2xl p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
            {t("adminEditingLabel")}
          </p>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-amber-100">{profileUser.name ?? profileUser.email}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{profileUser.email}</p>
        </div>
        <Link href="/admin/users" className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200">
          {t("backToUsers")}
        </Link>
      </div>

      <div className="mb-6 flex gap-1 border-b border-amber-100 dark:border-slate-700 overflow-x-auto whitespace-nowrap">
        {tabs.map((tab_item) => (
          <Link
            key={tab_item.key}
            href={`?tab=${tab_item.key}`}
            className={`px-4 py-2 text-sm font-medium flex-shrink-0 transition-colors duration-200 ${
              tab === tab_item.key
                ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab_item.label}
          </Link>
        ))}
      </div>

      {tab === "me" && <MeTab profileAttributes={meAttributes}
      labels={{
            saving: tCommon("saving"),
            saved: tCommon("saved"),
            unsaved: tCommon("unsaved"),
            conflict: tCommon("conflict"),
            reload: tCommon("reload"),
            required: tCommon("required"),
            imageUploadSoon: t("imageUploadSoon"),
            to: tCommon("to"),
            edit: tCommon("edit"),
            preview: tCommon("preview"),
            nothingYet: tCommon("nothingYet"),
            markdownSupported: tCommon("markdownSupported"),
            select: t("select"),
          }}
      />}
      {tab === "info" && (
        <InfoTab
          profileAttributes={infoAttributes}
          availableAttributes={allLibraryAttributes}
          labels={{
          saving: tCommon("saving"),
          saved: tCommon("saved"),
          unsaved: tCommon("unsaved"),
          conflict: tCommon("conflict"),
          reload: tCommon("reload"),
          required: tCommon("required"),
          noAttributes: t("noAttributes"),
          remove: t("removeAttribute"),
          cancel: tCommon("cancel"),
          addAttribute: t("addAttribute"),
          searchByName: t("searchByName"),
          noAttributesMatch: t("noAttributesMatch"),
          select: t("select"),
          imageUploadSoon: t("imageUploadSoon"),
          removeAttributeConfirm: t("removeAttributeConfirm"),
          to: tCommon("to"),
          edit: tCommon("edit"),
          preview: tCommon("preview"),
          nothingYet: tCommon("nothingYet"),
          markdownSupported: tCommon("markdownSupported"),}}
          targetUserId={id}
        />
      )}
      {tab === "projects" && (
        <ProjectsTab
          projects={projects}
          allTags={allTags}
          targetUserId={id}
        />
      )}
      {tab === "cvs" && <CVsTab cvs={cvsWithAccess} />}
    </div>
  )
}