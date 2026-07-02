"use client"

import { useRef, useState } from "react"
import { saveProfileAttribute } from "./actions"
import type { Attribute, ProfileAttribute } from "@prisma/client"

type ProfileAttrWithAttribute = ProfileAttribute & { attribute: Attribute }

type SaveStatus = "saved" | "saving" | "unsaved" | "conflict"

export default function MeTab({
  profileAttributes,
}: {
  profileAttributes: ProfileAttrWithAttribute[]
}) {
  // Displayed values — changing these triggers a re-render (so the input updates)
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(profileAttributes.map((pa) => [pa.id, pa.value]))
  )

  // Versions — stored in a ref so updating them doesn't cause re-renders.
  // We still need the latest version for the next save, just not for display.
  const versionsRef = useRef<Record<string, number>>(
    Object.fromEntries(profileAttributes.map((pa) => [pa.id, pa.version]))
  )

  // One timer per field — each field's debounce runs independently
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved")
  const [conflictField, setConflictField] = useState<string | null>(null)

  function handleChange(id: string, newValue: string) {
    setValues((prev) => ({ ...prev, [id]: newValue }))
    setSaveStatus("unsaved")
    setConflictField(null)

    // Clear any pending save for this field, then start a fresh 5-second timer
    if (timersRef.current[id]) clearTimeout(timersRef.current[id])
    timersRef.current[id] = setTimeout(() => doSave(id, newValue), 5000)
  }

  async function doSave(id: string, value: string) {
    setSaveStatus("saving")
    const currentVersion = versionsRef.current[id]
    const result = await saveProfileAttribute(id, currentVersion, value)

    if (result.error === "conflict") {
      setSaveStatus("conflict")
      setConflictField(id)
      return
    }

    if (result.version) {
      // Update the stored version so the next save uses the new number
      versionsRef.current[id] = result.version
    }

    setSaveStatus("saved")
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Save status indicator */}
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
            Conflict — this was changed elsewhere.{" "}
            <button
              onClick={() => window.location.reload()}
              className="underline"
            >
              Reload
            </button>
          </span>
        )}
      </div>

      {profileAttributes.map((pa) => {
        // Personal Photo needs UploadThing — placeholder until Phase 5
        const isImage = pa.attribute.type === "IMAGE"

        return (
          <div key={pa.id}>
            <label className="mb-1 block text-sm font-medium">
              {pa.attribute.name}
            </label>
            {isImage ? (
              <p className="text-sm text-gray-400 italic">
                Image upload coming soon.
              </p>
            ) : (
              <input
                type="text"
                value={values[pa.id]}
                onChange={(e) => handleChange(pa.id, e.target.value)}
                className={`w-full rounded border px-3 py-2 text-sm ${
                  conflictField === pa.id ? "border-red-400" : ""
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}