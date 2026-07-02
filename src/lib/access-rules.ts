import type { AccessRule, ProfileAttribute } from "@prisma/client"
import { AccessRuleOperator } from "@prisma/client"

// Returns true if the candidate meets ALL access rules for a position.
// Called both on the server (to show/hide the Create CV button)
// and inside createCV (to re-verify before writing to the DB).
export function evaluateAccessRules(
  rules: AccessRule[],
  profileAttributes: ProfileAttribute[]
): boolean {
  // Build a map so each rule lookup is O(1) instead of a nested loop
  const valueMap = new Map(profileAttributes.map((pa) => [pa.attributeId, pa.value]))

  // Every rule must pass — one failure means no access
  return rules.every((rule) => {
    const value = valueMap.get(rule.attributeId) ?? ""
    return evaluateSingleRule(rule.operator, value, rule.value)
  })
}

function evaluateSingleRule(
  operator: AccessRuleOperator,
  candidateValue: string,
  ruleValue: string
): boolean {
  switch (operator) {
    case AccessRuleOperator.IS_TRUE:
      return candidateValue === "true"
    case AccessRuleOperator.IS_FALSE:
      return candidateValue !== "true"
    case AccessRuleOperator.EQUALS:
      return candidateValue === ruleValue
    case AccessRuleOperator.CONTAINS:
      return candidateValue.toLowerCase().includes(ruleValue.toLowerCase())
    case AccessRuleOperator.GREATER_THAN:
      return parseFloat(candidateValue) > parseFloat(ruleValue)
    case AccessRuleOperator.LESS_THAN:
      return parseFloat(candidateValue) < parseFloat(ruleValue)
    case AccessRuleOperator.GREATER_THAN_OR_EQUAL:
      return parseFloat(candidateValue) >= parseFloat(ruleValue)
    case AccessRuleOperator.LESS_THAN_OR_EQUAL:
      return parseFloat(candidateValue) <= parseFloat(ruleValue)
    default:
      return false
  }
}