import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound } from "next/navigation"
import { evaluateAccessRules } from "@/lib/access-rules"
import CreateCVButton from "./create-cv-button"
import Link from "next/link"

export default async function PositionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const position = await prisma.position.findUnique({
    where: { id },
    include: {
      positionAttributes: {
        include: { attribute: true },
        orderBy: { order: "asc" },
      },
      accessRules: true,
    },
  })
  if (!position) notFound()

  const isCandidate = session?.user?.role === "CANDIDATE"

  // Only evaluate access rules if the user is a candidate
  let hasAccess = false
  let existingCV = null

  if (isCandidate && session?.user?.id) {
    if (position.isPublic) {
      hasAccess = true
    } else {
      const profileAttrs = await prisma.profileAttribute.findMany({
        where: { userId: session.user.id },
      })
      hasAccess = evaluateAccessRules(position.accessRules, profileAttrs)
    }

    existingCV = await prisma.cV.findUnique({
      where: {
        candidateId_positionId: {
          candidateId: session.user.id,
          positionId: id,
        },
      },
    })
  }

  return (
    <div className="max-w-2xl p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{position.title}</h1>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
              position.isPublic
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {position.isPublic ? "Public" : "Restricted"}
          </span>
        </div>
        <Link href="/positions" className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </Link>
      </div>

      <p className="mb-6 text-gray-700">{position.description}</p>

      {/* Attributes this position requires */}
      {position.positionAttributes.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-500">
            Required attributes
          </h2>
          <div className="flex flex-wrap gap-2">
            {position.positionAttributes.map((pa) => (
              <span
                key={pa.id}
                className="rounded-full border px-3 py-0.5 text-xs text-gray-600"
              >
                {pa.attribute.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CV section — shown only to candidates */}
      {isCandidate && (
        <div className="rounded border p-4">
          <h2 className="mb-3 text-sm font-semibold">Your CV</h2>
          {!hasAccess ? (
            <p className="text-sm text-red-600">
              You don't meet the access requirements for this position. Check
              your profile and make sure the required attributes are filled in.
            </p>
          ) : existingCV ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Status: <strong>{existingCV.status}</strong>
              </span>
              <Link
                href={`/cv/${existingCV.id}`}
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
              >
                View CV →
              </Link>
            </div>
          ) : (
            <CreateCVButton positionId={id} />
          )}
        </div>
      )}

      {/* Prompt for anonymous users */}
      {!session && (
        <p className="text-sm text-gray-500">
          <Link href="/signin" className="underline">
            Sign in
          </Link>{" "}
          to apply for this position.
        </p>
      )}
    </div>
  )
}