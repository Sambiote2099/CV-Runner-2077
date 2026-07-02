"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { saveProfileAttribute, addProfileAttribute, removeProfileAttribute } from "./actions"
import type { Attribute, ProfileAttribute } from "@prisma/client"

type ProfileAttrWithAttribute = ProfileAttribute & { attribute: Attribute }

type SaveStatus = "saved" | "saving" | "unsaved" | "conflict"

type Props = {
  // Attributes the user has already added to their Info section
  profileAttributes: ProfileAttrWithAttribute[]
  // All non-built-in library attributes (for the picker)
  availableAttributes: Attribute[]
}

export default function InfoTab({ profileAttributes, availableAttributes }: Props) {
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
    await addProfileAttribute(attributeId)
    setShowPicker(false)
    setPickerSearch("")
    // Refresh the page so the new row appears — same pattern as attribute/position tables
    router.refresh()
  }

  async function handleRemove(id: string) {
    const confirmed = window.confirm("Remove this attribute from your profile?")
    if (!confirmed) return
    await removeProfileAttribute(id)
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
        {saveStatus === "saved" && (
          <span className="text-green-600">All changes saved ✓</span>
        )}
        {saveStatus === "saving" && (
          <span className="text-gray-400">Saving…</span>
        )}
        {saveStatus === "unsaved" && (
          <span className="text-yellow-600">Unsaved changes</span>
        )}
        {saveStatus === "conflict" && (
          <span className="text-red-600">
            Conflict — changed elsewhere.{" "}
            <button onClick={() => window.location.reload()} className="underline">
              Reload
            </button>
          </span>
        )}
      </div>

      {/* Existing Info attributes */}
      {profileAttributes.length === 0 ? (
        <p className="text-sm text-gray-400">
          No attributes yet. Add some from the library below.
        </p>
      ) : (
        profileAttributes.map((pa) => (
          <div key={pa.id} className="flex items-start gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">
                {pa.attribute.name}
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {pa.attribute.type}
                </span>
              </label>

              {pa.attribute.type === "BOOLEAN" ? (
                <input
                  type="checkbox"
                  checked={values[pa.id] === "true"}
                  onChange={(e) =>
                    handleChange(pa.id, e.target.checked ? "true" : "false")
                  }
                  className="h-4 w-4"
                />
              ) : pa.attribute.type === "ONE_OF_MANY" ? (
                <select
                  value={values[pa.id]}
                  onChange={(e) => handleChange(pa.id, e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                >
                  <option value="">Select…</option>
                  {pa.attribute.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : pa.attribute.type === "IMAGE" ? (
                <p className="text-sm italic text-gray-400">
                  Image upload coming soon.
                </p>
              ) : (
                <input
                  type={pa.attribute.type === "NUMERIC" ? "number" : "text"}
                  value={values[pa.id]}
                  onChange={(e) => handleChange(pa.id, e.target.value)}
                  className={`w-full rounded border px-3 py-2 text-sm ${
                    conflictId === pa.id ? "border-red-400" : ""
                  }`}
                />
              )}
            </div>

            <button
              onClick={() => handleRemove(pa.id)}
              className="mt-6 text-xs text-red-400 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        ))
      )}

      {/* Attribute picker */}
      <div>
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
        >
          {showPicker ? "Cancel" : "+ Add Attribute"}
        </button>

        {showPicker && (
          <div className="mt-2 rounded border p-3">
            <input
              type="text"
              placeholder="Search by name…"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              className="mb-2 w-full rounded border px-3 py-2 text-sm"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto">
              {filteredPicker.length === 0 ? (
                <p className="py-2 text-sm text-gray-400">No attributes match.</p>
              ) : (
                filteredPicker.map((attr) => (
                  <button
                    key={attr.id}
                    onClick={() => handleAdd(attr.id)}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50"
                  >
                    <span>{attr.name}</span>
                    <span className="text-xs text-gray-400">{attr.category}</span>
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