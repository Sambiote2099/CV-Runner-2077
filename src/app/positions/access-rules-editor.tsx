"use client"

import { useTranslations } from "next-intl"

export const AccessRuleOperator = {
  EQUALS: "EQUALS",
  GREATER_THAN: "GREATER_THAN",
  LESS_THAN: "LESS_THAN",
  GREATER_THAN_OR_EQUAL: "GREATER_THAN_OR_EQUAL",
  LESS_THAN_OR_EQUAL: "LESS_THAN_OR_EQUAL",
  IS_TRUE: "IS_TRUE",
  IS_FALSE: "IS_FALSE",
  CONTAINS: "CONTAINS",
} as const
export type AccessRuleOperator = typeof AccessRuleOperator[keyof typeof AccessRuleOperator]

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
export type AttributeType = typeof AttributeType[keyof typeof AttributeType]

export type Attribute = {
  id: string
  name: string
  category: string
  type: AttributeType
  options: string[]
  isBuiltIn: boolean
  version: number
  createdAt: Date
  updatedAt: Date
}

export type RuleInput = {
  attributeId: string
  operator: AccessRuleOperator
  value: string
}

function getOperatorsForType(type: AttributeType): AccessRuleOperator[] {
  switch (type) {
    case "NUMERIC":
    case "DATE":
    case "PERIOD":
      return [
        AccessRuleOperator.EQUALS,
        AccessRuleOperator.GREATER_THAN,
        AccessRuleOperator.LESS_THAN,
        AccessRuleOperator.GREATER_THAN_OR_EQUAL,
        AccessRuleOperator.LESS_THAN_OR_EQUAL,
      ]
    case "BOOLEAN":
      return [AccessRuleOperator.IS_TRUE, AccessRuleOperator.IS_FALSE]
    case "ONE_OF_MANY":
      return [AccessRuleOperator.EQUALS]
    default:
      return [AccessRuleOperator.EQUALS, AccessRuleOperator.CONTAINS]
  }
}

type Props = {
  rules: RuleInput[]
  onChange: (rules: RuleInput[]) => void
  attributes: Attribute[]
}

export default function AccessRulesEditor({ rules, onChange, attributes }: Props) {
  const t = useTranslations("Positions")

  function addRule() {
    onChange([
      ...rules,
      { attributeId: "", operator: AccessRuleOperator.EQUALS, value: "" },
    ])
  }

  function removeRule(index: number) {
    onChange(rules.filter((_, i) => i !== index))
  }

  function updateRule(index: number, patch: Partial<RuleInput>) {
    const next = rules.map((rule, i) => {
      if (i !== index) return rule
      const updated = { ...rule, ...patch }
      if (patch.attributeId) {
        const attr = attributes.find((a) => a.id === patch.attributeId)
        if (attr) updated.operator = getOperatorsForType(attr.type)[0]
      }
      return updated
    })
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {rules.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {t("noRulesHint")}
        </p>
      )}

      {rules.map((rule, index) => {
        const attr = attributes.find((a) => a.id === rule.attributeId)
        const operators = attr
          ? getOperatorsForType(attr.type)
          : [AccessRuleOperator.EQUALS]
        const hideValue =
          rule.operator === AccessRuleOperator.IS_TRUE ||
          rule.operator === AccessRuleOperator.IS_FALSE

        return (
          <div
            key={index}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 p-2"
          >
            <select
              value={rule.attributeId}
              onChange={(e) => updateRule(index, { attributeId: e.target.value })}
              className="rounded-lg border border-amber-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
            >
              <option value="">{t("selectAttribute")}</option>
              {attributes.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <select
              value={rule.operator}
              onChange={(e) =>
                updateRule(index, { operator: e.target.value as AccessRuleOperator })
              }
              className="rounded-lg border border-amber-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
            >
              {operators.map((op) => (
                <option key={op} value={op}>
                  {op.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            {!hideValue && (
              <input
                type="text"
                value={rule.value}
                onChange={(e) => updateRule(index, { value: e.target.value })}
                placeholder={t("valuePlaceholder")}
                className="rounded-lg border border-amber-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
              />
            )}

            <button
              type="button"
              onClick={() => removeRule(index)}
              className="ml-auto text-xs text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors duration-200"
            >
              {t("removeRule")}
            </button>
          </div>
        )
      })}

      <button
        type="button"
        onClick={addRule}
        className="self-start rounded-lg border border-amber-200 dark:border-slate-600 px-3 py-1 text-sm text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-300"
      >
        {t("addRule")}
      </button>
    </div>
  )
}
