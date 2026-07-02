import { z } from "zod"

export const attributeCategories = [
  "CERTIFICATION",
  "DOMAIN_KNOWLEDGE",
  "PERSONAL_INFORMATION",
  "SOFT_SKILLS",
] as const

export const attributeTypes = [
  "STRING",
  "TEXT",
  "IMAGE",
  "NUMERIC",
  "DATE",
  "PERIOD",
  "BOOLEAN",
  "ONE_OF_MANY",
] as const

export const attributeFormSchema = z
  .object({
    category: z.enum(attributeCategories),
    name: z.string().min(1, "Name is required").max(100),
    type: z.enum(attributeTypes),
    options: z.string().optional(), // raw textarea text, one option per line
  })
  .refine(
    (data) => {
      if (data.type !== "ONE_OF_MANY") return true
      const lines = (data.options ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
      return lines.length >= 2
    },
    { message: "Add at least 2 options, one per line", path: ["options"] }
  )

export type AttributeFormValues = z.infer<typeof attributeFormSchema>

export const attributeEditSchema = attributeFormSchema.and(
  z.object({
    id: z.string(),
    version: z.number(),
  })
)

export type AttributeEditValues = z.infer<typeof attributeEditSchema>