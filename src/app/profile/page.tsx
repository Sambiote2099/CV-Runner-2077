import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import MeTab from "./me-tab"
import InfoTab from "./info-tab"
import ProjectsTab from "./projects-tab"
import { evaluateAccessRules } from "@/lib/access-rules"
import CVsTab from "./cvs-tab"
import { getTranslations } from "next-intl/server"

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = "me" } = await searchParams
  const session = await auth()
  if (!session?.user?.id) redirect("/signin")
  const userId = session.user.id
  const t = await getTranslations("Profile")
  const tCommon = await getTranslations("Common")
  // Ensure built-in ProfileAttribute rows exist on first visit
  const builtIns = await prisma.attribute.findMany({ where: { isBuiltIn: true } })
  await Promise.all(
    builtIns.map((attr) =>
      prisma.profileAttribute.upsert({
        where: { userId_attributeId: { userId, attributeId: attr.id } },
        update: {},
        create: { userId, attributeId: attr.id, value: "" },
      })
    )
  )

  // Me tab data — built-in attributes only
  const meAttributes = (await prisma.profileAttribute.findMany({
    where: { userId, attribute: { isBuiltIn: true } },
    include: { attribute: true },
    })).sort((a, b) => {
    if (a.attribute.type === "IMAGE" && b.attribute.type !== "IMAGE") return -1
    if (a.attribute.type !== "IMAGE" && b.attribute.type === "IMAGE") return 1
    return 0
  })

  // Info tab data — non-built-in attributes the user has added
  const infoAttributes = await prisma.profileAttribute.findMany({
    where: { userId, attribute: { isBuiltIn: false } },
    include: { attribute: true },
    orderBy: { createdAt: "asc" },
  })

  // Projects tab data
const projects = await prisma.project.findMany({
  where: { userId },
  orderBy: { startDate: "desc" },
})

// Collect all unique tags this user has used — for autocomplete
const allTags = [...new Set(projects.flatMap((p) => p.tags))]
// Fetch all candidate CVs with the position's access rules included
const cvs = await prisma.cV.findMany({
  where: { candidateId: userId },
  include: {
    position: {
      include: { accessRules: true },
    },
  },
  orderBy: { createdAt: "desc" },
})

// We already have allProfileAttrs from the upsert step — but that only
// fetched built-ins. Fetch all profile attributes once for access evaluation.
const allProfileAttrs = await prisma.profileAttribute.findMany({
  where: { userId },
})

// Evaluate access for each CV in memory — no extra DB calls per CV
const cvsWithAccess = cvs.map((cv) => ({
  ...cv,
  isAccessible:
    cv.position.isPublic ||
    evaluateAccessRules(cv.position.accessRules, allProfileAttrs),
}))

  // All non-built-in library attributes for the picker
  const allLibraryAttributes = await prisma.attribute.findMany({
    where: { isBuiltIn: false },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })

  const tabs = [
  { key: "me", label: t("me") },
  { key: "info", label: t("info") },
  { key: "projects", label: t("projects") },
  { key: "cvs", label: t("cvs") },
  ]
  return (
    <div className="bg-amber-50 dark:bg-slate-950 min-h-screen">
    <div className="max-w-2xl p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-800 dark:text-amber-100">{t("title")}</h1>

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

      {tab === "me" && (
        <MeTab
          profileAttributes={meAttributes}
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
        />
      )}
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
        />
      )}
      {tab === "projects" && (
        <ProjectsTab projects={projects} allTags={allTags} />
    )}
    {tab === "cvs" && <CVsTab cvs={cvsWithAccess} />}
    </div>
    </div>
  )
}