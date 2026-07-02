import { z } from "zod"
import { AccessRuleOperator } from "@prisma/client"

const accessRuleSchema = z.object({
  attributeId: z.string().min(1, "Select an attribute"),
  operator: z.nativeEnum(AccessRuleOperator),
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