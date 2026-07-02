import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import MeTab from "./me-tab"
import InfoTab from "./info-tab"
import ProjectsTab from "./projects-tab"

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = "me" } = await searchParams
  const session = await auth()
  if (!session?.user?.id) redirect("/signin")
  const userId = session.user.id

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
  const meAttributes = await prisma.profileAttribute.findMany({
    where: { userId, attribute: { isBuiltIn: true } },
    include: { attribute: true },
    orderBy: { attribute: { name: "asc" } },
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

  // All non-built-in library attributes for the picker
  const allLibraryAttributes = await prisma.attribute.findMany({
    where: { isBuiltIn: false },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })

  const tabs = [
    { key: "me", label: "Me" },
    { key: "info", label: "Info" },
    { key: "projects", label: "Projects" },
  ]

  return (
    <div className="max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">My Profile</h1>

      <div className="mb-6 flex gap-1 border-b">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "me" && <MeTab profileAttributes={meAttributes} />}
      {tab === "info" && (
        <InfoTab
          profileAttributes={infoAttributes}
          availableAttributes={allLibraryAttributes}
        />
      )}
      {tab === "projects" && (
        <ProjectsTab projects={projects} allTags={allTags} />
    )}
    </div>
  )
}