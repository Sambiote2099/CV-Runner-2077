"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ReactTags } from "react-tag-autocomplete"
import { createProject, updateProject, deleteProject } from "./actions"
import type { Project } from "@prisma/client"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

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
  targetUserId,
}: {
  projects: Project[]
  // All tags previously used across this user's projects — for autocomplete
  allTags: string[]
  targetUserId?: string
}) {
  const router = useRouter()
  const t = useTranslations("Profile")
  const tCommon = useTranslations("Common")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedProject = projects.find((p) => p.id === selectedId)

  // Tag suggestions = all known tags, minus ones already selected in the form
  const selectedTagValues = new Set(form.tags.map((t) => t.value))
  const suggestions = toTags(allTags.filter((t) => !selectedTagValues.has(t)))

  function selectProject(project: Project) {
    if (selectedId === project.id) {
      setSelectedId(null)
      setIsAdding(false)
      return
    }
    setSelectedId(project.id)
    setIsAdding(false)
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
    setShowPreview(false)
  }

  function cancel() {
    setSelectedId(null)
    setIsAdding(false)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error(t("nameRequired"))
      return
    }
    setSaving(true)

    const payload = {
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description,
      tags: form.tags.map((t) => t.value),
    }

    if (isAdding) {
      const result = await createProject(payload, targetUserId)
      if (result.error) { toast.error(result.error); setSaving(false); return }
      toast.success(t("projectCreated"))
    } else if (selectedProject) {
      const result = await updateProject(selectedProject.id, selectedProject.version, payload)
      if (result.error === "conflict") {
        toast.error(t("changedElsewhere"))
        setSaving(false)
        return
      }
      toast.success(t("projectSaved"))
    }

    setSaving(false)
    cancel()
    router.refresh()
  }

  async function handleDelete() {
    if (!selectedProject) return
    const confirmed = window.confirm(t("deleteConfirm", { name: selectedProject.name }))
    if (!confirmed) return

    const result = await deleteProject(selectedProject.id, selectedProject.version)
    if (result.error) { toast.error(result.error); return }
    toast.success(t("projectDeleted"))
    cancel()
    router.refresh()
  }

  const isEditing = isAdding || selectedId !== null

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex min-h-[36px] items-center gap-2">
        {!isEditing ? (
          <button onClick={startAdding} className="rounded-2xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-900 px-3 py-1 text-sm text-white font-semibold transition-all duration-300">
            {t("addProject")}
          </button>
        ) : (
          <>
            <button onClick={handleSave} disabled={saving} className="rounded-2xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-900 px-3 py-1 text-sm text-white font-semibold transition-all duration-300 disabled:opacity-50">
              {saving ? t("saving") : tCommon("save")}
            </button>
            <button onClick={cancel} className="rounded-lg border border-amber-200 dark:border-slate-600 px-3 py-1 text-sm text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-300">
              {tCommon("cancel")}
            </button>
            {selectedId && (
              <button onClick={handleDelete} className="rounded-lg border border-rose-300 dark:border-rose-700 px-3 py-1 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all duration-300">
                {tCommon("delete")}
              </button>
            )}
          </>
        )}
      </div>

      {/* Project list */}
      {projects.length === 0 && !isAdding ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">{t("noProjects")}</p>
      ) : (
        <div className="bg-white p-2 dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-amber-50 dark:divide-slate-700">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => selectProject(project)}
              className={`flex cursor-pointer hover:scale-102 hover:-translate-x-2 items-center gap-3 px-3 py-2 transition-all duration-300 ${
                selectedId === project.id
                  ? "bg-amber-100 dark:bg-slate-600"
                  : "hover:bg-amber-50 dark:hover:bg-slate-700"
              }`}
            >
              <input type="checkbox" readOnly checked={selectedId === project.id} className="pointer-events-none h-4 w-4 accent-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{project.name}</p>
                {project.tags.length > 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">{project.tags.join(", ")}</p>
                )}
              </div>
              {project.startDate && (
                <span className="text-xs text-slate-400 dark:text-slate-500">{project.startDate.toLocaleDateString()}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inline edit/add form */}
      {isEditing && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {isAdding ? t("newProject") : t("editProject")}
          </h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("name")}</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500" placeholder={t("projectNamePlaceholder")} />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("startDate")}</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("endDate")}</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500" />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("description")}</label>
              <button type="button" onClick={() => setShowPreview((v) => !v)} className="text-xs text-amber-600 dark:text-amber-400 underline">
                {showPreview ? t("edit") : t("preview")}
              </button>
            </div>
            {showPreview ? (
              <div className="prose prose-sm dark:prose-invert min-h-[100px] rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 p-3">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.description || t("nothingToPreview")}</ReactMarkdown>
              </div>
            ) : (
              <textarea rows={5} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500" placeholder={t("markdownSupported")} />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("technologyTags")}</label>
            <ReactTags
              selected={form.tags}
              suggestions={suggestions}
              onAdd={(tag) => setForm((f) => ({ ...f, tags: [...f.tags, tag as Tag] }))}
              onDelete={(index) => setForm((f) => ({ ...f, tags: f.tags.filter((_, i) => i !== index) }))}
              allowNew
              noOptionsText={t("noMatchingTags")}
            />
          </div>
        </div>
      )}
    </div>
  )
}