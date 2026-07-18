import { z } from "zod"

// Defined locally to avoid importing @prisma/client in this file,
// which gets bundled into client components that import this schema.
const accessRuleOperators = [
  "EQUALS",
  "GREATER_THAN",
  "LESS_THAN",
  "GREATER_THAN_OR_EQUAL",
  "LESS_THAN_OR_EQUAL",
  "IS_TRUE",
  "IS_FALSE",
  "CONTAINS",
] as const

const accessRuleSchema = z.object({
  attributeId: z.string().min(1, "Select an attribute"),
  // z.enum() accepts a readonly string tuple — same validation as nativeEnum
  // but doesn't require a Prisma import
  operator: z.enum(accessRuleOperators),
  value: z.string(),
})

export const positionFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  isPublic: z.boolean(),
  maxProjects: z.number().int().min(1, "Must be at least 1"),
  projectTags: z.string(),
  attributeIds: z.array(z.string()),
  accessRules: z.array(accessRuleSchema),
})

export type PositionFormData = z.infer<typeof positionFormSchema>