"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deletePosition, duplicatePosition } from "./actions"
import Link from "next/link"

type PositionRow = {
  id: string
  title: string
  isPublic: boolean
  version: number
  createdAt: Date
  _count: { positionAttributes: number }
}

export default function PositionTable({ positions }: { positions: PositionRow[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const selected = positions.find((p) => p.id === selectedId)

  async function handleDelete() {
    if (!selected) return
    const confirmed = window.confirm(`Delete "${selected.title}"? This cannot be undone.`)
    if (!confirmed) return

    const result = await deletePosition(selected.id, selected.version)
    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Something went wrong.")
    } else {
      setSelectedId(null)
      router.refresh()
    }
  }

  async function handleDuplicate() {
    if (!selected) return
    const result = await duplicatePosition(selected.id)
    if (result?.error) {
      setError(result.error)
    } else {
      setSelectedId(null)
      router.refresh()
    }
  }

  return (
    <div>
      <div className="mb-3 flex min-h-[40px] items-center gap-2">
        {selected ? (
          <>
            <span className="text-sm text-gray-500">1 selected</span>
            <Link
              href={`/positions/${selected.id}/edit`}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Edit
            </Link>
            <button
              onClick={handleDuplicate}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Duplicate
            </button>
            <button
              onClick={handleDelete}
              className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </>
        ) : (
          <span className="text-sm text-gray-400">Select a row to edit, duplicate, or delete</span>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {positions.length === 0 ? (
        <p className="text-gray-500">No positions yet.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b font-semibold">
              <th className="w-8 py-2"></th>
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Access</th>
              <th className="py-2 pr-4">Attributes</th>
              <th className="py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => (
              <tr
                key={pos.id}
                className={`cursor-pointer border-b ${
                  selectedId === pos.id ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedId(selectedId === pos.id ? null : pos.id)}
              >
                <td className="py-2">
                  <input
                    type="checkbox"
                    readOnly
                    checked={selectedId === pos.id}
                    className="pointer-events-none"
                  />
                </td>
                <td className="py-2 pr-4 font-medium">
                  <Link href={`/positions/${pos.id}`} className="hover:underline">
                    {pos.title}
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      pos.isPublic
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {pos.isPublic ? "Public" : "Restricted"}
                  </span>
                </td>
                <td className="py-2 pr-4">{pos._count.positionAttributes}</td>
                <td className="py-2 text-gray-500">
                  {pos.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}