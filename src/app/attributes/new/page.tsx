"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { attributeFormSchema, type AttributeFormData } from "@/lib/schemas/attribute"
import { createAttribute } from "../actions"
import { AttributeCategory, AttributeType } from "@prisma/client"
import Link from "next/link"

export default function NewAttributePage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AttributeFormData>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: { options: "" },
  })

  // Watch the type field live so we can show/hide the options input.
  const selectedType = watch("type")

  async function onSubmit(data: AttributeFormData) {
    await createAttribute(data)
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="mb-6 text-2xl font-bold">New Attribute</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            {...register("name")}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="e.g. IELTS Score"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select {...register("category")} className="w-full rounded border px-3 py-2 text-sm">
            <option value="">Select category…</option>
            {Object.values(AttributeCategory).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          <select {...register("type")} className="w-full rounded border px-3 py-2 text-sm">
            <option value="">Select type…</option>
            {Object.values(AttributeType).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.type && (
            <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>
          )}
        </div>

        {selectedType === "ONE_OF_MANY" && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Options <span className="text-gray-400">(comma-separated)</span>
            </label>
            <input
              {...register("options")}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="e.g. Beginner, Intermediate, Advanced"
            />
            {errors.options && (
              <p className="mt-1 text-xs text-red-600">{errors.options.message}</p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Create Attribute"}
          </button>
          <Link
            href="/attributes"
            className="rounded border px-4 py-2 text-sm"
          >
            Cancel
          </Link>
        </div>

      </form>
    </div>
  )
}