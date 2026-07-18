"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { attributeFormSchema, type AttributeFormData } from "@/lib/schemas/attribute"
import { updateAttribute } from "../../actions"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

const AttributeCategory = {
  CERTIFICATION: "CERTIFICATION",
  DOMAIN_KNOWLEDGE: "DOMAIN_KNOWLEDGE",
  PERSONAL_INFORMATION: "PERSONAL_INFORMATION",
  SOFT_SKILLS: "SOFT_SKILLS",
} as const

const AttributeType = {
  STRING: "STRING",
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  NUMERIC: "NUMERIC",
  DATE: "DATE",
  PERIOD: "PERIOD",
  BOOLEAN: "BOOLEAN",
  ONE_OF_MANY: "ONE_OF_MANY",
} as const

type AttributeCategory = typeof AttributeCategory[keyof typeof AttributeCategory]
type AttributeType = typeof AttributeType[keyof typeof AttributeType]

type Attribute = {
  id: string
  name: string
  category: AttributeCategory   // ← was string
  type: AttributeType           // ← was string
  options: string[]
  isBuiltIn: boolean
  version: number
  createdAt: Date
  updatedAt: Date
}

export default function EditAttributeForm({ attribute }: { attribute: Attribute }) {
  const t = useTranslations("Attributes")
  const tCommon = useTranslations("Common")

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
    const result = await updateAttribute(attribute.id, attribute.version, data)
    if (result?.error) {
      const msg = "_conflict" in result.error
        ? result.error._conflict?.[0]
        : t("validationError")
      toast.error(msg ?? t("somethingWrong"))
    }
    // On success, updateAttribute calls redirect() server-side
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 shadow-sm p-6">

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("name")}</label>
        <input
          {...register("name")}
          className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
        />
        {errors.name && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("category")}</label>
        <select {...register("category")} className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500">
          {Object.values(AttributeCategory).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.category.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("type")}</label>
        <select {...register("type")} className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500">
          {Object.values(AttributeType).map((tp) => (
            <option key={tp} value={tp}>{tp}</option>
          ))}
        </select>
        {errors.type && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.type.message}</p>}
      </div>

      {selectedType === "ONE_OF_MANY" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("options")} <span className="text-slate-400 dark:text-slate-500">{t("commaSeparated")}</span>
          </label>
          <input
            {...register("options")}
            className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
          />
          {errors.options && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.options.message}</p>}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-900 px-4 py-2 text-sm text-white font-semibold transition-all duration-300 disabled:opacity-50"
        >
          {isSubmitting ? tCommon("saving") : t("saveChanges")}
        </button>
        <Link href="/attributes" className="rounded-2xl border border-amber-200 dark:border-slate-600 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-300">
          {tCommon("cancel")}
        </Link>
      </div>

    </form>
  )
}