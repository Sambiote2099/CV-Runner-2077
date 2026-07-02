"use client"

import { useState } from "react"
import { createCV } from "@/app/cv/actions"

export default function CreateCVButton({ positionId }: { positionId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const result = await createCV(positionId)
    // On success, createCV calls redirect() on the server and we never
    // reach here. We only get a result back if there was an error.
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create CV for this position"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}