"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { attributeFormSchema, type AttributeFormData } from "@/lib/schemas/attribute"
import { createAttribute } from "../actions"
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

export default function NewAttributePage() {
  const t = useTranslations("Attributes")
  const tCommon = useTranslations("Common")
  
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
    const result = await createAttribute(data)
    if (result?.error) {
      toast.error(t("validationError"))
    }
    // On success, createAttribute redirects server-side
  }

  return (
    <div className="bg-amber-50 dark:bg-slate-950 min-h-screen">
    <div className="p-4 md:p-6 max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-slate-800 dark:text-amber-100">{t("newAttribute")}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 shadow-sm p-6">

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("name")}</label>
          <input
            {...register("name")}
            className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
            placeholder={t("namePlaceholder")}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("category")}</label>
          <select {...register("category")} className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500">
            <option value="">{t("selectCategory")}</option>
            {Object.values(AttributeCategory).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("type")}</label>
          <select {...register("type")} className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500">
            <option value="">{t("selectType")}</option>
            {Object.values(AttributeType).map((tp) => (
              <option key={tp} value={tp}>{tp}</option>
            ))}
          </select>
          {errors.type && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.type.message}</p>
          )}
        </div>

        {selectedType === "ONE_OF_MANY" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("options")} <span className="text-slate-400 dark:text-slate-500">{t("commaSeparated")}</span>
            </label>
            <input
              {...register("options")}
              className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
              placeholder={t("optionsPlaceholder")}
            />
            {errors.options && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.options.message}</p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-900 px-4 py-2 text-sm text-white font-semibold transition-all duration-300 disabled:opacity-50"
          >
            {isSubmitting ? tCommon("saving") : t("createAttribute")}
          </button>
          <Link
            href="/attributes"
            className="rounded-2xl border border-amber-200 dark:border-slate-600 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-300"
          >
            {tCommon("cancel")}
          </Link>
        </div>

      </form>
    </div>
    </div>
  )
}