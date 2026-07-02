"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { positionFormSchema, type PositionFormData } from "@/lib/schemas/position"
import { updatePosition } from "../../actions"
import Link from "next/link"
import AccessRulesEditor, { type RuleInput } from "../../access-rules-editor"
import type { Attribute, Position, PositionAttribute, AccessRule } from "@prisma/client"

type Props = {
  position: Position & {
    positionAttributes: PositionAttribute[]
    accessRules: AccessRule[]
  }
  attributes: Attribute[]
}

export default function EditPositionForm({ position, attributes }: Props) {
  const existingIds = position.positionAttributes.map((pa) => pa.attributeId)
  const [selectedIds, setSelectedIds] = useState<string[]>(existingIds)
  const [attrSearch, setAttrSearch] = useState("")
  const [conflictError, setConflictError] = useState<string | null>(null)
  const existingRules: RuleInput[] = position.accessRules.map((r) => ({
  attributeId: r.attributeId,
  operator: r.operator,
  value: r.value,
  }))
  const [rules, setRules] = useState<RuleInput[]>(existingRules)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PositionFormData>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      title: position.title,
      description: position.description,
      isPublic: position.isPublic,
      maxProjects: position.maxProjects,
      projectTags: position.projectTags.join(", "),
      attributeIds: existingIds,
      accessRules: existingRules,
    },
  })

  async function onSubmit(data: PositionFormData) {
  setConflictError(null)
  const result = await updatePosition(position.id, position.version, {
    ...data,
    accessRules: rules,
  })
  if (result?.error) {
    const msg =
      "_conflict" in result.error
        ? result.error._conflict?.[0]
        : "Validation error — please check the fields."
    setConflictError(msg ?? "Something went wrong.")
  }
}

  function toggleAttribute(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id]
    setSelectedIds(next)
    setValue("attributeIds", next)
  }

  const visibleAttributes = attributes.filter((a) =>
    a.name.toLowerCase().startsWith(attrSearch.toLowerCase())
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

      {conflictError && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {conflictError}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-2 underline"
          >
            Reload
          </button>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          {...register("title")}
          className="w-full rounded border px-3 py-2 text-sm"
        />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          {...register("description")}
          rows={4}
          className="w-full rounded border px-3 py-2 text-sm"
        />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPublic"
          {...register("isPublic")}
          className="h-4 w-4"
        />
        <label htmlFor="isPublic" className="text-sm">
          Public — any authenticated user can access this position
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Max Projects to show in CV</label>
        <input
          type="number"
          {...register("maxProjects", { valueAsNumber: true })}
          className="w-24 rounded border px-3 py-2 text-sm"
          min={1}
          max={20}
        />
        {errors.maxProjects && <p className="mt-1 text-xs text-red-600">{errors.maxProjects.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Project Tags <span className="text-gray-400">(comma-separated)</span>
        </label>
        <input
          {...register("projectTags")}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Attributes for this positions template
          {selectedIds.length > 0 && (
            <span className="ml-2 text-blue-600">{selectedIds.length} selected</span>
          )}
        </label>
        <input
          type="text"
          placeholder="Search by name…"
          value={attrSearch}
          onChange={(e) => setAttrSearch(e.target.value)}
          className="mb-2 w-full rounded border px-3 py-2 text-sm"
        />
        <div className="max-h-48 overflow-y-auto rounded border">
          {visibleAttributes.length === 0 ? (
            <p className="p-3 text-sm text-gray-400">No attributes match.</p>
          ) : (
            visibleAttributes.map((attr) => (
              <label
                key={attr.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(attr.id)}
                  onChange={() => toggleAttribute(attr.id)}
                  className="h-4 w-4"
                />
                <span className="text-sm">{attr.name}</span>
                <span className="ml-auto text-xs text-gray-400">{attr.category}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Access Rules
          <span className="ml-2 text-xs font-normal text-gray-400">
            (only applies when position is not Public)
          </span>
        </label>
        <AccessRulesEditor
          rules={rules}
          onChange={setRules}
          attributes={attributes}
        />
      </div>
      
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Save Changes"}
        </button>
        <Link href="/positions" className="rounded border px-4 py-2 text-sm">
          Cancel
        </Link>
      </div>

    </form>
  )
}