import { prisma } from "@/lib/prisma"
import type { Position } from "@prisma/client"

export async function searchPositions(query: string): Promise<Position[]> {
  if (!query.trim()) return []

  // Run both searches in parallel — FTS on title/description,
  // and a simple array match on projectTags
  const [ftsResults, tagResults] = await Promise.all([
    // Existing FTS query — unchanged
    prisma.$queryRaw<Position[]>`
      SELECT *
      FROM "Position"
      WHERE to_tsvector('english', title || ' ' || description)
            @@ plainto_tsquery('english', ${query})
      ORDER BY ts_rank(
        to_tsvector('english', title || ' ' || description),
        plainto_tsquery('english', ${query})
      ) DESC
      LIMIT 20
    `,
    // New: also find positions whose projectTags contain the query string.
    // hasSome checks if the array contains at least one matching value.
    // We check both exact match and case-insensitive contains.
    prisma.position.findMany({
      where: {
        projectTags: {
          hasSome: [query.toLowerCase(), query],
        },
      },
    }),
  ])

  // Merge results, removing duplicates by id.
  // FTS results come first since they're ranked by relevance.
  const seen = new Set<string>()
  const merged: Position[] = []

  for (const pos of [...ftsResults, ...tagResults]) {
    if (!seen.has(pos.id)) {
      seen.add(pos.id)
      merged.push(pos)
    }
  }

  return merged
}

// Positions whose projectTags array contains the given tag — for Candidates
export async function searchPositionsByTag(tag: string) {
  if (!tag.trim()) return []

  return prisma.position.findMany({
    where: { projectTags: { has: tag } },
    orderBy: { createdAt: "desc" },
  })
}

// Published CVs for positions that have the given projectTag — for Recruiters
export async function searchCVsByTag(tag: string) {
  if (!tag.trim()) return []

  return prisma.cV.findMany({
    where: {
      status: "PUBLISHED",
      position: { projectTags: { has: tag } },
    },
    include: {
      candidate: { select: { name: true, email: true } },
      position: { select: { title: true } },
      _count: { select: { likes: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

// Searches CVs by matching candidate attribute values and project content.
// Used by Recruiters — returns published CVs whose content matches the query.
export async function searchCVsByContent(query: string) {
  if (!query.trim()) return []

  const lowerQuery = query.toLowerCase()

  // Step 1: fetch all published CVs with everything we need to check content
  const publishedCVs = await prisma.cV.findMany({
    where: { status: "PUBLISHED" },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      position: {
        select: {
          id: true,
          title: true,
          projectTags: true,
          maxProjects: true,
          positionAttributes: {
            select: { attributeId: true },
          },
        },
      },
      _count: { select: { likes: true } },
    },
  })

  if (publishedCVs.length === 0) return []

  // Step 2: for each CV, we need to check two things:
  // (a) does any of the candidate's ProfileAttribute VALUES for the
  //     position's required attributes match the query?
  // (b) does any project that ACTUALLY APPEARS in the CV match the query?
  //
  // We fetch all relevant data in two bulk queries — not inside a loop.

  // Collect all candidate IDs and attribute IDs across all CVs
  const allCandidateIds = [...new Set(publishedCVs.map((cv) => cv.candidateId))]
  const allAttributeIds = [
    ...new Set(
      publishedCVs.flatMap((cv) =>
        cv.position.positionAttributes.map((pa) => pa.attributeId)
      )
    ),
  ]

  // Bulk fetch all relevant ProfileAttribute values
  const allProfileAttrs = await prisma.profileAttribute.findMany({
    where: {
      userId: { in: allCandidateIds },
      attributeId: { in: allAttributeIds },
    },
    include: {
      attribute: { select: { name: true } },
    },
  })

  // Bulk fetch all relevant projects per candidate
  const allProjects = await prisma.project.findMany({
    where: { userId: { in: allCandidateIds } },
  })

  // Build lookup maps so we can check each CV without extra DB calls
  // Map: "userId:attributeId" → { value, attributeName }
  const profileAttrMap = new Map(
    allProfileAttrs.map((pa) => [
      `${pa.userId}:${pa.attributeId}`,
      { value: pa.value, attributeName: pa.attribute.name },
    ])
  )

  // Map: userId → Project[]
  const projectsByUser = new Map<string, typeof allProjects>()
  for (const project of allProjects) {
    if (!projectsByUser.has(project.userId)) {
      projectsByUser.set(project.userId, [])
    }
    projectsByUser.get(project.userId)!.push(project)
  }

  // Step 3: filter CVs — check actual CV content only
  const matchingCVs = publishedCVs.filter((cv) => {
    // Check (a): does any required attribute VALUE or NAME match the query?
    const attributeMatch = cv.position.positionAttributes.some((pa) => {
      const entry = profileAttrMap.get(`${cv.candidateId}:${pa.attributeId}`)
      if (!entry) return false
      return (
        entry.value.toLowerCase().includes(lowerQuery) ||
        entry.attributeName.toLowerCase().includes(lowerQuery)
      )
    })

    if (attributeMatch) return true

    // Check (b): does any project that ACTUALLY APPEARS in this CV match?
    // We replicate the same filter the CV page uses: tags + maxProjects
    const userProjects = projectsByUser.get(cv.candidateId) ?? []
    const cvProjects = userProjects
      .filter((p) =>
        cv.position.projectTags.length === 0
          ? true
          : p.tags.some((tag) => cv.position.projectTags.includes(tag))
      )
      .sort((a, b) => {
        // Most recent first — same as the CV page's orderBy: startDate desc
        const aDate = a.startDate?.getTime() ?? 0
        const bDate = b.startDate?.getTime() ?? 0
        return bDate - aDate
      })
      .slice(0, cv.position.maxProjects)

    return cvProjects.some(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.tags.some((tag) => tag.includes(lowerQuery))
    )
  })

  return matchingCVs
}