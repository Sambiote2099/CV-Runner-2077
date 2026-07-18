"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { saveProfileAttribute, addProfileAttribute, removeProfileAttribute } from "./actions"
import ImageUpload from "@/components/image-upload"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Attribute = {
  id: string
  name: string
  type: string
  options: string[]
  category: string
  isBuiltIn: boolean
  version: number
  createdAt: Date
  updatedAt: Date
}

type ProfileAttribute = {
  id: string
  userId: string
  attributeId: string
  value: string
  version: number
  createdAt: Date
  updatedAt: Date
  attribute: Attribute
}

type ProfileAttrWithAttribute = ProfileAttribute & { attribute: Attribute }

type SaveStatus = "saved" | "saving" | "unsaved" | "conflict"
type Labels = {
  saving: string
  saved: string
  unsaved: string
  conflict: string
  reload: string
  required: string
  noAttributes: string
  remove: string
  cancel: string
  addAttribute: string
  searchByName: string
  noAttributesMatch: string
  select: string
  imageUploadSoon: string
  removeAttributeConfirm: string
  to: string
  edit: string
  preview: string
  nothingYet: string
  markdownSupported: string
}

type Props = {
  profileAttributes: ProfileAttrWithAttribute[]
  availableAttributes: Attribute[]
  labels: Labels
  targetUserId?: string
}

function TextAttributeInput({
  value,
  onChange,
  labels,
}: {
  value: string
  onChange: (v: string) => void
  labels: Labels
}) {
  const [preview, setPreview] = useState(false)
  return (
    <div>
      <div className="mb-1 flex justify-end">
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className="text-xs text-amber-600 dark:text-amber-400 underline"
        >
          {preview ? labels.edit : labels.preview}
        </button>
      </div>
      {preview ? (
        <div className="prose prose-sm dark:prose-invert min-h-[80px] rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 p-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {value || labels.nothingYet}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
          placeholder={labels.markdownSupported}
        />
      )}
    </div>
  )
}

export default function InfoTab({ profileAttributes, availableAttributes, labels, targetUserId }: Props) {
  const router = useRouter()
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState("")

  // Same auto-save pattern as MeTab
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(profileAttributes.map((pa) => [pa.id, pa.value]))
  )
  const versionsRef = useRef<Record<string, number>>(
    Object.fromEntries(profileAttributes.map((pa) => [pa.id, pa.version]))
  )
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved")
  const [conflictId, setConflictId] = useState<string | null>(null)

  function handleChange(id: string, newValue: string) {
    setValues((prev) => ({ ...prev, [id]: newValue }))
    setSaveStatus("unsaved")
    setConflictId(null)
    if (timersRef.current[id]) clearTimeout(timersRef.current[id])
    timersRef.current[id] = setTimeout(() => doSave(id, newValue), 5000)
  }

  async function doSave(id: string, value: string) {
    setSaveStatus("saving")
    const result = await saveProfileAttribute(id, versionsRef.current[id], value)
    if (result.error === "conflict") {
      setSaveStatus("conflict")
      setConflictId(id)
      return
    }
    if (result.version) versionsRef.current[id] = result.version
    setSaveStatus("saved")
  }

  async function handleAdd(attributeId: string) {
    await addProfileAttribute(attributeId, targetUserId)
    setShowPicker(false)
    setPickerSearch("")
    // Refresh the page so the new row appears — same pattern as attribute/position tables
    router.refresh()
  }

  async function handleRemove(id: string) {
    const confirmed = window.confirm(labels.removeAttributeConfirm)
    if (!confirmed) return
    await removeProfileAttribute(id, targetUserId)
    router.refresh()
  }

  // IDs already on the profile — we hide these in the picker
  const addedIds = new Set(profileAttributes.map((pa) => pa.attributeId))

  const filteredPicker = availableAttributes.filter(
    (a) =>
      !addedIds.has(a.id) &&
      a.name.toLowerCase().startsWith(pickerSearch.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Save status */}
      <div className="text-sm">
        {saveStatus === "saved" && <span className="text-emerald-600 dark:text-emerald-400">{labels.saved}</span>}
        {saveStatus === "saving" && <span className="text-slate-400">{labels.saving}</span>}
        {saveStatus === "unsaved" && <span className="text-amber-600 dark:text-amber-400">{labels.unsaved}</span>}
        {saveStatus === "conflict" && (
          <span className="text-rose-600 dark:text-rose-400">
            {labels.conflict}{" "}
            <button onClick={() => window.location.reload()} className="underline">
              {labels.reload}
            </button>
          </span>
        )}
      </div>

      {/* Existing Info attributes */}
      {profileAttributes.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {labels.noAttributes}
        </p>
      ) : (
        profileAttributes.map((pa) => (
          <div key={pa.id} className="flex items-start gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {pa.attribute.name}
                <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
                  {pa.attribute.type}
                </span>
              </label>

              {pa.attribute.type === "IMAGE" ? (
                <ImageUpload value={values[pa.id]} onChange={(url) => handleChange(pa.id, url)} />
              ) : pa.attribute.type === "BOOLEAN" ? (
                <input type="checkbox" checked={values[pa.id] === "true"} onChange={(e) => handleChange(pa.id, e.target.checked ? "true" : "false")} className="h-4 w-4 accent-amber-500" />
              ) : pa.attribute.type === "ONE_OF_MANY" ? (
                <select value={values[pa.id]} onChange={(e) => handleChange(pa.id, e.target.value)} className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-white dark:bg-[#2e2e2e] px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500">
                  <option value="">{labels.select}</option>
                  {pa.attribute.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              ) : pa.attribute.type === "DATE" ? (
                <input type="date" value={values[pa.id]} onChange={(e) => handleChange(pa.id, e.target.value)} className="rounded-lg border border-amber-200 dark:border-slate-600 bg-white dark:bg-[#2e2e2e] px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500" />
              ) : pa.attribute.type === "PERIOD" ? (
                <div className="flex items-center gap-2">
                  <input type="date" value={values[pa.id]?.split("|")[0] ?? ""} onChange={(e) => { const end = values[pa.id]?.split("|")[1] ?? ""; handleChange(pa.id, `${e.target.value}|${end}`) }} className="rounded-lg border border-amber-200 dark:border-slate-600 bg-white dark:bg-[#2e2e2e] px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500" />
                  <span className="text-sm text-slate-400">{labels.to}</span>
                  <input type="date" value={values[pa.id]?.split("|")[1] ?? ""} onChange={(e) => { const start = values[pa.id]?.split("|")[0] ?? ""; handleChange(pa.id, `${start}|${e.target.value}`) }} className="rounded-lg border border-amber-200 dark:border-slate-600 bg-white dark:bg-[#2e2e2e] px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500" />
                </div>
              ) : pa.attribute.type === "TEXT" ? (
                <TextAttributeInput value={values[pa.id]} onChange={(v) => handleChange(pa.id, v)} labels={labels} />
              ) : (
                <input type={pa.attribute.type === "NUMERIC" ? "number" : "text"} value={values[pa.id]} onChange={(e) => handleChange(pa.id, e.target.value)} className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-white dark:bg-[#2e2e2e] px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500" />
              )}
            </div>

            <button
              onClick={() => handleRemove(pa.id)}
              className="mt-6 text-xs text-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
            >
              {labels.remove}
            </button>
          </div>
        ))
      )}

      {/* Attribute picker */}
      <div>
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="rounded-lg border border-amber-200 dark:border-slate-600 px-3 py-1 text-sm text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-300"
        >
          {showPicker ? labels.cancel : labels.addAttribute}
        </button>

        {showPicker && (
          <div className="mt-2 rounded-xl border border-amber-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-3">
            <input
              type="text"
              placeholder={labels.searchByName}
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              className="mb-2 w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto">
              {filteredPicker.length === 0 ? (
                <p className="py-2 text-sm text-slate-400 dark:text-slate-500">{labels.noAttributesMatch}</p>
              ) : (
                filteredPicker.map((attr) => (
                  <button
                    key={attr.id}
                    onClick={() => handleAdd(attr.id)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors duration-200"
                  >
                    <span>{attr.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{attr.category}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}