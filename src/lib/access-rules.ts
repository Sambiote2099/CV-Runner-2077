import type { AccessRule, ProfileAttribute } from "@prisma/client"
import { AccessRuleOperator } from "@prisma/client"

// Returns true if the candidate meets ALL access rules for a position.
// Called both on the server (to show/hide the Create CV button)
// and inside createCV (to re-verify before writing to the DB).
export function evaluateAccessRules(
  rules: AccessRule[],
  profileAttributes: ProfileAttribute[]
): boolean {
  // If there are no rules, access is granted
  if (rules.length === 0) return true

  const valueMap = new Map(profileAttributes.map((pa) => [pa.attributeId, pa.value]))

  return rules.every((rule) => {
    const value = valueMap.get(rule.attributeId)

    // If the candidate doesn't have this attribute at all, deny access.
    // An attribute that exists but is empty is also treated as not meeting
    // the rule — except for IS_TRUE/IS_FALSE which are boolean checks.
    if (value === undefined) return false

    // For non-boolean operators, an empty value never satisfies a rule
    if (
      value.trim() === "" &&
      rule.operator !== "IS_TRUE" &&
      rule.operator !== "IS_FALSE"
    ) {
      return false
    }

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
      return candidateValue === "false"
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