"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { positionFormSchema, type PositionFormData } from "@/lib/schemas/position"
import { updatePosition } from "../../actions"
import Link from "next/link"
import AccessRulesEditor, { type RuleInput, type AccessRuleOperator} from "../../access-rules-editor"
import type { Attribute } from "@/app/positions/access-rules-editor"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Position = {
  id: string
  title: string
  description: string
  isPublic: boolean
  maxProjects: number
  projectTags: string[]
  version: number
  createdAt: Date
  updatedAt: Date
}

type PositionAttribute = {
  id: string
  positionId: string
  attributeId: string
  order: number
}

type AccessRule = {
  id: string
  positionId: string
  attributeId: string
  operator: AccessRuleOperator
  value: string
}

type Props = {
  position: Position & {
    positionAttributes: PositionAttribute[]
    accessRules: AccessRule[]
  }
  attributes: Attribute[]
}

export default function EditPositionForm({ position, attributes }: Props) {
  const t = useTranslations("Positions")
  const tCommon = useTranslations("Common")
  const router = useRouter()

  const existingIds = position.positionAttributes.map((pa) => pa.attributeId)
  const [selectedIds, setSelectedIds] = useState<string[]>(existingIds)
  const [attrSearch, setAttrSearch] = useState("")
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
    const result = await updatePosition(position.id, position.version, {
      ...data,
      accessRules: rules,
    })
    if (result?.error) {
      const msg = "_conflict" in result.error
        ? result.error._conflict?.[0]
        : t("validationError")
      toast.error(msg ?? t("somethingWrong"))
    }
    // On success, updatePosition redirects server-side
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 shadow-sm p-6">

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("titleLabel")}</label>
        <input
          {...register("title")}
          className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
        />
        {errors.title && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.title.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("description")}</label>
        <textarea
          {...register("description")}
          rows={4}
          className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
        />
        {errors.description && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.description.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPublic"
          {...register("isPublic")}
          className="h-4 w-4 accent-amber-500"
        />
        <label htmlFor="isPublic" className="text-sm text-slate-700 dark:text-slate-300">
          {t("publicLabel")}
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("maxProjectsLabel")}</label>
        <input
          type="number"
          {...register("maxProjects", { valueAsNumber: true })}
          className="w-24 rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
          min={1}
          max={20}
        />
        {errors.maxProjects && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.maxProjects.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("projectFilterTags")} <span className="text-slate-400 dark:text-slate-500">{t("commaSeparated")}</span>
        </label>
        <input
          {...register("projectTags")}
          className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("attributesTemplate")}
          {selectedIds.length > 0 && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">{t("selectedCount", { count: selectedIds.length })}</span>
          )}
        </label>
        <input
          type="text"
          placeholder={t("searchByName")}
          value={attrSearch}
          onChange={(e) => setAttrSearch(e.target.value)}
          className="mb-2 w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
        />
        <div className="max-h-48 overflow-y-auto rounded-lg border border-amber-200 dark:border-slate-600">
          {visibleAttributes.length === 0 ? (
            <p className="p-3 text-sm text-slate-400 dark:text-slate-500">{t("noAttributesMatch")}</p>
          ) : (
            visibleAttributes.map((attr) => (
              <label
                key={attr.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors duration-200"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(attr.id)}
                  onChange={() => toggleAttribute(attr.id)}
                  className="h-4 w-4 accent-amber-500"
                />
                <span className="text-sm text-slate-800 dark:text-slate-200">{attr.name}</span>
                <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{attr.category}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("accessRules")}
          <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
            {t("accessRulesHelp")}
          </span>
        </label>
        <AccessRulesEditor
          rules={rules}
          onChange={setRules}
          attributes={attributes as Attribute[]}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-900 px-4 py-2 text-sm text-white font-semibold transition-all duration-300 disabled:opacity-50"
        >
          {isSubmitting ? tCommon("saving") : t("saveChanges")}
        </button>
        <Link href="/positions" className="rounded-2xl border border-amber-200 dark:border-slate-600 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-300">
          {tCommon("cancel")}
        </Link>
      </div>

    </form>
  )
}