"use client"

import { useRef, useState } from "react"
import { saveProfileAttribute } from "@/app/profile/actions"
import type { Attribute } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import ImageUpload from "@/components/image-upload"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Props = {
  profileAttributeId: string
  initialValue: string
  initialVersion: number
  attribute: Attribute
}

function TextAttributeInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [preview, setPreview] = useState(false)
  return (
    <div>
      <div className="mb-1 flex justify-end">
        <button type="button" onClick={() => setPreview((v) => !v)} className="text-xs text-amber-600 dark:text-amber-400 underline">
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div className="prose prose-sm dark:prose-invert min-h-[80px] rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 p-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value || "*Nothing yet.*"}</ReactMarkdown>
        </div>
      ) : (
        <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500" placeholder="Markdown supported…" />
      )}
    </div>
  )
}

export default function CVAttributeField({
  profileAttributeId,
  initialValue,
  initialVersion,
  attribute,
}: Props) {
  const t = useTranslations("CV")
  const tCommon = useTranslations("Common")
  const [value, setValue] = useState(initialValue)
  const [version, setVersion] = useState(initialVersion)
  const [status, setStatus] = useState<"idle" | "saving" | "conflict">("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const isEmpty = !value.trim()

  // Text/numeric: debounce — user is still typing
function handleTextChange(newValue: string) {
  setValue(newValue)
  setStatus("idle")
  if (timerRef.current) clearTimeout(timerRef.current)
  timerRef.current = setTimeout(() => doSave(newValue), 5000)
}

// Dropdown/checkbox: save immediately — single deliberate selection,
// debouncing would leave the Publish button stale after the user picks a value
function handleSelectChange(newValue: string) {
  setValue(newValue)
  doSave(newValue)
}

  async function doSave(val: string) {
  setStatus("saving")
  const result = await saveProfileAttribute(profileAttributeId, version, val)
  if (result.error === "conflict") { setStatus("conflict"); return }
  if (result.version) setVersion(result.version)
  setStatus("idle")
  // Recompute allFilled on the server so the Publish button enables correctly
  router.refresh()
}

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500 ${
    isEmpty
      ? "border-rose-400 bg-rose-50 dark:bg-rose-900/20 placeholder:text-rose-400 text-slate-800 dark:text-slate-200"
      : "border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
  }`

  return (
    <div>
      {attribute.type === "BOOLEAN" ? (
        <input type="checkbox" checked={value === "true"} onChange={(e) => handleSelectChange(e.target.checked ? "true" : "false")} className="h-4 w-4 accent-amber-500" />
      ) : attribute.type === "ONE_OF_MANY" ? (
        <select value={value} onChange={(e) => handleSelectChange(e.target.value)} className={inputClass}>
          <option value="">Select…</option>
          {attribute.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
        </select>
      ) : attribute.type === "IMAGE" ? (
        <ImageUpload value={value} onChange={(url) => handleSelectChange(url)} />
      ) : attribute.type === "DATE" ? (
        <input type="date" value={value} onChange={(e) => handleSelectChange(e.target.value)} className={inputClass} />
      ) : attribute.type === "PERIOD" ? (
        <div className="flex items-center gap-2">
          <input type="date" value={value?.split("|")[0] ?? ""} onChange={(e) => { const end = value?.split("|")[1] ?? ""; handleTextChange(`${e.target.value}|${end}`) }} className="rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500" />
          <span className="text-sm text-slate-400">to</span>
          <input type="date" value={value?.split("|")[1] ?? ""} onChange={(e) => { const start = value?.split("|")[0] ?? ""; handleTextChange(`${start}|${e.target.value}`) }} className="rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500" />
        </div>
      ) : attribute.type === "TEXT" ? (
        <TextAttributeInput value={value} onChange={(v) => handleTextChange(v)} />
      ) : (
        <input type={attribute.type === "NUMERIC" ? "number" : "text"} value={value} onChange={(e) => handleTextChange(e.target.value)} placeholder={isEmpty ? "Required — please fill in" : ""} className={inputClass} />
      )}

      <div className="mt-0.5 min-h-[16px] text-xs">
        {status === "saving" && <span className="text-slate-400">{tCommon("saving")}</span>}
        {status === "conflict" && (
          <span className="text-rose-600 dark:text-rose-400">
            {tCommon("conflict")} —{" "}
            <button onClick={() => window.location.reload()} className="underline">{tCommon("reload")}</button>
          </span>
        )}
        {isEmpty && status === "idle" && (
          <span className="text-rose-500 dark:text-rose-400">{tCommon("required")}</span>
        )}
      </div>
    </div>
  )
}