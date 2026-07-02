import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import PositionTable from "./position-table"

export default async function PositionsPage() {
  const session = await auth()
  const isRecruiterOrAdmin =
    session?.user.role === "RECRUITER" || session?.user.role === "ADMIN"

  const positions = await prisma.position.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { positionAttributes: true } },
    },
  })

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Positions</h1>
        {isRecruiterOrAdmin && (
          <Link
            href="/positions/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
          >
            New Position
          </Link>
        )}
      </div>

      {isRecruiterOrAdmin ? (
        <PositionTable positions={positions} />
      ) : (
        // Candidates and anonymous users see the table without selection/toolbar
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b font-semibold">
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Access</th>
              <th className="py-2 pr-4">Attributes</th>
              <th className="py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => (
              <tr key={pos.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium">
                  <Link href={`/positions/${pos.id}`} className="hover:underline">
                    {pos.title}
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${pos.isPublic ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {pos.isPublic ? "Public" : "Restricted"}
                  </span>
                </td>
                <td className="py-2 pr-4">{pos._count.positionAttributes}</td>
                <td className="py-2 text-gray-500">{pos.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}