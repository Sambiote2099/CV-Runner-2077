"use client"

import { useState } from "react"
import { toggleLike } from "./actions"
import { Heart } from "lucide-react"

export default function LikeButton({
  cvId,
  initialCount,
  initialLiked,
}: {
  cvId: string
  initialCount: number
  initialLiked: boolean
}) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    // Optimistic update — flip immediately, revert on error
    setLiked((v) => !v)
    setCount((c) => (liked ? c - 1 : c + 1))

    const result = await toggleLike(cvId)
    if (result?.error) {
      // Revert on failure
      setLiked((v) => !v)
      setCount((c) => (liked ? c + 1 : c - 1))
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex group items-center gap-1 rounded-lg border px-3 py-1 text-sm transition-all duration-300 ${
        liked
          ? "border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
          : "border-amber-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
      }`}
    >
      <Heart
        size={15}
        className={`transition-all group-hover:scale-110 duration-300 ${liked ? "fill-current" : ""}`}
      />
      {count}
    </button>
  )
}