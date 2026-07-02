"use client"

import { AccessRuleOperator, AttributeType } from "@prisma/client"
import type { Attribute } from "@prisma/client"

export type RuleInput = {
  attributeId: string
  operator: AccessRuleOperator
  value: string
}

// Which operators make sense for each attribute type
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
      // When attribute changes, reset operator to first valid one for the new type
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
        <p className="text-sm text-gray-400">
          No rules — position is open to all authenticated users when Public.
        </p>
      )}

      {rules.map((rule, index) => {
        const attr = attributes.find((a) => a.id === rule.attributeId)
        const operators = attr
          ? getOperatorsForType(attr.type)
          : [AccessRuleOperator.EQUALS]
        // IS_TRUE / IS_FALSE don't need a value — hide the input
        const hideValue =
          rule.operator === AccessRuleOperator.IS_TRUE ||
          rule.operator === AccessRuleOperator.IS_FALSE

        return (
          <div
            key={index}
            className="flex flex-wrap items-center gap-2 rounded border p-2"
          >
            <select
              value={rule.attributeId}
              onChange={(e) => updateRule(index, { attributeId: e.target.value })}
              className="rounded border px-2 py-1 text-sm"
            >
              <option value="">Select attribute…</option>
              {attributes.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <select
              value={rule.operator}
              onChange={(e) =>
                updateRule(index, { operator: e.target.value as AccessRuleOperator })
              }
              className="rounded border px-2 py-1 text-sm"
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
                placeholder="Value…"
                className="rounded border px-2 py-1 text-sm"
              />
            )}

            <button
              type="button"
              onClick={() => removeRule(index)}
              className="ml-auto text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        )
      })}

      <button
        type="button"
        onClick={addRule}
        className="self-start rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        + Add rule
      </button>
    </div>
  )
}