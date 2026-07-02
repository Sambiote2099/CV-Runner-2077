"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteAttribute } from "./actions"
import type { Attribute } from "@prisma/client"
import Link from "next/link"

export default function AttributeTable({ attributes }: { attributes: Attribute[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const selected = attributes.find((a) => a.id === selectedId)

  async function handleDelete() {
    if (!selected) return
    const confirmed = window.confirm(`Delete "${selected.name}"? This cannot be undone.`)
    if (!confirmed) return

    const result = await deleteAttribute(selected.id, selected.version)
    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Something went wrong.")
    } else {
      setSelectedId(null)
      router.refresh()
    }
  }

  return (
    <div>
      {/* Toolbar — only visible when a row is selected */}
      <div className="mb-3 flex min-h-[40px] items-center gap-2">
        {selected ? (
          <>
            <span className="text-sm text-gray-500">1 selected</span>
            <Link
              href={`/attributes/${selected.id}/edit`}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </>
        ) : (
          <span className="text-sm text-gray-400">Select a row to edit or delete</span>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {attributes.length === 0 ? (
        <p className="text-gray-500">No attributes yet.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b font-semibold">
              <th className="w-8 py-2"></th>
              <th className="py-2">Name</th>
              <th className="py-2">Category</th>
              <th className="py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {attributes.map((attr) => (
              <tr
                key={attr.id}
                className={`cursor-pointer border-b ${selectedId === attr.id ? "bg-blue-50" : "hover:bg-gray-50"}`}
                onClick={() => setSelectedId(selectedId === attr.id ? null : attr.id)}
              >
                <td className="py-2">
                  <input
                    type="checkbox"
                    readOnly
                    checked={selectedId === attr.id}
                    className="pointer-events-none"
                  />
                </td>
                <td className="py-2">{attr.name}</td>
                <td className="py-2">{attr.category}</td>
                <td className="py-2">{attr.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}