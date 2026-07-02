"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { attributeFormSchema, type AttributeFormData } from "@/lib/schemas/attribute"
import { updateAttribute } from "../../actions"
import { AttributeCategory, AttributeType } from "@prisma/client"
import type { Attribute } from "@prisma/client"
import Link from "next/link"

export default function EditAttributeForm({ attribute }: { attribute: Attribute }) {
  const [conflictError, setConflictError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AttributeFormData>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: {
      name: attribute.name,
      category: attribute.category,
      type: attribute.type,
      options: attribute.options.join(", "),
    },
  })

  const selectedType = watch("type")

  async function onSubmit(data: AttributeFormData) {
    setConflictError(null)
    const result = await updateAttribute(attribute.id, attribute.version, data)
    if (result?.error) {
      const msg = "_conflict" in result.error
        ? result.error._conflict?.[0]
        : "Validation error — please check the fields."
      setConflictError(msg ?? "Something went wrong.")
    }
    // On success, updateAttribute calls redirect() on the server
    // so this function never reaches here in the success case.
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

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
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input
          {...register("name")}
          className="w-full rounded border px-3 py-2 text-sm"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Category</label>
        <select {...register("category")} className="w-full rounded border px-3 py-2 text-sm">
          {Object.values(AttributeCategory).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Type</label>
        <select {...register("type")} className="w-full rounded border px-3 py-2 text-sm">
          {Object.values(AttributeType).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>}
      </div>

      {selectedType === "ONE_OF_MANY" && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            Options <span className="text-gray-400">(comma-separated)</span>
          </label>
          <input
            {...register("options")}
            className="w-full rounded border px-3 py-2 text-sm"
          />
          {errors.options && <p className="mt-1 text-xs text-red-600">{errors.options.message}</p>}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Save Changes"}
        </button>
        <Link href="/attributes" className="rounded border px-4 py-2 text-sm">
          Cancel
        </Link>
      </div>

    </form>
  )
}