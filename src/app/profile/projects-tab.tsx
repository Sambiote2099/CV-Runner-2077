"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ReactTags } from "react-tag-autocomplete"
import { createProject, updateProject, deleteProject } from "./actions"
import type { Project } from "@prisma/client"

type Tag = { value: string; label: string }

// Convert a plain string array to the shape react-tag-autocomplete expects
function toTags(strings: string[]): Tag[] {
  return strings.map((s) => ({ value: s, label: s }))
}

type FormState = {
  name: string
  startDate: string
  endDate: string
  description: string
  tags: Tag[]
}

const emptyForm: FormState = {
  name: "",
  startDate: "",
  endDate: "",
  description: "",
  tags: [],
}

export default function ProjectsTab({
  projects,
  allTags,
}: {
  projects: Project[]
  // All tags previously used across this user's projects — for autocomplete
  allTags: string[]
}) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedProject = projects.find((p) => p.id === selectedId)

  // Tag suggestions = all known tags, minus ones already selected in the form
  const selectedTagValues = new Set(form.tags.map((t) => t.value))
  const suggestions = toTags(allTags.filter((t) => !selectedTagValues.has(t)))

  function selectProject(project: Project) {
    // Clicking the same row deselects it
    if (selectedId === project.id) {
      setSelectedId(null)
      setIsAdding(false)
      return
    }
    setSelectedId(project.id)
    setIsAdding(false)
    setError(null)
    setShowPreview(false)
    setForm({
      name: project.name,
      startDate: project.startDate
        ? project.startDate.toISOString().split("T")[0]
        : "",
      endDate: project.endDate
        ? project.endDate.toISOString().split("T")[0]
        : "",
      description: project.description,
      tags: toTags(project.tags),
    })
  }

  function startAdding() {
    setSelectedId(null)
    setIsAdding(true)
    setForm(emptyForm)
    setError(null)
    setShowPreview(false)
  }

  function cancel() {
    setSelectedId(null)
    setIsAdding(false)
    setError(null)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Name is required.")
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description,
      tags: form.tags.map((t) => t.value),
    }

    if (isAdding) {
      const result = await createProject(payload)
      if (result.error) { setError(result.error); setSaving(false); return }
    } else if (selectedProject) {
      const result = await updateProject(selectedProject.id, selectedProject.version, payload)
      if (result.error === "conflict") {
        setError("This project was changed elsewhere. Please reload.")
        setSaving(false)
        return
      }
    }

    setSaving(false)
    cancel()
    router.refresh()
  }

  async function handleDelete() {
    if (!selectedProject) return
    const confirmed = window.confirm(`Delete "${selectedProject.name}"?`)
    if (!confirmed) return

    const result = await deleteProject(selectedProject.id, selectedProject.version)
    if (result.error) { setError(result.error); return }
    cancel()
    router.refresh()
  }

  const isEditing = isAdding || selectedId !== null

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex min-h-[36px] items-center gap-2">
        {!isEditing ? (
          <button
            onClick={startAdding}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
          >
            + Add Project
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={cancel}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            {selectedId && (
              <button
                onClick={handleDelete}
                className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Project list */}
      {projects.length === 0 && !isAdding ? (
        <p className="text-sm text-gray-400">No projects yet.</p>
      ) : (
        <div className="rounded border divide-y">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => selectProject(project)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
                selectedId === project.id ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                readOnly
                checked={selectedId === project.id}
                className="pointer-events-none h-4 w-4"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{project.name}</p>
                {project.tags.length > 0 && (
                  <p className="text-xs text-gray-400">{project.tags.join(", ")}</p>
                )}
              </div>
              {project.startDate && (
                <span className="text-xs text-gray-400">
                  {project.startDate.toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inline edit/add form */}
      {isEditing && (
        <div className="flex flex-col gap-3 rounded border p-4">
          <h2 className="text-sm font-semibold">
            {isAdding ? "New Project" : "Edit Project"}
          </h2>

          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="e.g. E-commerce Platform"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium">Description</label>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="text-xs text-blue-600 underline"
              >
                {showPreview ? "Edit" : "Preview"}
              </button>
            </div>
            {showPreview ? (
              <div className="prose prose-sm min-h-[100px] rounded border p-3">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {form.description || "*Nothing to preview yet.*"}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm font-mono"
                placeholder="Markdown supported…"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Technology Tags</label>
            <ReactTags
              selected={form.tags}
              suggestions={suggestions}
              onAdd={(tag) =>
                setForm((f) => ({ ...f, tags: [...f.tags, tag as Tag] }))
              }
              onDelete={(index) =>
                setForm((f) => ({
                  ...f,
                  tags: f.tags.filter((_, i) => i !== index),
                }))
              }
              allowNew
              noOptionsText="No matching tags"
            />
          </div>
        </div>
      )}
    </div>
  )
}