"use client"

import { useState } from "react"
import { generatePositionToken } from "../actions"
import { useTranslations } from "next-intl"

export default function TokenButton({ positionId, existingToken }: {
  positionId: string
  existingToken: string | null
}) {
  const [token, setToken] = useState<string | null>(existingToken)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    const result = await generatePositionToken(positionId)
    if (result.token) setToken(result.token)
    setLoading(false)
  }

  async function handleCopy() {
    if (!token) return
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        API Token — share this with Odoo to import position data.
        {token && " Regenerating creates a new token and invalidates the old one."}
      </p>

      {token && (
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 break-all font-mono border border-slate-200 dark:border-slate-600">
            {token}
          </code>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {token && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            API endpoint:
          </p>
          <code className="text-xs text-amber-600 dark:text-amber-400 font-mono">
            GET /api/positions/export?token={token.slice(0, 8)}...
          </code>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="self-start rounded-2xl border border-amber-300 dark:border-amber-600 px-4 py-2 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-semibold transition-all duration-300 disabled:opacity-50"
      >
        {loading ? "Generating…" : token ? "Regenerate Token" : "Generate API Token"}
      </button>
    </div>
  )
}