"use client"

import { useState } from "react"
import useSWR from "swr"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { createDiscussionPost } from "./discussion-actions"
import { useTranslations } from "next-intl"
import Link from "next/link"

// SWR needs a fetcher function — a plain wrapper around fetch
const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Author = { id: string; name: string | null; role: string }
type Post = {
  id: string
  content: string
  createdAt: string
  author: Author
}

type Props = {
  positionId: string
  initialPosts: Post[]
  isLoggedIn: boolean
  isRecruiter: boolean
}

export default function DiscussionPanel({
  positionId,
  initialPosts,
  isLoggedIn,
  isRecruiter,
}: Props) {
  const t = useTranslations("Discussion")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // SWR polls every 3 seconds. fallbackData means the server-rendered
  // posts show immediately — no flash of empty content on first load.
  const { data: posts } = useSWR<Post[]>(
    `/api/positions/${positionId}/discussions`,
    fetcher,
    { refreshInterval: 3000, fallbackData: initialPosts }
  )

  async function handleSubmit() {
    if (!content.trim()) return
    setSubmitting(true)
    setError(null)
    const result = await createDiscussionPost(positionId, content)
    if (result?.error) {
      setError(result.error)
    } else {
      setContent("")
    }
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Post list */}
      {!posts || posts.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {t("noPosts")}
        </p>
      ) : (
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {posts.map((post) => (
            <div key={post.id} className="rounded-xl border border-amber-100 dark:border-slate-600 bg-white dark:bg-slate-800 p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                  {isRecruiter ? (
                    <Link href={`/profile/${post.author.id}`} className="font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                      {post.author.name ?? "Unknown"}
                    </Link>
                  ) : (
                    <strong className="text-slate-700 dark:text-slate-300">
                      {post.author.name ?? "Unknown"}
                    </strong>
                  )}
                  {isRecruiter && (
                    <span className="ml-1 text-slate-400 dark:text-slate-500">
                      · {post.author.role}
                    </span>
                  )}
                </span>
                <span>{new Date(post.createdAt).toLocaleString()}</span>
              </div>
              <div className="prose prose-sm dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {post.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post form — authenticated users only */}
      {isLoggedIn ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("addPost")}</label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("markdownSupported")}
            className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
          />
          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="self-start rounded-2xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-900 px-4 py-2 text-sm text-white font-semibold transition-all duration-300 disabled:opacity-50"
          >
            {submitting ? t("posting") : t("post")}
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {t("signInToPost")}
        </p>
      )}
    </div>
  )
}