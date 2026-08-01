import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const token = req.headers.get("x-api-token") ??
    new URL(req.url).searchParams.get("token")

  if (!token) {
    return NextResponse.json(
      { error: "Missing API token. Pass it as x-api-token header or ?token= query param." },
      { status: 401 }
    )
  }

  // Find the position matching this token
  const position = await prisma.position.findUnique({
    where: { apiToken: token },
    include: {
      positionAttributes: {
        include: { attribute: true },
        orderBy: { order: "asc" },
      },
      cvs: {
        where: { status: "PUBLISHED" },
        include: {
          candidate: { select: { id: true } },
        },
      },
    },
  })

  if (!position) {
    return NextResponse.json(
      { error: "Invalid token or position not found." },
      { status: 404 }
    )
  }

  // Collect all candidate IDs from published CVs
  const candidateIds = position.cvs.map((cv) => cv.candidate.id)
  const attributeIds = position.positionAttributes.map((pa) => pa.attributeId)

  // Fetch all relevant ProfileAttribute values in one query
  const profileAttrs = await prisma.profileAttribute.findMany({
    where: {
      userId: { in: candidateIds },
      attributeId: { in: attributeIds },
    },
  })

  // Aggregate results per attribute
  const aggregatedAttributes = position.positionAttributes.map((pa) => {
    const values = profileAttrs
      .filter((pfa) => pfa.attributeId === pa.attributeId)
      .map((pfa) => pfa.value)
      .filter((v) => v.trim() !== "")

    const aggregation = aggregateValues(pa.attribute.type, values)

    return {
      id: pa.attribute.id,
      name: pa.attribute.name,
      type: pa.attribute.type,
      totalResponses: values.length,
      aggregation,
    }
  })

  return new NextResponse(JSON.stringify({
  position: {
    id: position.id,
    title: position.title,
    description: position.description,
    isPublic: position.isPublic,
    maxProjects: position.maxProjects,
    projectTags: position.projectTags,
    createdAt: position.createdAt,
  },
  totalPublishedCVs: position.cvs.length,
  attributes: aggregatedAttributes,
}), {
  status: 200,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
})
}

// Compute aggregations based on attribute type
function aggregateValues(
  type: string,
  values: string[]
): Record<string, unknown> {
  if (values.length === 0) return { note: "No responses yet" }

  switch (type) {
    case "NUMERIC": {
      const nums = values.map(Number).filter((n) => !isNaN(n))
      if (nums.length === 0) return { note: "No valid numeric responses" }
      const sum = nums.reduce((a, b) => a + b, 0)
      return {
        min: Math.min(...nums),
        max: Math.max(...nums),
        average: parseFloat((sum / nums.length).toFixed(2)),
        count: nums.length,
      }
    }

    case "BOOLEAN": {
      const trueCount = values.filter((v) => v === "true").length
      const falseCount = values.filter((v) => v === "false").length
      return {
        true: trueCount,
        false: falseCount,
        truePercent: parseFloat(((trueCount / values.length) * 100).toFixed(1)),
      }
    }

    case "ONE_OF_MANY":
    case "STRING":
    case "TEXT": {
      // Count frequency of each value, return top 5 most popular
      const freq: Record<string, number> = {}
      for (const v of values) {
        freq[v] = (freq[v] ?? 0) + 1
      }
      const sorted = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }))
      return { topValues: sorted, totalUnique: Object.keys(freq).length }
    }

    case "DATE":
    case "PERIOD": {
      return {
        totalFilled: values.length,
        sample: values.slice(0, 3),
      }
    }

    default:
      return { totalFilled: values.length }
  }
}